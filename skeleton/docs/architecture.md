# Architecture

## Overview

This agent runs as two containers in a single Kubernetes namespace:

```
Browser
  │
  ▼
┌──────────────────────────────────┐
│  Chat UI  (nginx, port 8080)     │
│  - Serves React SPA              │
│  - Reverse-proxies /api/* ──────────┐
└──────────────────────────────────┘  │
                                      ▼
                              ┌──────────────────────────────────┐
                              │  Agent  (Go, port 8000)          │
                              │  - A2A JSON-RPC 2.0 endpoint     │
                              │  - Health/readiness on port 8100 │
                              │  - Config from ConfigMap          │
                              └──────────┬───────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────────────────┐
                              │  LLM API  (${{values.llm_provider}})            │
                              │  Model: ${{values.llm_model}}       │
                              └──────────────────────────────────┘
```

## Agent Service

The agent is a Go binary built from the [DocsClaw](https://github.com/redhat-et/docsclaw) project. It exposes:

- **Port 8000** -- A2A (Agent-to-Agent) API using JSON-RPC 2.0
- **Port 8100** -- Health (`/health`) and readiness (`/ready`) probes

Configuration is mounted from a Kubernetes ConfigMap at `/config/agent/`:

| File | Purpose |
|------|---------|
| `system-prompt.txt` | The agent's personality and instructions |
| `agent-card.json` | A2A agent metadata (name, skills, capabilities) |
| `agent-config.yaml` | Tool enablement and limits (only in `with-tools` mode) |
| `prompts.json` | Prompt variants (only for `document-reviewer` preset) |

The agent's behavior is determined by the **preset** and **mode**:

- **Standalone mode** -- LLM-only, no tool access. Suitable for summarization and review tasks.
- **With-tools mode** -- Enables `exec`, `web_fetch`, `read_file`, `write_file`. The agent can run shell commands, fetch web pages, and manage files in `/tmp/agent-workspace`.

## Chat UI

A React single-page application served by nginx. Key features:

- **Document upload** -- Supports PDF, DOCX, and 40+ text file formats. PDF and DOCX text extraction happens client-side using `pdfjs-dist` and `mammoth`, reducing LLM token usage.
- **Token estimation** -- Warns when uploaded content exceeds ~200K estimated tokens.
- **File size limit** -- 10 MB per upload.

nginx serves the SPA on port 8080 and reverse-proxies `/api/*` requests to the agent service on port 8000.

## A2A Protocol

The Chat UI communicates with the agent via the [A2A (Agent-to-Agent) protocol](https://google.github.io/A2A/), a JSON-RPC 2.0-based standard:

```json
{
  "jsonrpc": "2.0",
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "unique-id",
      "role": "user",
      "parts": [{"kind": "text", "text": "Hello!"}]
    }
  }
}
```

The agent's metadata is available at `/api/.well-known/agent.json`, which describes its name, skills, and capabilities.

## Networking

Both services are exposed via OpenShift Routes with TLS edge termination:

| Route | Target |
|-------|--------|
| `${{values.component_id}}-chat-*.${{values.cluster}}` | Chat UI (port 8080) |
| `${{values.component_id}}-*.${{values.cluster}}` | Agent API (port 8000) |

Internal communication between the Chat UI and Agent uses the Kubernetes ClusterIP service (`${{values.component_id}}:8000`).

## Security

- All pods run as non-root with `seccompProfile: RuntimeDefault`
- Agent container has a read-only root filesystem
- All Linux capabilities are dropped
- LLM API keys are stored in Kubernetes Secrets, not ConfigMaps
- TLS is enforced on all external routes

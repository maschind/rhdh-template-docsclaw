# ${{values.component_id}}

${{values.description}}

| | |
|---|---|
| **Preset** | `${{values.agent_preset}}` |
| **Mode** | `${{values.agent_mode}}` |
| **LLM Provider** | `${{values.llm_provider}}` |
| **Model** | `${{values.llm_model}}` |

## URLs

| Service | URL |
|---------|-----|
| Chat UI | `https://${{values.component_id}}-chat-${{values.owner}}-${{values.component_id}}-dev.${{values.cluster}}` |
| Agent API | `https://${{values.component_id}}-${{values.owner}}-${{values.component_id}}-dev.${{values.cluster}}` |
| Source Code | `https://${{values.host}}/${{values.destination}}` |
| GitOps Repo | `https://${{values.host}}/${{values.destination}}-gitops` |

## Quick Start

1. Open the **Chat UI** link above in your browser.
2. Type a message and press Enter. The agent responds using the configured LLM.
3. Upload a document (PDF, DOCX, or text file) using the attachment button to have the agent analyze it.

The Chat UI extracts text from PDFs and DOCX files client-side before sending to the agent, which reduces token usage. Files up to 10 MB are supported.

## Repositories

This agent is managed through two Git repositories:

- **App repo** (`${{values.component_id}}`) -- Contains the agent source code, Dockerfile, Chat UI, configuration, and skills. Push here to trigger a build.
- **GitOps repo** (`${{values.component_id}}-gitops`) -- Contains Helm charts and ArgoCD applications. Push here to change deployment configuration (system prompt, LLM settings, replicas, etc.).

# ${{values.component_id}}

${{values.description}}

## Overview

This is a [DocsClaw](https://github.com/redhat-et/docsclaw) AI agent deployment.

- **LLM Provider:** ${{values.llm_provider}}
- **Model:** ${{values.llm_model}}
- **Mode:** ${{values.agent_mode}}

## Configuration

Agent configuration files are in the `config/` directory:

- `system-prompt.txt` — The agent's system prompt
- `agent-card.json` — A2A protocol metadata
- `agent-config.yaml` — Tool-use and loop configuration

## Building

The Dockerfile clones and builds docsclaw from upstream, then layers your configuration on top:

```bash
docker build -t ${{values.component_id}} .
```

## Running Locally

```bash
export LLM_API_KEY=your-api-key
docker run -e LLM_API_KEY -p 8000:8000 ${{values.component_id}}
```

## Testing

```bash
curl -X POST http://localhost:8000/a2a \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/send","id":"1",
       "params":{"message":{"messageId":"m1","role":"user",
       "parts":[{"kind":"text","text":"Hello"}]}}}'
```

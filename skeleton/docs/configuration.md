# Configuration

All runtime configuration lives in the **GitOps repo** (`${{values.component_id}}-gitops`). Changes pushed there are automatically synced by ArgoCD.

## System Prompt

The system prompt defines the agent's personality and behavior. It is stored in the Helm values and injected into the agent via a ConfigMap.

To change the system prompt, edit the Helm values in the ArgoCD application or update the GitOps repo:

```yaml
# In the ArgoCD app or gitops values
agent:
  systemPrompt: |
    You are a helpful assistant specialized in...
```

After pushing to the GitOps repo, ArgoCD will sync and the agent pod will restart with the new prompt.

## Agent Presets

| Preset | Mode | Tools | Skills | Use Case |
|--------|------|-------|--------|----------|
| `research-assistant` | with-tools | exec, web_fetch, read_file, write_file | url-summary, code-review | General research with web access |
| `document-summarizer` | standalone | none | none | Single-shot document summaries |
| `document-reviewer` | standalone | none | none | Compliance and security reviews (with prompt variants) |
| `document-researcher` | with-tools | exec, web_fetch, read_file, write_file, fetch_document | pdf-summary | Document research with PDF fetching |
| `custom` | configurable | depends on mode | none | Your own system prompt |

## Tools

When the agent runs in `with-tools` mode, these tools are available:

| Tool | Description |
|------|-------------|
| `exec` | Run shell commands (30s timeout, 50KB max output) |
| `web_fetch` | Fetch web pages and extract content |
| `read_file` | Read files from `/tmp/agent-workspace` |
| `write_file` | Write files to `/tmp/agent-workspace` |
| `fetch_document` | Fetch documents from URLs or S3 (document-researcher only) |

Tool configuration is in `config/agent-config.yaml` in the app repo. The agent iterates up to 10 tool-use loops per request.

## Skills

Skills are pre-built prompt templates the agent can invoke. Available skills depend on the preset:

| Skill | Presets | Description |
|-------|---------|-------------|
| `url-summary` | research-assistant | Fetch a URL and produce a structured summary |
| `code-review` | research-assistant | Review code for bugs, security issues, and style |
| `pdf-summary` | document-researcher | Extract and summarize PDF content |
| `resume-screener` | (available in config) | Screen resumes against job requirements |
| `policy-comparator` | (available in config) | Compare policy documents for differences |
| `checklist-auditor` | (available in config) | Audit documents against compliance checklists |

To add a custom skill, create a YAML file in `config/skills/` in the app repo:

```yaml
name: my-skill
description: What this skill does
prompt: |
  Analyze the following input and...
  {input}
```

## LLM Provider

The LLM provider and model are configured in the Helm values:

```yaml
llm:
  provider: ${{values.llm_provider}}   # anthropic, openai, or litellm
  model: ${{values.llm_model}}
  baseUrl: ""           # required for openai and litellm providers
  apiKey: "sk-..."      # stored as a Kubernetes Secret
```

To switch providers or models, update the GitOps repo values and ArgoCD will sync the change.

## Chat UI Features

The Chat UI supports uploading files for the agent to analyze:

| Format | Extraction | Notes |
|--------|-----------|-------|
| PDF | Client-side via pdfjs | Text extracted in browser before sending |
| DOCX | Client-side via mammoth | Converted to text in browser |
| Text files | Direct | 40+ extensions (.py, .go, .yaml, .json, etc.) |
| Binary files | Not supported | Images, executables, archives are rejected |

- **Max file size**: 10 MB
- **Token warning**: UI warns when content exceeds ~200K estimated tokens

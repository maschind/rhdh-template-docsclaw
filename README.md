# DocsClaw RHDH Software Template

Red Hat Developer Hub Software Template for deploying [DocsClaw](https://github.com/redhat-et/docsclaw) AI agents on OpenShift with ArgoCD GitOps and Tekton CI/CD.

## Overview

This template enables self-service creation of AI agents through RHDH. A developer fills in a 3-page form (agent config, image registry, repo host) and the template scaffolds:

1. **Application Repository** (GitLab) -- Dockerfile, agent configuration, chat UI source code
2. **GitOps Repository** (GitLab) -- Helm charts + ArgoCD Application definitions
3. **ArgoCD Applications** -- Build pipeline + agent deployment, auto-synced

Within minutes the developer has a running AI agent with a chat frontend, a CI/CD pipeline, and GitOps-managed deployments.

## Architecture

```
                    +------------------+
                    |   RHDH Template  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------v--------+          +--------v--------+
     |  App Repo (GL)   |          | GitOps Repo (GL) |
     |  - Dockerfile    |          | - Helm charts    |
     |  - config/       |          | - ArgoCD apps    |
     |  - chat-ui/      |          +--------+---------+
     +--------+---------+                   |
              |                    +--------v--------+
              |                    |   ArgoCD Sync    |
              |                    +--------+---------+
              |                             |
     +--------v--------+          +--------v--------+
     | Tekton Pipeline  |          |   OpenShift      |
     | - git-clone      |          | +- Agent Pod     |
     | - build agent    |  ------> | +- Chat UI Pod   |
     | - build chat-ui  |          | +- Routes (TLS)  |
     | - resync         |          +---------+--------+
     +------------------+                    |
                                    +--------v--------+
                                    |    Browser       |
                                    |  Chat UI (nginx) |
                                    |   /api/* -> Agent|
                                    +-----------------+
```

The chat UI (React + nginx) reverse-proxies `/api/*` requests to the agent's A2A endpoint, avoiding CORS issues. Both images are built in parallel by Tekton.

## Agent Presets

| Preset | Mode | Tools | Skills | Use Case |
|--------|------|-------|--------|----------|
| `research-assistant` | with-tools | exec, web_fetch, read_file, write_file | url-summary, code-review | Research, web scraping, code analysis |
| `document-summarizer` | standalone | none | document-summarization | Single-shot document summaries |
| `document-reviewer` | standalone | none | document-review | Compliance/security review with prompt variants |
| `document-researcher` | with-tools | exec, web_fetch, read_file, write_file, fetch_document | pdf-summary, url-summary | Multi-document research, PDF analysis |
| `custom` | configurable | depends on mode | none | User-defined system prompt |

### Prompt Variants (document-reviewer)

The document-reviewer preset includes two alternate review modes:

- **compliance** -- Checks against GDPR, SOC2, ISO 27001 principles. Returns compliance score (1-10), specific violations, and remediation steps.
- **security** -- Identifies sensitive data exposure, access control gaps, and security policy violations. Returns risk level assessment.

### Skills

Pre-built skill definitions included with the template:

| Skill | Description |
|-------|-------------|
| `url-summary` | Fetch a URL and produce a structured summary |
| `code-review` | Review code for bugs, security issues, and style |
| `pdf-summary` | Convert PDF to text and summarize key points |
| `resume-screener` | Screen resumes against job requirements |
| `policy-comparator` | Compare policy documents for differences |
| `checklist-auditor` | Audit documents against compliance checklists |

## Template Parameters

### Page 1: Agent Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `component_id` | string | yes | `my-docsclaw-agent` | Unique name (max 18 chars) |
| `description` | string | no | `A DocsClaw AI agent` | Agent description |
| `agent_preset` | enum | yes | `research-assistant` | Pre-configured persona (see table above) |
| `llm_provider` | enum | yes | `anthropic` | `anthropic`, `openai`, or `litellm` |
| `llm_model` | string | yes | `claude-sonnet-4-6` | Model name for the chosen provider |
| `llm_api_key` | secret | no | -- | API key for the LLM provider |
| `agent_mode` | enum | no | `with-tools` | `standalone` (LLM only) or `with-tools` |
| `system_prompt` | text | conditional | -- | Only shown when preset is `custom` |
| `llm_base_url` | string | conditional | varies | Only shown for `openai` or `litellm` providers |

### Page 2: Image Registry

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `image_registry` | enum | -- | `OpenShift` (internal) or `Quay` |
| `image_host` | string | `image-registry.openshift-image-registry.svc:5000` | Registry host |
| `image_tag` | string | `latest` | Image tag |
| `image_password` | secret | -- | Quay password (Quay only) |

### Page 3: Repository

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `repo.host` | string | GitLab host | Source control host |

## Helm Chart Configuration

### Agent Deployment (`docsclaw-template/values.yaml`)

#### Core Settings

```yaml
replicaCount: 1
nameOverride: ""

image:
  pullPolicy: Always
  registry: ""        # "OpenShift" or "Quay"
  host: ""            # Registry host
  organization: ""    # Image org (Quay) / namespace (OpenShift)
  name: ""            # Image name
  tag: ""             # Image tag
```

#### LLM Provider

```yaml
llm:
  provider: anthropic     # anthropic | openai | litellm
  model: claude-sonnet-4-6
  baseUrl: ""             # Required for openai/litellm
  apiKey: ""              # From Kubernetes Secret
```

**Example: Using LiteLLM / MaaS proxy**
```yaml
llm:
  provider: litellm
  model: granite-3.3-8b-instruct
  baseUrl: https://litellm-prod.apps.example.com/v1
  apiKey: sk-maas-key-here
```

**Example: Using Anthropic directly**
```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-6
  apiKey: sk-ant-api03-...
```

#### Agent Personality

```yaml
agent:
  systemPrompt: "You are a helpful assistant."
  mode: with-tools      # standalone | with-tools
  preset: custom         # custom | research-assistant | document-summarizer | document-reviewer | document-researcher
  promptVariants: ""     # JSON string with named prompt variants
  agentCard: ""          # JSON string with A2A agent card metadata
```

**Example: Custom agent with specific tools**
```yaml
agent:
  mode: with-tools
  preset: custom
  systemPrompt: |
    You are a Kubernetes troubleshooting assistant.
    Use exec to run kubectl commands and diagnose issues.
    Use web_fetch to look up error messages in documentation.
```

**Example: Document reviewer with prompt variants**
```yaml
agent:
  mode: standalone
  preset: document-reviewer
  promptVariants: |
    {
      "compliance": "You are a GDPR compliance reviewer...",
      "security": "You are a security audit reviewer..."
    }
```

#### Chat UI

```yaml
chatUI:
  enabled: true
  replicaCount: 1
  image:
    registry: ""
    host: ""
    organization: ""
    name: ""          # Derived as {component_id}-chat
    namespace: ""
    tag: ""
  resources:
    requests:
      cpu: 50m
      memory: 32Mi
    limits:
      cpu: 200m
      memory: 64Mi
  service:
    type: ClusterIP
    port: 8080
```

#### Service & Networking

```yaml
service:
  type: ClusterIP
  port: 8000          # Agent A2A API port
  healthPort: 8100    # Health/readiness probes

route:
  host: ""            # Auto-generated if empty
  path: /
```

#### Resource Limits

```yaml
resources:
  requests:
    cpu: 100m
    memory: 64Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

#### Autoscaling

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
```

### Build Pipeline (`docsclaw-build/values.yaml`)

```yaml
git:
  branch: main
  repo: ""            # Application source repo URL
  host: ""            # GitLab host

image:
  dockerfile: ./Dockerfile             # Agent Dockerfile path
  dockerfileUI: ./chat-ui/Dockerfile   # Chat UI Dockerfile path
  registry: ""
  organization: ""
  host: ""
  name: ""            # Agent image name
  nameUI: ""          # Chat UI image name ({component_id}-chat)
  tag: ""
  password: ""

cluster:
  subdomain: ""       # OpenShift apps subdomain
```

## Role-Based Workflows

### Platform Engineer

The platform engineer manages the template and infrastructure:

1. **Register the template** in the RHDH catalog
2. **Configure LLM access** -- set up API keys, MaaS proxy endpoints, or LiteLLM routers
3. **Customize presets** -- add organization-specific system prompts, compliance rules, or tool allowlists
4. **Monitor deployments** -- health endpoints at `/health` and `/ready` on port 8100
5. **Manage security** -- control which tools are available, set resource limits, configure image scanning

**Golden path example**: The PE creates a `document-reviewer` preset with organization-specific compliance rules baked into the prompt variants, then publishes it as a template for developers to self-service.

### Developer

The developer creates and uses agents:

1. **Scaffold an agent** from the RHDH catalog -- fill in the 3-page form
2. **Wait for pipeline** -- Tekton builds both agent and chat UI images (~2 min)
3. **Open the chat UI** -- accessible via the OpenShift route
4. **Upload files** -- attach code, documents, or PDFs via the paperclip button
5. **Iterate on config** -- push changes to the app repo, pipeline auto-rebuilds

**Example workflows**:

- **Code review**: Scaffold a `research-assistant`, upload a source file, ask "Review this code for security issues"
- **Compliance check**: Scaffold a `document-reviewer`, upload a policy document, ask "Check compliance with GDPR"
- **Research**: Scaffold a `research-assistant`, ask "Fetch the Go 1.24 release notes and summarize the security changes"

## Chat UI

The chat UI is a React/TypeScript SPA served by nginx. It provides:

- **Real-time chat** with the agent via the A2A JSON-RPC protocol
- **File uploads** -- paperclip button or drag-and-drop (up to 5MB)
- **Markdown rendering** of agent responses (code blocks, lists, etc.)
- **Agent info header** showing name, description, and available skills
- **Dark theme** with responsive layout

The nginx reverse proxy handles the routing:

| Path | Target |
|------|--------|
| `/` | React SPA (static files) |
| `/api/*` | Agent A2A endpoint (`http://{service}:8000/`) |

## Build Pipeline

The Tekton pipeline runs 4 tasks:

```
git-clone
    |
    +---> build-and-push-image    (agent, ./Dockerfile)
    |
    +---> build-and-push-chat-ui  (chat UI, ./chat-ui/Dockerfile, CONTEXT=./chat-ui)
    |
    +---> resync                  (ArgoCD refresh, runs after both builds)
```

Both builds run in parallel after `git-clone`. The pipeline supports both OpenShift internal registry and Quay.

A webhook trigger (`EventListener` + `TriggerTemplate`) can auto-trigger the pipeline on git push events.

## Security

- **Pod security**: `runAsNonRoot`, seccomp `RuntimeDefault`
- **Container security**: `readOnlyRootFilesystem`, no privilege escalation, all capabilities dropped
- **Network**: TLS edge termination on all routes with HTTP-to-HTTPS redirect
- **Secrets**: LLM API keys stored in Kubernetes Secrets, image registry credentials in separate secrets
- **Chat UI**: `nginxinc/nginx-unprivileged` image, emptyDir volumes for writable paths only

## Project Structure

```
rhdh-template-docsclaw/
├── template.yaml                    # RHDH template definition (3-page form)
├── skeleton/                        # Scaffolded application source
│   ├── Dockerfile                   # Multi-stage Go build from upstream docsclaw
│   ├── catalog-info.yaml            # Backstage component metadata
│   ├── config/
│   │   ├── system-prompt.txt        # Agent system prompt (per-preset)
│   │   ├── agent-card.json          # A2A protocol metadata (per-preset)
│   │   ├── agent-config.yaml        # Tool config (conditional on mode/preset)
│   │   ├── prompts.json             # Prompt variants (document-reviewer only)
│   │   └── skills/                  # Skill definitions (6 skills)
│   ├── chat-ui/                     # React + Vite + TypeScript SPA
│   │   ├── Dockerfile               # node:22 build -> nginx:1.27 runtime
│   │   ├── nginx.conf               # Reverse proxy config
│   │   ├── package.json
│   │   └── src/                     # React components, API client, types
│   └── docs/                        # TechDocs placeholder
└── manifests/                       # GitOps deployment resources
    ├── argocd/
    │   ├── argocd-app-dev.yaml      # Agent + Chat UI deployment
    │   └── argocd-app-dev-build.yaml # Tekton pipeline deployment
    └── helm/
        ├── docsclaw-template/       # Agent deployment chart
        │   ├── values.yaml
        │   └── templates/           # Deployment, Service, Route, ConfigMap, etc.
        └── docsclaw-build/          # Build pipeline chart
            ├── values.yaml
            └── templates/           # Pipeline, TriggerTemplate, EventListener, etc.
```

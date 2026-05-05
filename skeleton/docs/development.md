# Development

## Repository Structure

### App Repo (`${{values.component_id}}`)

```
├── Dockerfile              # Multi-stage build for the Go agent
├── chat-ui/
│   ├── Dockerfile          # React SPA + nginx
│   ├── src/                # React components, API client, types
│   └── nginx.conf          # Reverse proxy config
├── config/
│   ├── agent-config.yaml   # Tool enablement and limits
│   └── skills/             # Skill prompt templates (YAML)
├── docs/                   # TechDocs (this documentation)
└── catalog-info.yaml       # Backstage entity definitions
```

### GitOps Repo (`${{values.component_id}}-gitops`)

```
├── argocd/
│   ├── argocd-app-dev.yaml       # ArgoCD Application (deployment)
│   └── argocd-app-dev-build.yaml # ArgoCD Application (build pipeline)
└── helm/
    ├── docsclaw-template/        # Helm chart for agent + chat UI
    └── docsclaw-build/           # Helm chart for Tekton pipeline
```

## CI/CD Pipeline

A Tekton pipeline runs automatically when you push to the app repo.

```
git push
  │
  ▼
GitLab Webhook
  │
  ▼
Tekton EventListener
  │
  ▼
PipelineRun
  ├── git-clone
  ├── build-and-push-image  (agent)     ─┐
  ├── build-and-push-chat-ui (chat UI)  ─┤
  └── resync (restart pods)             ◄─┘
```

The pipeline builds both container images in parallel, pushes them to the image registry, then restarts the pods to pick up the new images.

**Pipeline timeout**: 1 hour.

## Making Changes

### Change the system prompt

Edit the Helm values in the GitOps repo under `argocd/argocd-app-dev.yaml`:

```yaml
agent:
  systemPrompt: |
    Your new system prompt here...
```

Push to the GitOps repo. ArgoCD syncs automatically.

### Change the LLM model

Update the LLM section in the same ArgoCD app values:

```yaml
llm:
  provider: anthropic
  model: claude-sonnet-4-6
```

### Add a custom skill

1. Create a new YAML file in `config/skills/` in the app repo:

    ```yaml
    name: my-custom-skill
    description: Describe what this skill does
    prompt: |
      Instructions for the LLM...
      {input}
    ```

2. Push to the app repo. The Tekton pipeline rebuilds and deploys.

### Modify the Chat UI

The Chat UI source is in `chat-ui/`. It uses React 19, TypeScript, and Vite:

```bash
cd chat-ui
npm install
npm run dev     # Local dev server on port 5173
npm run build   # Production build
```

The nginx config in `chat-ui/nginx.conf` proxies `/api/*` to the agent service. For local development, you'll need the agent running locally or update the proxy target.

### Modify the agent configuration

Agent tools and limits are in `config/agent-config.yaml`:

```yaml
tools:
  exec:
    enabled: true
    timeout: 30
    max_output: 50000
  web_fetch:
    enabled: true
loop:
  max_iterations: 10
workspace:
  path: /tmp/agent-workspace
```

Push to the app repo to rebuild.

## Monitoring

### Check agent health

```bash
# Health probe
curl https://${{values.component_id}}-${{values.owner}}-${{values.component_id}}-dev.${{values.cluster}}/health

# Readiness probe
curl https://${{values.component_id}}-${{values.owner}}-${{values.component_id}}-dev.${{values.cluster}}/ready
```

### View agent metadata

```bash
curl https://${{values.component_id}}-${{values.owner}}-${{values.component_id}}-dev.${{values.cluster}}/.well-known/agent.json
```

### Check pod logs

```bash
# Agent logs
oc logs -n ${{values.owner}}-${{values.component_id}}-dev -l app.kubernetes.io/name=${{values.component_id}}

# Chat UI logs
oc logs -n ${{values.owner}}-${{values.component_id}}-dev -l app.kubernetes.io/name=${{values.component_id}}-chat
```

### View pipeline runs

Check the **CI** tab in the RHDH component view, or:

```bash
oc get pipelineruns -n ${{values.owner}}-${{values.component_id}}-dev
```

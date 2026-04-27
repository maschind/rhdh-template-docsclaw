# DocsClaw RHDH Software Template

Red Hat Developer Hub Software Template for deploying [DocsClaw](https://github.com/redhat-et/docsclaw) AI agents on OpenShift with ArgoCD GitOps and Tekton CI/CD.

## What This Template Creates

When a user scaffolds a new component from this template, it creates:

1. **Application Repository** (GitLab) — Contains a Dockerfile that builds docsclaw from upstream and layers the user's agent configuration (system prompt, agent card, tool config).

2. **GitOps Repository** (GitLab) — Contains Helm charts and ArgoCD Application definitions for deploying both the agent and the Tekton build pipeline.

3. **ArgoCD Applications** — Two applications are created:
   - **dev-build**: Tekton pipeline that builds the container image on every git push
   - **dev**: The running docsclaw agent deployment

## Template Parameters

- **Agent Configuration**: Component name, LLM provider/model/API key, system prompt, agent mode (standalone vs with-tools)
- **Image Registry**: OpenShift internal registry or Quay
- **Repository**: GitLab host

## Structure

```
rhdh-template-docsclaw/
├── template.yaml              # RHDH template definition
├── skeleton/                  # Scaffolded application files
│   ├── Dockerfile             # Multi-stage build from upstream docsclaw
│   ├── config/                # Agent configuration
│   └── catalog-info.yaml      # Backstage component metadata
└── manifests/                 # GitOps deployment resources
    ├── argocd/                # ArgoCD Application definitions
    └── helm/
        ├── docsclaw-template/ # App deployment Helm chart
        └── docsclaw-build/    # Tekton pipeline Helm chart
```

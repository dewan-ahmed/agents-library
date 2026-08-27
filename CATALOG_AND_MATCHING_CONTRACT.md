# Catalog and matching contract

Status: Phase 2 draft  
Date: 2026-08-21

This file is the data contract for the public library. No application code yet.

## Locked catalog decisions

- Launch catalog: Harness verified and Harness managed worker agents only.
- Pipeline examples: copyable YAML (v1 pipeline syntax unless a specific example requires v0).
- Conversion: learn, copy YAML, Open in Harness.
- Source of truth: curated files in this repo.
- Personalization without login: optional `accountId`, `orgId`, `projectId`.

## Why optional scope IDs are the right v1 move

The site cannot call Harness APIs without authentication. It also should not block learning behind a login.

Account, org, and project IDs are already visible in Harness console URLs. Collecting them in the browser lets the library:

1. Build an **Open in Harness** deep link for a system worker agent.
2. Fill `orgIdentifier` / `projectIdentifier` (and any `{{accountId}}` tokens) in copyable pipeline YAML.

That is personalization, not integration. The site still does not create agents, pipelines, or connectors.

## Progressive disclosure

| Visitor state | Learn | Browse | Copy YAML | Open in Harness |
| --- | --- | --- | --- | --- |
| No IDs | Yes | Yes | Yes, with `{{accountId}}` / `{{orgId}}` / `{{projectId}}` placeholders | Disabled, with a short prompt to add scope |
| IDs present | Yes | Yes | Yes, identifiers substituted | Enabled deep link |

Do not ask for IDs before the first match. Put a compact **Your Harness project** control in the top bar or next to Copy / Open. Persist in `localStorage` only.

## Open in Harness URL

Canonical template for project-scoped system agents:

```
https://app.harness.io/ng/account/{accountId}/all/ai-agents/orgs/{orgId}/projects/{projectId}/agents/{agentId}?type=system
```

Example:

```
https://app.harness.io/ng/account/GOQyvjGBTH-kGrhBtPI2eA/all/ai-agents/orgs/SANDBOX/projects/dewanahmed/agents/remediationAgent?type=system
```

Rules:

- `{agentId}` comes from curated catalog `harnessAgentId`, not from the display name.
- `type=system` is required for Harness managed/verified worker agents.
- Default base URL is `https://app.harness.io`. Optional later: cluster override (`app.harness.eu`, SMP, QA).
- If an agent is ever org- or account-scoped, store a `linkTemplate` on that record instead of forcing the project path.
- The link is a navigation target only. A 404 or permission error is handled in Harness, not on this site. v1 will not probe the URL.

## Copyable pipeline YAML

Each pipeline example stores a YAML **template**, not a screenshot of one customer’s pipeline.

Substitution tokens:

| Token | Source |
| --- | --- |
| `{{accountId}}` | Visitor scope |
| `{{orgId}}` | Visitor scope |
| `{{projectId}}` | Visitor scope |
| `{{agentId}}` | Catalog agent record when the example references a specific agent |

Still **not** substituted from scope IDs (keep as runtime inputs or documented placeholders):

- LLM connector
- Git / MCP / cloud connectors
- Secrets
- Repo name, branch, PR number, and other run-time inputs

v1 honesty: copied YAML is ready to paste into a pipeline editor after the visitor maps connectors. It is not guaranteed to run as-is.

Until we confirm the exact worker-agent step syntax against a known-good Harness pipeline, every example YAML should be reviewed against a real pipeline in a Harness project. The catalog field `yamlVerifiedIn` records that check.

## Agent record

Curated path (proposed): `catalog/agents/<harnessAgentId>.yaml`

```yaml
id: remediationAgent                 # stable library id; same as Harness system agent id when possible
harnessAgentId: remediationAgent
name: Auto-Remediation
summary: Fixes scan findings, validates the fix branch, and opens a pull request.
description: |
  Longer detail for the agent page.
ownership: harness_managed           # harness_verified | harness_managed
lifecycle: [secure, build]
modules: [sto, scs, ci]
triggers: [scan_finding, pull_request]
scope: project
version: 1.0.0
linkType: system
linkTemplate: null                   # override only if the canonical URL shape does not apply
inputs:
  - name: llmConnector
    type: connector
    required: true
outputs:
  - pull_request
prerequisites:
  - LLM connector
  - Git connector with write access
keywords:
  - remediate
  - scan finding
  - pull request
relatedPipelineIds:
  - pr-security-remediation
```

Matching uses `summary`, `description`, `keywords`, `lifecycle`, `modules`, `triggers`, and `prerequisites`. Ranking must be explainable from those fields.

## Pipeline example record

Curated path (proposed): `catalog/pipelines/<id>.yaml` plus `catalog/pipelines/<id>.pipeline.yaml`

Frontmatter / metadata file:

```yaml
id: pr-security-remediation
name: PR security remediation
summary: Remediate scan findings, re-scan, then run a PR security review.
lifecycle: [secure, build]
modules: [sto, ci]
triggers: [scan_finding, pull_request]
complexity: intermediate
agentIds:
  - remediationAgent
  - claudeCodeSecurityReview
yamlFile: pr-security-remediation.pipeline.yaml
yamlVerifiedIn: null                 # Harness account/project where this YAML was last pasted successfully
```

The sibling `.pipeline.yaml` contains the copyable template with `{{orgId}}`, `{{projectId}}`, and agent ids. Pipeline `identifier` can stay example-specific and human-readable.

## Matching object (runtime, not stored)

```yaml
interpretedGoal: string
confidence: high | medium | low
assumptions: [string]
agents:
  - id: remediationAgent
    roleInSolution: string
    matchReasons: [string]
pipelines:
  - id: pr-security-remediation
    roleInSolution: string
    matchReasons: [string]
```

Open / Copy are derived at render time from this object plus optional browser scope.

## What we will not do in v1

- Call Harness to verify IDs, list the visitor’s agents, or create resources.
- Put scope IDs on shareable URLs.
- Invent Community agents.
- Claim copied YAML is production-ready without connector mapping.

## Next artifact

User-supplied files in `catalog/incoming/` (3 agents, 3 pipeline YAMLs). Normalize those into `catalog/agents/` and `catalog/pipelines/`, then build v1 per `HANDOFF_V1.md`.

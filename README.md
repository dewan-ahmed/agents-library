# Harness AI Agents Library

Public, unauthenticated catalog. Describe a problem to match worker agents and copyable pipeline YAML, or browse the library.

This site is a discovery and copy catalog. It does not create agents or pipelines in your Harness account. To run an agent, paste the YAML into your project or open the agent in the Harness console.

## Worker Agents

[Worker Agents](https://developer.harness.io/docs/platform/harness-ai/core-capabilities/in-your-pipelines/worker-agent/) are AI steps that run inside Harness pipelines. Each agent combines instructions, an LLM (model) connector, optional MCP connectors, and inputs into a reusable, governed step you can add to CI, CD, IaCM, STO, SCS, or Custom stages.

In the Harness console, open **AI → Worker Agents**. The catalog has:

- **Marketplace** — Harness Certified and Harness Managed agents (this library includes the stable managed set)
- **Custom** — agents your team creates in the project

You need pipeline, connector, and secret permissions, plus a Model Connector (Anthropic, OpenAI, Bedrock, and similar). MCP is optional unless the agent calls platform or SCM tools. Full setup, RBAC, and how to create agents from the UI, Harness AI Chat, or IDE via MCP are in the [Worker Agents overview](https://developer.harness.io/docs/platform/harness-ai/core-capabilities/in-your-pipelines/worker-agent/).

## Run this library

```bash
cd web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## What is in this version

- Homepage chat/search across 31 Harness-managed marketplace agents plus 16 curated custom agents
- Browse `/agents` and all 47 corresponding pipeline samples with filters, including an **enterprise** use-case filter for the customer worker agents
- **Lifecycle** cloud at `/lifecycle` showing how many agents contribute to each delivery stage
- Optional account / org / project IDs in the browser only
- **Open in Harness** using each agent's `type=system` or `type=custom`
- **Copy YAML** with `{{orgId}}` / `{{projectId}}` substitution
- Configuration checklists derived from each stable agent template's input schema

These files are the source catalog:

- `catalog/incoming/` — original dumps
- `catalog/catalog.json` — curated custom agents and pipeline metadata
- `catalog/marketplace.json` — generated stable Harness marketplace catalog
- `catalog/marketplace-pipelines.json` — generated marketplace pipeline metadata
- `catalog/marketplace-agents/*.yaml` — raw stable marketplace templates
- `catalog/pipelines/**/*.pipeline.yaml` — copyable custom and marketplace templates

The PAT secret in the test-summarizer pipeline was replaced with `harness_code_pat` in the copyable YAML.

## Advanced customer worker agents

Six custom agents are meant to run in a customer's Harness project. Five of them
target Harness CI/Code, optional Confluence/Jira via Atlassian MCP, and optional Slack:

`ca_pipeline_failure_rca`, `ca_change_advisory`, `ca_security_finding_triage`,
`ca_runbook_drift`, and `ca_incident_comms`.

`ca_container_vuln_remediation` is the sixth. It remediates container image CVEs
from STO/Trivy findings by editing Dockerfiles in one pass. The sample pipeline
rebuilds a local image (`PLUGIN_NO_PUSH=true`), rescans, and can open a GitHub PR.

The first five share one architecture:

- A first step installs Node for `harness-mcp-v2`, writes the Harness PAT to a
  `0600` file, and emits `/harness/.agent/mcp-servers.json`.
- Connector-backed Atlassian MCP (type `Mcp`, not a native Confluence connector)
  is mounted through `mcpConnectors`.
- An optional team skill pack is sparse-checked out into
  `/harness/.agent/plugins/team-skills`, and those skills override the inline
  instructions.
- The agent writes `/harness/.agent/output/summary.md`; the pipeline exports it
  and decides whether to post to Slack. Agents never post.

Replace `YOUR_LLM_CONNECTOR`, `YOUR_MODEL_ID`, and `YOUR_ATLASSIAN_MCP_CONNECTOR`
before use. End-to-end setup, request JSON examples, and which writes are
flag-gated are in [docs/customer-agent-usage.md](docs/customer-agent-usage.md).

## Governance auditors

Four additional custom agents are read-only Harness MCP scanners (not tagged
`enterprise`): hardcoded values / inline secrets, production CD rollback gaps,
native-step migration, and pipeline/template duplication. Replace
`YOUR_HARNESS_MCP_CONNECTOR` before use. They never create or update Harness
resources.

## Validate the catalog

Custom agent+pipeline combos only. Marketplace samples under `catalog/pipelines/marketplace/` are generated and are not part of this gate.

```bash
cd web
npm run validate:catalog
```

This parses every custom agent and pipeline YAML, checks that each pipeline's `agentName` matches `catalog.json`, and requires a 1:1 combo list in `catalog/test/combos.json`. After adding a custom pair, regenerate that list:

```bash
cd web
node scripts/validate-catalog.mjs --write-combos
```

A sample Harness pipeline that clones this repo and runs the same check is `catalog/test/validate-custom-combos.pipeline.yaml`. It is a test harness, not a catalog product pipeline.

## Refresh the marketplace

```bash
cd web
HARNESS_API_KEY="$HARNESS_API_KEY" npm run sync:marketplace
```

The sync reads Harness's global stable `Agent` templates and regenerates a reusable
pipeline sample for every agent. It never writes to Harness.

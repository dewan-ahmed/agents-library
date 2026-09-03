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

- Homepage chat/search across 31 Harness-managed marketplace agents plus 11 curated custom agents
- Browse `/agents` and all 42 corresponding pipeline samples with filters
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

## Advanced multi-provider agents

Five custom agents go beyond a single agent step and are meant to run in a customer's own
environment against their own providers: `ca_oncall_rca`, `ca_change_advisory`,
`ca_security_finding_triage`, `ca_runbook_drift`, and `ca_incident_comms`.

They share one architecture:

- A first step installs stdio MCP runtimes (`uvx` for Grafana and PagerDuty, Node for
  `harness-mcp-v2`), writes each credential to a `0600` file rather than interpolating it into a
  script, and emits `/harness/.agent/mcp-servers.json`.
- Connector-backed MCP (Atlassian) is mounted separately through `mcpConnectors`.
- An optional team skill pack is sparse-checked out into
  `/harness/.agent/plugins/team-skills`, and those skills override the inline instructions.
- The agent writes `/harness/.agent/output/summary.md`; the pipeline exports it and decides
  whether to post to Slack. Agents never post.

Every credential is an input backed by a Harness secret expression, and tenant-specific values
such as the Atlassian `cloudId` are inputs, so nothing account-specific lives in this repo.
Replace the `YOUR_LLM_CONNECTOR`, `YOUR_MODEL_ID`, `YOUR_ATLASSIAN_MCP_CONNECTOR`, and
`monitoring.example.com` placeholders before use.

## Validate the catalog

```bash
cd web
node scripts/validate-catalog.mjs
```

This parses every agent and pipeline YAML and checks that each pipeline's `agentName` matches the
`agentIds` and `yamlFile` recorded in `catalog/catalog.json`.

## Refresh the marketplace

```bash
cd web
HARNESS_API_KEY="$HARNESS_API_KEY" npm run sync:marketplace
```

The sync reads Harness's global stable `Agent` templates and regenerates a reusable
pipeline sample for every agent. It never writes to Harness.

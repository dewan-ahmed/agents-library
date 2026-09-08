# Using the customer worker agents

Six custom agents are meant to run in a customer's Harness project. They are tagged
`enterprise` in the catalog.

**MCP + optional Slack** (shared architecture below):

- `ca_pipeline_failure_rca`
- `ca_change_advisory`
- `ca_security_finding_triage`
- `ca_runbook_drift`
- `ca_incident_comms`

**Dockerfile / STO remediator** (no Atlassian MCP, no Slack from the agent):

- `ca_container_vuln_remediation`

## MCP agents

These five use:

- a **Harness LLM / model connector**
- a **Harness PAT** (local `harness-mcp-v2` stdio MCP)
- an optional **Atlassian MCP connector** for Confluence and Jira
- optional **Slack** posting from the pipeline, not from the agent

They do **not** use PagerDuty, Grafana, or native Harness `Confluence` connectors.

A native Harness connector of type `Confluence` cannot be mounted on a Worker Agent. Worker Agents only resolve connectors of type `Mcp` through `mcpConnectors`. Use Atlassian Rovo MCP at `https://mcp.atlassian.com/v2/mcp`.

### Connectors

| What | Connector type | Placeholder in catalog YAML | Role |
| --- | --- | --- | --- |
| LLM | Anthropic, OpenAI, Bedrock, or similar | `account.YOUR_LLM_CONNECTOR` | Model for the agent step |
| Model id | string | `YOUR_MODEL_ID` | A model that connector can serve |
| Atlassian | `Mcp` | `YOUR_ATLASSIAN_MCP_CONNECTOR` | Confluence + Jira tools |
| Native Confluence | `Confluence` | — | **Not used by these agents** |

Set the agent's `mcpConnectors` input to your MCP connector identifier. Leave the catalog placeholder until you replace it.

If the MCP connector is omitted, agents still run. They must write `Confluence not configured` in the relevant section and continue with Harness evidence only.

### Secrets and other inputs

Every credential is a Harness **secret expression**, never a literal:

```
harness_api_key_secret: <+secrets.getValue("harness_pat")>
slack_bot_token_secret: <+secrets.getValue("YOUR_SLACK_BOT_TOKEN")>
```

Always pass:

- `llmConnector` and `modelName`
- `team_name`
- `harness_api_key_secret`, `harness_account_id`, `harness_org`, `harness_project`
- `request_json` (see shapes below)

Pass when using Confluence or Jira:

- `mcpConnectors` = the MCP connector
- `atlassian_cloud_id` if the Atlassian tools require it
- space, project, or template fields for that agent

Pass to post to Slack:

- `slack_bot_token_secret` (needs `chat:write`)
- `slack_channel_id` **or** a Slack message permalink in `slack_thread_ts`

Leave both Slack fields empty to skip posting. The summary still appears in the Export Summary step logs.

### How a run works

1. **Prepare Request** validates `request_json` and base64-encodes it.
2. **Install MCP Runtimes** writes the Harness PAT to a `0600` file, starts `harness-mcp-v2`, and optionally checks out a team skill pack.
3. **Agent** reads `/harness/.agent/context/agent-request.json`, uses Harness MCP plus optional Atlassian MCP, writes `/harness/.agent/output/summary.md`.
4. **Export Summary** prints that file.
5. **Post Summary To Slack** runs only when a channel or permalink is set.

### Request JSON by agent

#### Pipeline Failure RCA (`pipeline-failure-rca`)

```json
{
  "execution_id": "YOUR_HARNESS_EXECUTION_ID",
  "pipeline_id": "YOUR_PIPELINE_ID",
  "service": "checkout"
}
```

`execution_id` is required. The agent inspects that execution only; it does not pick a recent failure by timestamp.

Also set `services` to the team's repos and pipelines. Keep `open_fix_pr` at `false` until you want one low-risk fix PR.

#### Change Advisory (`change-advisory`)

```json
{
  "service": "checkout",
  "environment": "prod",
  "execution_id": "YOUR_HARNESS_EXECUTION_ID",
  "pipeline_id": "YOUR_PIPELINE_ID"
}
```

Provide at least one of `execution_id`, `pipeline_id`, or `artifact`. The agent is read-only.

#### Security Finding Triage (`security-finding-triage`)

```json
{
  "finding_id": "YOUR_STO_OR_SCS_FINDING_ID",
  "execution_id": "OPTIONAL_SCAN_EXECUTION_ID",
  "path": "optional/path/to/file"
}
```

Keep `create_ticket` and `open_fix_pr` at `false` for a report-only first run.

#### Runbook Drift (`runbook-drift`)

```json
{
  "team": "platform",
  "focus": "ci-pipelines"
}
```

Also set `confluence_space` and `pipeline_ids` (comma-separated Harness pipeline identifiers). This agent needs the Atlassian MCP connector.

#### Incident Customer Comms (`incident-comms`)

PagerDuty is not involved. The JSON **is** the incident:

```json
{
  "incident_id": "mock-001",
  "service": "checkout",
  "severity": "SEV2",
  "status": "investigating",
  "symptoms": "Elevated checkout failures after the last deploy",
  "customer_impact": "Some checkout requests are failing",
  "started_at": "2026-09-03T21:00:00Z",
  "next_update_at": "2026-09-03T21:30:00Z",
  "workaround": "",
  "execution_id": "OPTIONAL_HARNESS_EXECUTION_ID"
}
```

The agent will not invent a cause, ETA, or workaround that is missing from this payload. Optional `execution_id` is used only for internal deployment context. Optional `status_template` is a Confluence page id or title.

### Writes that are allowed

| Agent | Default | Optional write |
| --- | --- | --- |
| Pipeline Failure RCA | none | one fix PR if `open_fix_pr=true` |
| Change Advisory | none | none (read-only allowlist) |
| Security Finding Triage | none | one Jira issue and/or one fix PR, each flag-gated |
| Runbook Drift | none | one docs PR if `open_docs_pr=true` |
| Incident Comms | none | none |

Your Atlassian MCP connector may expose Confluence and Jira write tools at the **connector** layer. Each agent still blocks those tools in `PLUGIN_ALLOWED_TOOLS`, except Security Finding Triage which allows `createJiraIssue` only when you also set `create_ticket=true` in the prompt contract.

## Container vulnerability remediator

`ca_container_vuln_remediation` is a single-pass Dockerfile remediator. It does not install `harness-mcp-v2` or mount Atlassian MCP. The sample pipeline (`container-vuln-remediation`) builds a local image (`PLUGIN_NO_PUSH=true`), scans with Trivy, and on CRITICAL/HIGH findings runs up to two agent rounds, then can commit a fix branch and open a GitHub pull request.

Replace these before a run:

- `account.YOUR_LLM_CONNECTOR` and `YOUR_MODEL_ID`
- `cloudConnector` (AWS connector for `BuildAndPushECR`)
- `harness_api_key_secret`: `<+secrets.getValue("harness_pat")>` for STO issue reads
- `scm_token_secret`: `<+secrets.getValue("YOUR_SCM_TOKEN_SECRET")>` if the pipeline should open a PR
- `repoOwner` / `repoName` for GitHub, and the cloned repo's Dockerfile path

The agent receives `remediationDetails` (and optionally a JSON `remediationReport` path and `previousAttempts`). It edits files under `/harness` only; git and PR creation stay in pipeline Run steps.

| Agent | Default | Optional write |
| --- | --- | --- |
| Container Vulnerability Remediation | Dockerfile / `.trivyignore` edits on disk | commit + GitHub PR from the sample pipeline |

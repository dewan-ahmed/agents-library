# Drop catalog source files here

Leave **3 worker agents** and **3 pipeline YAMLs** in this folder (or the two subfolders). Raw Harness exports are fine. The next session will normalize them into `catalog/agents/` and `catalog/pipelines/` and build v1.

## Agents

Preferred: one file per agent, any of `.yaml`, `.yml`, `.md`, `.txt`.

Helpful if you include:

- Display name (e.g. Auto-Remediation)
- Harness agent id (e.g. `remediationAgent`) — this is the URL segment
- Short summary (1–3 sentences)
- Whether it is Harness verified or Harness managed
- Optional: keywords, typical trigger, related pipeline names

If you only have a screenshot description plus the console URL, paste the URL. The id is the last path segment (`.../agents/remediationAgent?type=system`).

## Pipelines

Preferred: one `.yaml` per pipeline, the YAML a customer would paste into Harness.

Helpful if you include:

- A human name for the example
- Which of the 3 agents it uses (by Harness id)
- Whether it is v0 or v1 syntax

You can leave `orgIdentifier` / `projectIdentifier` as they are in your project. They will be turned into `{{orgId}}` / `{{projectId}}` placeholders.

## Do not include

Secrets, API keys, connector tokens, or private repo credentials. Connector *identifiers* as placeholders are OK.

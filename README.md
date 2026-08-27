# Harness AI Agents Library

Public, unauthenticated catalog. Describe a problem to match worker agents and copyable pipeline YAML, or browse the library.

## Run v1

```bash
cd web
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## What is in this version

- Homepage chat/search across 31 Harness-managed marketplace agents plus 6 curated custom agents
- Browse `/agents` and all 37 corresponding pipeline samples with filters
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

## Refresh the marketplace

```bash
cd web
HARNESS_API_KEY="$HARNESS_API_KEY" npm run sync:marketplace
```

The sync reads Harness's global stable `Agent` templates and regenerates a reusable
pipeline sample for every agent. It never writes to Harness.

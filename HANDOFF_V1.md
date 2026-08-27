# Handoff: build v1 when catalog files arrive

This note is for the next coding session. Product decisions are already locked. Do not reopen them unless the user explicitly changes them.

## Inputs to wait for

At least 3 agent files and 3 pipeline YAML files under `catalog/incoming/` (or already normalized under `catalog/agents/` and `catalog/pipelines/`).

If those files are missing, do **not** invent a fake catalog and ship it as v1. Scaffold the app only after real files exist, or stop and say what is missing.

## Product locks (do not relitigate)

See `PRODUCT_DESIGN_FOUNDATION.md` and `CATALOG_AND_MATCHING_CONTRACT.md`.

- Public unauthenticated site.
- Homepage hero is a large chat/search composer; Agents and Pipelines are full browsable catalogs with filters.
- Harness verified/managed agents only.
- Copyable YAML; learn / copy / Open in Harness.
- Curated catalog in this repo.
- Optional account ID, org ID, project ID in `localStorage` only — never required to browse or match; never put on shareable URLs.
- Open in Harness URL:

  `https://app.harness.io/ng/account/{accountId}/all/ai-agents/orgs/{orgId}/projects/{projectId}/agents/{agentId}?type={linkType}`

  v1 sample agents are custom (`type=custom`). System agents would use `type=system`.

- Visual language: Harness press kit blues, Geist, documentation-like chrome (Prompt Library / developer.harness.io / Worker Agents marketplace).

## v1 definition of done

A running local web app a visitor can use without login:

1. Home with large composer, starter prompts, and a short featured catalog.
2. Typed problem → solution bundle (matched agents + pipeline examples + short “why”).
3. `/agents` and `/pipelines` grids with filters (ownership, lifecycle, trigger, module if present in data).
4. Agent and pipeline detail pages.
5. Copy YAML with `{{accountId}}` / `{{orgId}}` / `{{projectId}}` until scope is set; substitute when set.
6. Open in Harness enabled only when all three IDs are present.
7. Compact “Your Harness project” control for those IDs.
8. Matching grounded in curated metadata (keywords, summary, triggers). Deterministic retrieval is enough for v1; LLM matching is optional.

Out of v1: Harness OAuth, creating resources in Harness, Community agents, saved accounts.

## Build order

1. Normalize incoming files into catalog records (keep original YAML).
2. Tokenize org/project/account in pipeline YAML.
3. Implement static site or simple React/Vite app that reads the catalog at build time.
4. Wire match → browse → detail → copy/open.
5. Leave a short README with `npm install` / `npm run dev` (or equivalent).

## Brand

https://www.harness.io/press-kit — Primary 5 `#00ADE4`, navy `#07182B`, Geist for UI.

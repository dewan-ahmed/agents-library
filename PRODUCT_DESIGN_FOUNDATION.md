# Harness AI Agents Library — Product Design Foundation

Status: v1 app available — 3 custom agents + 3 pipelines  
Date: 2026-08-21

## Product intent

Build a conversational discovery experience that helps a Harness customer describe an outcome in their own words and receive:

1. A small, ranked set of relevant Harness Worker Agents.
2. One or more pipeline examples showing how those agents can work together.
3. A clear explanation of why each recommendation fits.
4. A safe next action, such as viewing details, adapting a pipeline, or opening the relevant Harness workflow.

This should feel like a guided solution architect. The catalog is real and fully browsable, but the first thing a visitor sees is a large chat/search composer for describing a problem. Browse and filters are the secondary path for people who already know what they want.

## Phase 1 product principles

- Conversation first: the hero of the public site is a large chat/search composer.
- Catalog second: visitors who prefer browsing can open the full agent and pipeline catalogs with regular filters.
- Recommendations, not search results: a typed problem returns a curated bundle rather than a long list. Browse mode is the place for exhaustive lists.
- Explain the match: show use-case signals, required context, and confidence.
- Compose outcomes: worker agents are building blocks; pipeline examples show orchestration.
- Progressive detail: keep the first answer concise, then let customers inspect configuration and prerequisites.
- Harness-native: use the visual language, terminology, navigation patterns, and trust signals customers already recognize.
- No dead ends: every result offers a useful next action even when the match is uncertain.

## Locked decisions

1. **Audience and access.** Public site. No authentication in the first build. Harness authentication can be added later for saved sessions, account-aware recommendations, and write actions in Harness.
2. **Product home.** Standalone Harness-branded public site, not an embedded Harness 3.0 module in v1.
3. **Hero vs. catalog.** The homepage hero is the chat/search bar. Agents and pipelines still have full catalogs. Visitors can browse everything and apply regular filters without using chat.
4. **Catalog scope.** Harness verified and Harness managed worker agents only. Community agents are out of v1.
5. **Pipeline examples.** Copyable YAML only in v1 (no separate diagram artifact). Stage flow can still appear as compact UI chrome around that YAML.
6. **v1 conversion.** Learn, copy YAML, and Open in Harness.
7. **Catalog source.** Curated files in this repository, not live Harness APIs.
8. **Harness scope context.** Optional account ID, org ID, and project ID. Used only to personalize Open-in-Harness links and to fill identifiers in copyable YAML. Never required to browse or get a match.

## Primary user journeys

### A. Describe a problem (primary)

1. Visitor lands on the public homepage.
2. The hero asks, “What are you trying to automate?”
3. They type a problem, optionally using a starter prompt.
4. The assistant asks at most one focused follow-up when a missing detail would change the match.
5. Results appear as a solution bundle: interpreted goal, two or three agents, one primary pipeline example, match reasons, and prerequisites.
6. They inspect a card, refine the query, or jump from a recommended item into its catalog detail page.
7. If they have provided account / org / project IDs, **Open in Harness** and **Copy YAML** are scoped to that project. If not, they can still learn, and YAML uses placeholders.

### B. Browse the catalog (secondary)

1. Visitor skips the composer and chooses Agents or Pipelines.
2. They see the full catalog as a filterable grid, similar in spirit to Worker Agents marketplace and the Prompt Library facets.
3. Filters narrow by ownership, lifecycle stage, trigger, module, complexity, and scope.
4. Opening a card goes to a detail page. From there they can ask “find related agents/pipelines” which pre-fills the hero composer.

Both journeys share the same catalog data. Chat ranks and explains; browse lists and filters.

## Information architecture

### Site map (v1, unauthenticated)

- `/` Home — hero composer, starter prompts, then a compact catalog preview with a clear Browse all path.
- `/match` or in-place home results — conversation plus solution bundle after a query. Prefer keeping the visitor on home so the hero never disappears.
- `/agents` — full worker-agent catalog with filters.
- `/agents/:id` — agent detail.
- `/pipelines` — full pipeline-example catalog with filters.
- `/pipelines/:id` — pipeline example detail.
- `/about` — how matching works, trust, and contribution model.

Deferred with authentication:

- `/saved` — saved bundles and recent sessions.
- Account menu, org/project context, install/create handoff.

### Primary navigation

- Logo → Home (hero composer).
- Agents
- Pipelines
- About
- Docs (external)
- Sign in — hidden or disabled until Harness auth is added. Do not block browsing or matching.

### Home anatomy

Above the fold:

- Harness-branded top bar.
- Page title and one-line value statement.
- Large chat/search composer as the visual hero.
- Starter prompts under the composer.

Below the fold, without forcing a query:

- Short “or browse the library” split: Agents | Pipelines.
- A few featured or recently updated cards, not the full grid.
- Trust line: Harness verified / managed / community.

After a query, the hero composer stays visible (sticky, compact). The area below becomes the conversation and solution bundle. Catalog preview recedes until the visitor clears the query or switches to Browse.

### Browse anatomy (Agents and Pipelines)

- Same top bar and a persistent compact search field that can either filter the current catalog or escalate into a match query.
- Left filter rail (desktop) / filter drawer (mobile).
- Result count and sort (relevance, recently updated, name).
- Card grid using Worker Agents marketplace conventions: icon, name, owner, description, scope tag, version.
- Empty filter state with a one-click reset and a prompt to describe the problem in chat instead.

### Shared filter taxonomy

Use the same facets in browse filters and as matching dimensions:

- Catalog type: Agent | Pipeline
- Ownership: All | Harness verified | Harness managed (Community hidden in v1)
- Lifecycle: Plan, Build, Test, Secure, Release, Monitor, Cost, Govern
- Trigger: pull request, scan finding, failed pipeline, schedule, manual, incident
- Module: CI, CD, STO, SCS, IDP, CCM, SRM, and other Harness modules as catalogued
- Scope: Project | Org | Account
- Complexity / setup effort: Beginner | Intermediate | Advanced

Chat should apply these silently when the visitor’s language implies them. Browse exposes them as ordinary checkboxes and chips.

## Core recommendation object: the solution bundle

Every recommendation should be represented as one coherent bundle rather than disconnected cards.

### Bundle summary

- Interpreted goal.
- Confidence label.
- Short rationale.
- Assumptions that affected the result.

### Worker-agent recommendations

Each agent item should include:

- Name and ownership badge: Harness verified, Harness managed, or Community.
- One-sentence role in this specific solution.
- Match reasons derived from the customer’s language.
- Inputs, outputs, and prerequisites.
- Scope and version.
- “Why this agent” and “View details” actions.

Prefer two or three recommendations. More than four should trigger grouping or a clarifying question.

### Pipeline examples

Each pipeline item should include:

- Outcome-oriented name.
- A compact visual sequence of stages and worker agents.
- Trigger, expected inputs, and produced outputs.
- Complexity and estimated setup effort.
- Required connectors, secrets, services, or environments.
- “Why this pipeline” and “View example” actions.

Pipeline examples should make orchestration understandable before exposing YAML.

## Conversational behavior

The assistant should classify the request across these dimensions:

- Desired outcome.
- Software-delivery lifecycle stage.
- Trigger or event source.
- Required systems and connectors.
- Expected artifact or action.
- Governance, security, or approval constraints.
- Runtime scope: account, organization, or project.

Ask a follow-up only when ambiguity changes the selected agent or pipeline. Otherwise state assumptions and proceed.

The assistant should not claim that an agent can perform a capability absent from its declared metadata. Recommendations should be grounded in a structured catalog, not generated from names and descriptions alone.

## Visual direction

### Brand foundation

- Primary brand family: Harness blue from `#00ADE4` through deeper `#0278D5` and `#004BA4`.
- Light cyan surfaces: `#EFFBFF`, `#CDF4FE`, and `#A3E9FF`, used sparingly for selected and informational states.
- Primary text: near-black or Harness navy (`#07182B`) depending on context.
- Product surfaces: white and restrained neutral gray.
- Typeface: Geist for product UI; Cal Sans only for selected brand-led display moments.

### Look and feel

- Clean, documentation-like structure inspired by Harness 3.0.
- Thin structural borders, modest radii, and minimal elevation.
- Blue reserved for primary actions, active navigation, selected states, and recommendation emphasis.
- Compact metadata and generous whitespace.
- Product icons should be simple line or geometric icons, not illustrative decoration.
- Trust badges should remain visible but quiet.

### Layout rhythm

- 8px base spacing system.
- 12–14px metadata and helper text.
- 14–16px body text.
- 20–24px section headings.
- 32–40px page title only when the surrounding layout supports it.
- Content width should remain readable even on wide screens; the conversation can be broad without allowing long text lines.

## Key components to design next

1. Homepage hero composer (large) and compact sticky variant.
2. Starter prompt chip.
3. Home featured-catalog preview.
4. Browse filter rail and active-filter chips.
5. Agent catalog card and pipeline catalog card.
6. User and assistant message treatments.
7. Solution-bundle summary.
8. Recommended-agent card (includes “why this matched”).
9. Pipeline example card with compact stage flow.
10. Trust and ownership badge.
11. Agent detail page / panel.
12. Pipeline detail page / panel.
13. Empty, loading, partial-match, no-confident-match, and no-filter-results states.
14. Optional Harness scope context (account / org / project IDs).
15. Open in Harness control (enabled when scope is set).
16. Copy YAML control with placeholder vs filled-identifier states.

## Content voice

- Direct and outcome-oriented.
- Precise about what the system knows versus assumes.
- Use Harness terms when they help customers act.
- Avoid generic AI language such as “unlock,” “revolutionize,” or “magic.”
- Explain recommendations in plain language before showing implementation details.

Example opening:

> Describe the delivery, security, reliability, or engineering workflow you want to automate. I’ll match it to worker agents and show pipeline examples that fit.

Example result framing:

> I’d combine Auto-Remediation with Claude Code Security Review. The first can address scan findings and validate fixes; the second adds pull-request security review. A pull-request remediation pipeline is the closest reusable pattern.

## Trust, safety, and provenance

- Show ownership, version, and verification status for every agent.
- Distinguish available agents from roadmap or unavailable capabilities.
- Identify required permissions and external systems before a customer commits.
- Preserve the customer’s original request alongside the interpreted goal.
- Expose which catalog fields supported a match.
- Never imply that viewing a recommendation, copying YAML, or opening a console link has modified Harness resources.
- Open in Harness is a deep link into the visitor’s console. It does not create or install anything from this site.
- Account, org, and project IDs are not secrets, but they are customer environment data. Keep them in the browser (local storage). Do not put them on shareable match URLs. Do not send them to a backend in v1.
- Copied YAML must still use runtime inputs or placeholders for connectors, secrets, and other resources this site cannot know.

## MVP boundary

The first build should support:

- A public, unauthenticated site.
- Homepage hero composer and text-based use-case intake.
- Full agent and pipeline catalogs with shared filters.
- Grounded matching against a local structured catalog.
- Solution bundles with explainable recommendations.
- Agent and pipeline detail pages.
- Shareable match URLs (query text only) without requiring an account.
- Optional account / org / project context stored locally in the browser.
- Open-in-Harness deep links built from curated agent identifiers plus that context.
- Copyable pipeline YAML with those identifiers substituted.

Defer:

- Harness authentication, sign-in UI, and account-specific inventory.
- Validating that the IDs exist or that the visitor can access the linked agent.
- Saved sessions that require a user identity (anonymous shareable links are enough).
- Direct Harness resource creation, install, or pipeline execution from this site.
- Community submissions and moderation.
- Personalized ranking from behavioral data.
- Full production search infrastructure.

## Delivery sequence

### Phase 1 — Product and design foundation

Agree on product principles, screen anatomy, visual language, recommendation object, and MVP boundary.

### Phase 2 — Catalog and matching contract

Define schemas for worker agents, pipeline examples, prerequisites, lifecycle stages, trust signals, and match evidence. Create an initial representative dataset.

### Phase 3 — UX prototype

Create a static high-fidelity Discover screen and validate empty, recommendation, refinement, and detail states without a backend.

### Phase 4 — Matching prototype

Implement deterministic retrieval and ranking first, then add model-assisted intent extraction with observable match evidence.

### Phase 5 — Web application

Implement the approved UI, catalog browsing, session persistence, accessibility, responsive behavior, and analytics.

### Phase 6 — Harness integration

Add Harness authentication, resource-aware recommendations, saved sessions, and explicit install/create handoff after the public library experience is proven.

## Next discussion

Catalog contract is locked. User will drop 3 agents and 3 pipeline YAMLs in `catalog/incoming/`. The following session should follow [HANDOFF_V1.md](./HANDOFF_V1.md) and ship v1 of the public app.

## Reference rationale

- The Harness AI Prompt Library shows a large search-led hero plus facet filters over a catalog. This site uses that pattern: chat/search as hero, filters as the browse path.
- Harness 3.0 documentation emphasizes unified navigation, AI-first entry points, and progressive access to platform capabilities. This concept uses that hierarchy and keeps AI central.
- The Worker Agents marketplace establishes ownership, verification, version, scope, and catalog-card conventions. Those trust signals carry into recommendations.
- The Harness press kit supplies the brand color family and the Cal Sans / Geist typography direction.

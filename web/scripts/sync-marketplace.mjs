import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const token = process.env.HARNESS_API_KEY;
if (!token) {
  throw new Error("HARNESS_API_KEY is required");
}

const baseUrl = (process.env.HARNESS_BASE_URL ?? "https://app.harness.io").replace(/\/$/, "");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const catalogDir = resolve(scriptDir, "../../catalog");
const rawDir = resolve(catalogDir, "marketplace-agents");
const headers = { "x-api-key": token, Accept: "application/json" };

const stopwords = new Set([
  "agent", "that", "with", "from", "this", "then", "into", "each", "your",
  "their", "uses", "using", "opens", "produces", "reports", "harness",
  "codebase", "pipeline", "changes", "source", "current", "triggering",
  "the", "and", "one", "for", "are", "not", "all", "its", "out",
]);

function unique(values) {
  return [...new Set(values)];
}

function has(text, pattern) {
  return pattern.test(text.toLowerCase());
}

function classify(description, name) {
  const text = `${name} ${description}`;
  const lifecycle = [];
  if (has(text, /security|vulnerab|scan|finding|remediat|compliance|false positive|sarif/)) lifecycle.push("secure");
  if (has(text, /\btest|coverage|flaky/)) lifecycle.push("test");
  if (has(text, /spec|planning|jira|feature file|pull request author/)) lifecycle.push("plan");
  if (has(text, /deploy|kubernetes|helm|verification|feature flag|release/)) lifecycle.push("release");
  if (has(text, /readiness|monitored service|metric|log signal/)) lifecycle.push("monitor");
  if (has(text, /cost/)) lifecycle.push("cost");
  if (has(text, /audit|governance|template/)) lifecycle.push("govern");
  if (has(text, /\bci\b|build|docker|code|implement|fix|commit|pull request/)) lifecycle.push("build");
  if (!lifecycle.length) lifecycle.push("build");

  const modules = [];
  if (has(text, /\bci\b|build|docker|test|coverage|code/)) modules.push("ci");
  if (has(text, /security|scan|finding|sarif|vulnerab|false positive/)) modules.push("sto");
  if (has(text, /deploy|kubernetes|helm|verification|monitored service/)) modules.push("cd");
  if (has(text, /iacm|terraform|opentofu|terragrunt|infrastructure as code|\biac\b/)) modules.push("iacm");
  if (has(text, /feature flag/)) modules.push("fme");
  if (has(text, /readiness/)) modules.push("idp");
  if (has(text, /harness configuration|template audit|governance|compliance/)) modules.push("platform");
  if (!modules.length) modules.push("ci");

  const triggers = ["pipeline"];
  if (has(text, /pull request|\bpr\b/)) triggers.push("pull_request");
  if (has(text, /pipeline failure|deployment failure|failed/)) triggers.push("failed_pipeline");
  if (has(text, /scan|finding|vulnerab/)) triggers.push("scan_finding");
  if (has(text, /jira/)) triggers.push("jira_issue");

  return {
    lifecycle: unique(lifecycle),
    modules: unique(modules),
    triggers: unique(triggers),
  };
}

function keywords(name, description) {
  return unique(
    `${name} ${description}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !stopwords.has(word)),
  ).slice(0, 20);
}

function connectorSubtype(input) {
  const types = input?.oneof ?? input?.ui?.input?.inputConfig?.connectorTypes ?? [];
  return Array.isArray(types) && types.length ? ` (${types.join(", ")})` : "";
}

function isAutomaticDefault(value) {
  return typeof value === "string" && (
    value.includes("<+account.") ||
    value.includes("<+org.") ||
    value.includes("<+project.") ||
    value.includes("<+pipeline.")
  );
}

function configurationFromInputs(inputs = {}) {
  const items = [];
  for (const [key, input] of Object.entries(inputs)) {
    const type = input?.type ?? "string";
    const connectorArray = type === "array" &&
      input?.ui?.input?.inputConfig?.connectorTypes?.includes("Mcp");
    const kind = type === "connector" || connectorArray
      ? "connector"
      : type === "secret"
        ? "secret"
        : "value";
    const required = input?.required === true;
    const automatic = isAutomaticDefault(input?.default);

    // The checklist is for customer setup, not every event/runtime field.
    if (kind === "value" && (!required || automatic)) continue;

    items.push({
      key,
      label: `${input?.label ?? key.replaceAll("_", " ")}${kind === "connector" ? connectorSubtype(input) : ""}`,
      kind,
      requirement: required ? "required" : "optional",
      field: `agentSettings.${key}`,
      note: input?.ui?.tooltip ??
        (required ? "Provide this value when configuring the agent step." : "Optional agent configuration."),
    });
  }
  return items;
}

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, { headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${path}`);
  }
  return response.json();
}

const listed = await getJson(
  "/v1/templates?global_template=true&entity_types=Agent&type=STABLE_TEMPLATE&limit=100",
);
const templates = listed.items ?? listed.data ?? listed;
const stableById = new Map();
for (const template of templates) {
  if (template.stable_template !== false) stableById.set(template.identifier, template);
}

await mkdir(rawDir, { recursive: true });

const agents = [];
for (const summary of stableById.values()) {
  const detail = await getJson(
    `/v1/templates/${encodeURIComponent(summary.identifier)}?global_template=true`,
  );
  const template = detail.template ?? detail;
  const yaml = template.yaml ?? "";
  const parsed = parse(yaml) ?? {};
  const definition = parsed.template ?? {};
  const inputs = definition.inputs ?? {};
  const configuration = configurationFromInputs(inputs);
  const classification = classify(summary.description ?? "", summary.name ?? "");

  await writeFile(resolve(rawDir, `${summary.identifier}.yaml`), yaml);

  agents.push({
    id: summary.identifier,
    harnessAgentId: summary.identifier,
    name: summary.name,
    summary: summary.description,
    description: summary.description,
    ownership: "harness_managed",
    linkType: "system",
    lifecycle: classification.lifecycle,
    modules: classification.modules,
    triggers: classification.triggers,
    scope: "project",
    version: summary.version_label ?? "1.0.0",
    availability: /^coming soon/i.test(summary.description ?? "") ? "coming_soon" : "available",
    inputs: configuration.map((item) => item.key),
    configuration,
    prerequisites: configuration
      .filter((item) => item.requirement === "required")
      .map((item) => item.label),
    keywords: keywords(summary.name ?? "", summary.description ?? ""),
    iconName: summary.icon_name || "harness",
    source: "harness_global_template",
    syncedAt: new Date().toISOString(),
  });
}

agents.sort((a, b) => a.name.localeCompare(b.name));
const output = {
  source: "Harness global template catalog",
  syncedAt: new Date().toISOString(),
  count: agents.length,
  agents,
};

await writeFile(
  resolve(catalogDir, "marketplace.json"),
  `${JSON.stringify(output, null, 2)}\n`,
);

console.log(`Synced ${agents.length} stable marketplace agents.`);

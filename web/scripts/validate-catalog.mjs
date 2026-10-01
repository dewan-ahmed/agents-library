#!/usr/bin/env node
// Validates custom catalog YAML/JSON structure and agent+pipeline combos.
// Marketplace samples under catalog/pipelines/marketplace/ are out of scope.
import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const catalogDir = join(here, "..", "..", "catalog");
const combosPath = join(catalogDir, "test", "combos.json");
const AGENT_ACTION = "harnessAI@1.0.0";
const writeCombos = process.argv.includes("--write-combos");
const errors = [];
const warnings = [];

function parseYaml(path) {
  try {
    return parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${path}: YAML parse failed - ${error.message}`);
    return null;
  }
}

const INPUT_REF = /\$\{\{\s*inputs\.([A-Za-z_][\w]*)/g;

function walkAgentNames(node, acc = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => walkAgentNames(item, acc));
    return acc;
  }
  if (node && typeof node === "object") {
    if (typeof node.agentName === "string") acc.push(node.agentName.split("@")[0]);
    Object.values(node).forEach((value) => walkAgentNames(value, acc));
  }
  return acc;
}

function referencedInputs(raw) {
  const names = new Set();
  for (const match of raw.matchAll(INPUT_REF)) names.add(match[1]);
  return names;
}

function validateActionShape(label, agent, declared, raw) {
  if (!agent) {
    errors.push(`${label}: missing agent`);
    return;
  }
  if (agent.uses !== AGENT_ACTION) errors.push(`${label}: expected uses: ${AGENT_ACTION}`);
  if (!agent.with?.prompt) errors.push(`${label}: missing with.prompt`);
  if (!agent.with?.connector) errors.push(`${label}: missing with.connector`);
  const mcp = agent.with?.mcp;
  if (mcp !== undefined && !Array.isArray(mcp)) errors.push(`${label}: with.mcp must be a list`);
  for (const [key, value] of Object.entries(agent.with?.env ?? {})) {
    if (typeof value !== "string") errors.push(`${label}: with.env.${key} must be a string`);
    if (key.startsWith("PLUGIN_")) {
      errors.push(`${label}: ${key} is an action setting and must not live under with.env`);
    }
  }
  if (raw.includes("prompt: |-")) {
    errors.push(`${label}: prompt uses |- which strips the trailing newline; use |`);
  }
  if (!declared || typeof declared !== "object" || Array.isArray(declared)) {
    errors.push(`${label}: missing input declarations`);
    return;
  }
  const keys = new Set(Object.keys(declared));
  for (const name of referencedInputs(raw)) {
    if (!keys.has(name)) errors.push(`${label}: inputs.${name} is referenced but not declared`);
  }
}

function walkAgentSettings(node, acc = []) {
  if (Array.isArray(node)) {
    node.forEach((item) => walkAgentSettings(item, acc));
    return acc;
  }
  if (!node || typeof node !== "object") return acc;
  if (typeof node.agentName === "string" && node.agentSettings) {
    let settings = node.agentSettings;
    if (typeof settings === "string") {
      try {
        settings = JSON.parse(settings);
      } catch {
        settings = null;
      }
    }
    if (settings && typeof settings === "object" && !Array.isArray(settings)) {
      acc.push({ name: node.agentName.split("@")[0], settings });
    }
  }
  Object.values(node).forEach((value) => walkAgentSettings(value, acc));
  return acc;
}

const agentFiles = readdirSync(join(catalogDir, "agents")).filter((f) => f.endsWith(".yaml"));
const agentDocs = new Map();
for (const file of agentFiles) {
  const path = join(catalogDir, "agents", file);
  const raw = readFileSync(path, "utf8");
  const doc = parseYaml(path);
  if (!doc) continue;
  agentDocs.set(file.replace(/\.yaml$/, ""), doc);
  validateActionShape(`agents/${file}`, doc.agent, doc.agent?.inputs, raw);
}

const marketplaceDir = join(catalogDir, "marketplace-agents");
if (existsSync(marketplaceDir)) {
  for (const file of readdirSync(marketplaceDir).filter((f) => f.endsWith(".yaml"))) {
    const path = join(marketplaceDir, file);
    const raw = readFileSync(path, "utf8");
    const doc = parseYaml(path);
    if (!doc?.template?.agent) continue;
    if (doc.template.agent.uses !== AGENT_ACTION) continue;
    validateActionShape(
      `marketplace-agents/${file}`,
      doc.template.agent,
      doc.template.inputs,
      raw,
    );
  }
}

const pipelineFiles = readdirSync(join(catalogDir, "pipelines")).filter((f) => f.endsWith(".pipeline.yaml"));
const pipelineAgentRefs = new Map();
for (const file of pipelineFiles) {
  const doc = parseYaml(join(catalogDir, "pipelines", file));
  if (!doc) continue;
  const pipeline = doc.pipeline;
  if (!pipeline) {
    errors.push(`pipelines/${file}: missing pipeline root`);
    continue;
  }
  if (pipeline.orgIdentifier !== "{{orgId}}") errors.push(`pipelines/${file}: orgIdentifier must be {{orgId}}`);
  if (pipeline.projectIdentifier !== "{{projectId}}") errors.push(`pipelines/${file}: projectIdentifier must be {{projectId}}`);
  pipelineAgentRefs.set(file, walkAgentNames(pipeline));
  for (const { name, settings } of walkAgentSettings(pipeline)) {
    const agent = agentDocs.get(name);
    const declared = agent?.agent?.inputs;
    if (!declared) continue;
    for (const key of Object.keys(settings)) {
      if (!Object.hasOwn(declared, key)) {
        errors.push(`pipelines/${file}: agentSettings.${key} is not declared on agents/${name}.yaml`);
      }
    }
  }
}

const catalog = JSON.parse(readFileSync(join(catalogDir, "catalog.json"), "utf8"));
const catalogAgentIds = new Set(catalog.agents.map((a) => a.id));
const referencedAgentIds = new Set();

for (const agent of catalog.agents) {
  if (!agentDocs.has(agent.id)) errors.push(`catalog.json: agent ${agent.id} has no catalog/agents/${agent.id}.yaml`);
  if (agent.harnessAgentId !== agent.id) warnings.push(`catalog.json: agent ${agent.id} harnessAgentId differs (${agent.harnessAgentId})`);
  for (const field of ["name", "summary", "description", "ownership", "linkType", "version", "author"]) {
    if (!agent[field]) errors.push(`catalog.json: agent ${agent.id} missing ${field}`);
  }
}

const combos = [];
for (const pipeline of catalog.pipelines) {
  const yamlPath = join(catalogDir, "pipelines", pipeline.yamlFile);
  if (!existsSync(yamlPath)) {
    errors.push(`catalog.json: pipeline ${pipeline.id} references missing ${pipeline.yamlFile}`);
    continue;
  }
  const agentIds = pipeline.agentIds ?? [];
  if (agentIds.length === 0) {
    errors.push(`catalog.json: pipeline ${pipeline.id} has no agentIds`);
  }
  for (const agentId of agentIds) {
    referencedAgentIds.add(agentId);
    if (!catalogAgentIds.has(agentId)) {
      errors.push(`catalog.json: pipeline ${pipeline.id} references agent ${agentId} which is not in catalog.agents`);
    }
    combos.push({
      agentId,
      pipelineId: pipeline.id,
      pipelineIdentifier: pipeline.identifier,
      agentFile: `catalog/agents/${agentId}.yaml`,
      pipelineFile: `catalog/pipelines/${pipeline.yamlFile}`,
    });
  }
  const refs = pipelineAgentRefs.get(pipeline.yamlFile) ?? [];
  for (const ref of refs) {
    if (!agentIds.includes(ref)) {
      errors.push(`catalog.json: pipeline ${pipeline.id} yaml uses agentName ${ref} but agentIds is ${JSON.stringify(agentIds)}`);
    }
    if (!catalogAgentIds.has(ref)) {
      errors.push(`pipelines/${pipeline.yamlFile}: agentName ${ref} is not a custom catalog agent`);
    }
  }
}

for (const agent of catalog.agents) {
  if (!referencedAgentIds.has(agent.id)) {
    errors.push(`catalog.json: agent ${agent.id} has no custom pipeline combo`);
  }
}

for (const [file, refs] of pipelineAgentRefs) {
  for (const ref of refs) {
    if (!catalogAgentIds.has(ref)) {
      errors.push(`pipelines/${file}: agentName ${ref} is not a custom catalog agent (marketplace samples are not validated here)`);
    }
  }
}

const comboDoc = {
  scope: "custom",
  exclude: "marketplace",
  combos,
};

if (writeCombos) {
  writeFileSync(combosPath, `${JSON.stringify(comboDoc, null, 2)}\n`);
}

if (existsSync(combosPath)) {
  const onDisk = JSON.parse(readFileSync(combosPath, "utf8"));
  const expected = JSON.stringify(comboDoc);
  const actual = JSON.stringify({
    scope: onDisk.scope,
    exclude: onDisk.exclude,
    combos: onDisk.combos,
  });
  if (expected !== actual) {
    errors.push("catalog/test/combos.json is out of date. Run: node scripts/validate-catalog.mjs --write-combos");
  }
} else {
  errors.push("catalog/test/combos.json is missing. Run: node scripts/validate-catalog.mjs --write-combos");
}

console.log(`Custom catalog: ${catalog.agents.length} agents, ${catalog.pipelines.length} pipelines, ${combos.length} combos.`);
console.log(`Parsed ${agentFiles.length} agent YAML, ${pipelineFiles.length} custom pipeline YAML (marketplace/ ignored).`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`ERROR ${error}`);
if (errors.length) process.exit(1);
console.log("Custom catalog combo validation passed.");

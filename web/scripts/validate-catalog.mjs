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

const agentFiles = readdirSync(join(catalogDir, "agents")).filter((f) => f.endsWith(".yaml"));
const agentDocs = new Map();
for (const file of agentFiles) {
  const doc = parseYaml(join(catalogDir, "agents", file));
  if (!doc) continue;
  agentDocs.set(file.replace(/\.yaml$/, ""), doc);
  if (doc.template) continue;
  if (doc.version !== 1) errors.push(`agents/${file}: expected version: 1`);
  if (!doc.agent?.step) errors.push(`agents/${file}: missing agent.step`);
  if (!doc.agent?.inputs) errors.push(`agents/${file}: missing agent.inputs`);
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

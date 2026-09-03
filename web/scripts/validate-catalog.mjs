#!/usr/bin/env node
// Validates catalog YAML/JSON structure and cross-references.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const here = dirname(fileURLToPath(import.meta.url));
const catalogDir = join(here, "..", "..", "catalog");
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

const agentFiles = readdirSync(join(catalogDir, "agents")).filter((f) => f.endsWith(".yaml"));
const agentDocs = new Map();
for (const file of agentFiles) {
  const doc = parseYaml(join(catalogDir, "agents", file));
  if (!doc) continue;
  agentDocs.set(file.replace(/\.yaml$/, ""), doc);
  // Two accepted shapes: a standalone agent spec, or a raw template-wrapper dump.
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
  const refs = [];
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === "object") {
      if (typeof node.agentName === "string") refs.push(node.agentName.split("@")[0]);
      Object.values(node).forEach(walk);
    }
  };
  walk(pipeline);
  pipelineAgentRefs.set(file, refs);
}

const catalog = JSON.parse(readFileSync(join(catalogDir, "catalog.json"), "utf8"));
const catalogAgentIds = new Set(catalog.agents.map((a) => a.id));

for (const agent of catalog.agents) {
  if (!agentDocs.has(agent.id)) errors.push(`catalog.json: agent ${agent.id} has no catalog/agents/${agent.id}.yaml`);
  if (agent.harnessAgentId !== agent.id) warnings.push(`catalog.json: agent ${agent.id} harnessAgentId differs (${agent.harnessAgentId})`);
  for (const field of ["name", "summary", "description", "ownership", "linkType", "version"]) {
    if (!agent[field]) errors.push(`catalog.json: agent ${agent.id} missing ${field}`);
  }
}

for (const pipeline of catalog.pipelines) {
  const yamlPath = join(catalogDir, "pipelines", pipeline.yamlFile);
  if (!existsSync(yamlPath)) {
    errors.push(`catalog.json: pipeline ${pipeline.id} references missing ${pipeline.yamlFile}`);
    continue;
  }
  for (const agentId of pipeline.agentIds ?? []) {
    if (!catalogAgentIds.has(agentId)) {
      warnings.push(`catalog.json: pipeline ${pipeline.id} references agent ${agentId} not in catalog.agents`);
    }
  }
  const refs = pipelineAgentRefs.get(pipeline.yamlFile) ?? [];
  for (const ref of refs) {
    if (!(pipeline.agentIds ?? []).includes(ref)) {
      errors.push(`catalog.json: pipeline ${pipeline.id} yaml uses agentName ${ref} but agentIds is ${JSON.stringify(pipeline.agentIds)}`);
    }
  }
}

// Agent YAML files referenced by a pipeline must exist.
for (const [file, refs] of pipelineAgentRefs) {
  for (const ref of refs) {
    if (!agentDocs.has(ref) && !ref.startsWith("ca_") === false) {
      // only warn for custom (ca_) agents; marketplace agents live elsewhere
      if (!agentDocs.has(ref)) warnings.push(`pipelines/${file}: agentName ${ref} has no catalog/agents YAML`);
    }
  }
}

console.log(`Parsed ${agentFiles.length} agent YAML, ${pipelineFiles.length} pipeline YAML.`);
console.log(`catalog.json: ${catalog.agents.length} agents, ${catalog.pipelines.length} pipelines.`);
for (const warning of warnings) console.log(`WARN  ${warning}`);
for (const error of errors) console.log(`ERROR ${error}`);
if (errors.length) process.exit(1);
console.log("Catalog validation passed.");

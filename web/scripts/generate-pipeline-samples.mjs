import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const catalogDir = resolve(scriptDir, "../../catalog");
const sourceDir = resolve(catalogDir, "marketplace-agents");
const outputDir = resolve(catalogDir, "pipelines/marketplace");
const marketplace = JSON.parse(
  await readFile(resolve(catalogDir, "marketplace.json"), "utf8"),
);

const automaticExpressions = {
  account_id: "<+account.identifier>",
  accountId: "<+account.identifier>",
  org_id: "<+org.identifier>",
  orgId: "<+org.identifier>",
  project_id: "<+project.identifier>",
  projectId: "<+project.identifier>",
  execution_id: "<+pipeline.executionId>",
  executionId: "<+pipeline.executionId>",
  pipeline_url: "<+pipeline.executionUrl>",
  pipelineUrl: "<+pipeline.executionUrl>",
  branch: "<+codebase.branch>",
  source_branch: "<+codebase.branch>",
  commit_sha: "<+codebase.commitSha>",
  pr_number: "<+codebase.prNumber>",
};

function runtimeWithDefault(value) {
  if (value === undefined || value === null || value === "") return "<+input>";
  if (typeof value === "string" && value.startsWith("<+")) return value;
  if (Array.isArray(value) || typeof value === "object") return "<+input>";
  return `<+input>.default(${String(value)})`;
}

function settingValue(key, input) {
  if (automaticExpressions[key]) return automaticExpressions[key];
  if (input?.type === "connector" || input?.type === "secret" || input?.type === "array") {
    return "<+input>";
  }
  return runtimeWithDefault(input?.default);
}

function needsCodebase(agent, inputs) {
  const text = `${agent.name} ${agent.description}`.toLowerCase();
  const keys = new Set(Object.keys(inputs));
  return (
    keys.has("scm_connector") ||
    keys.has("repo_name") ||
    keys.has("repo_url") ||
    keys.has("branch") ||
    keys.has("source_branch") ||
    /repository|codebase|pull request|dockerfile|source code|current branch/.test(text)
  );
}

function complexity(runtimeInputs) {
  if (runtimeInputs.length >= 6) return "advanced";
  if (runtimeInputs.length >= 3) return "intermediate";
  return "beginner";
}

function makePipeline(agent, inputs) {
  const agentSettings = {};
  const runtimeInputs = [];

  for (const [key, input] of Object.entries(inputs)) {
    if (input?.required !== true) continue;
    const value = settingValue(key, input);
    agentSettings[key] = value;
    if (typeof value === "string" && value.startsWith("<+input>")) {
      runtimeInputs.push(key);
    }
  }

  const cloneCodebase = needsCodebase(agent, inputs);
  const pipeline = {
    pipeline: {
      name: `${agent.name} Sample`,
      identifier: `${agent.harnessAgentId}Sample`,
      projectIdentifier: "{{projectId}}",
      orgIdentifier: "{{orgId}}",
      tags: {
        "agents-library": "generated",
      },
      ...(cloneCodebase
        ? {
            properties: {
              ci: {
                codebase: {
                  repoName: "<+input>",
                  build: "<+input>",
                },
              },
            },
          }
        : {}),
      stages: [
        {
          stage: {
            name: `Run ${agent.name}`,
            identifier: `Run_${agent.harnessAgentId}`,
            type: "CI",
            spec: {
              cloneCodebase,
              platform: {
                os: "Linux",
                arch: "Amd64",
              },
              runtime: {
                type: "Cloud",
                spec: {},
              },
              execution: {
                steps: [
                  {
                    step: {
                      type: "Agent",
                      name: agent.name,
                      identifier: agent.harnessAgentId,
                      spec: {
                        agentName: agent.harnessAgentId,
                        agentSettings,
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
  };

  if (cloneCodebase) runtimeInputs.unshift("repoName", "build");
  return { pipeline, runtimeInputs: [...new Set(runtimeInputs)] };
}

await mkdir(outputDir, { recursive: true });
const pipelines = [];

for (const agent of marketplace.agents) {
  const raw = await readFile(
    resolve(sourceDir, `${agent.harnessAgentId}.yaml`),
    "utf8",
  );
  const definition = parse(raw)?.template ?? {};
  const inputs = definition.inputs ?? {};
  const generated = makePipeline(agent, inputs);
  const yamlFile = `${agent.harnessAgentId}.pipeline.yaml`;

  await writeFile(
    resolve(outputDir, yamlFile),
    stringify(generated.pipeline, { lineWidth: 0 }),
  );

  pipelines.push({
    id: `marketplace-${agent.harnessAgentId}`,
    name: `${agent.name} Sample`,
    identifier: `${agent.harnessAgentId}Sample`,
    summary: `Reusable pipeline sample for the Harness ${agent.name} worker agent. Required agent settings remain Harness runtime inputs.`,
    lifecycle: agent.lifecycle,
    modules: agent.modules,
    triggers: agent.triggers,
    complexity: complexity(generated.runtimeInputs),
    availability: agent.availability,
    agentIds: [agent.id],
    yamlFile,
    stages: [`Run ${agent.name}`],
    runtimeInputs: generated.runtimeInputs,
    source: "generated_from_harness_global_template",
  });
}

pipelines.sort((a, b) => a.name.localeCompare(b.name));
await writeFile(
  resolve(catalogDir, "marketplace-pipelines.json"),
  `${JSON.stringify({
    source: "Generated from Harness stable global agent templates",
    generatedAt: new Date().toISOString(),
    count: pipelines.length,
    pipelines,
  }, null, 2)}\n`,
);

console.log(`Generated ${pipelines.length} marketplace pipeline samples.`);

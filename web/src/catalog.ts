import catalogJson from "@catalog/catalog.json";
import marketplaceJson from "@catalog/marketplace.json";
import marketplacePipelinesJson from "@catalog/marketplace-pipelines.json";

export type Ownership = "custom" | "harness_verified" | "harness_managed";
export type LinkType = "custom" | "system";

export type ConfigKind = "connector" | "secret" | "input" | "value";
export type ConfigRequirement = "required" | "optional" | "not_needed";

export type ConfigItem = {
  key: string;
  label: string;
  kind: ConfigKind;
  requirement: ConfigRequirement;
  field: string;
  note: string;
};

export type Agent = {
  id: string;
  harnessAgentId: string;
  name: string;
  summary: string;
  description: string;
  ownership: Ownership;
  linkType: LinkType;
  lifecycle: string[];
  modules: string[];
  triggers: string[];
  scope: string;
  version: string;
  availability?: "available" | "coming_soon";
  inputs: string[];
  configuration: ConfigItem[];
  prerequisites: string[];
  keywords: string[];
};

export type Pipeline = {
  id: string;
  name: string;
  identifier: string;
  summary: string;
  lifecycle: string[];
  modules: string[];
  triggers: string[];
  complexity: string;
  availability?: "available" | "coming_soon";
  agentIds: string[];
  yamlFile: string;
  stages: string[];
  runtimeInputs: string[];
  configuration?: ConfigItem[];
  prerequisites?: string[];
};

export const customAgents = catalogJson.agents as Agent[];
export const marketplaceAgents = marketplaceJson.agents as Agent[];
export const agents = [...marketplaceAgents, ...customAgents];
export const customPipelines = catalogJson.pipelines as Pipeline[];
export const marketplacePipelines = marketplacePipelinesJson.pipelines as Pipeline[];
export const pipelines = [...marketplacePipelines, ...customPipelines];

const yamlModules = import.meta.glob<string>(
  "@catalog/pipelines/**/*.pipeline.yaml",
  { query: "?raw", import: "default", eager: true },
);
const yamlByFile = Object.fromEntries(
  Object.entries(yamlModules).map(([path, yaml]) => [path.split("/").at(-1)!, yaml]),
);

export function agentById(id: string) {
  return agents.find((a) => a.id === id);
}

export function pipelineById(id: string) {
  return pipelines.find((p) => p.id === id);
}

export function pipelinesForAgent(agentId: string) {
  return pipelines.filter((p) => p.agentIds.includes(agentId));
}

export function yamlForPipeline(pipeline: Pipeline) {
  return yamlByFile[pipeline.yamlFile] ?? "";
}

export function requiredConfig(agent: Agent) {
  return agent.configuration.filter((c) => c.requirement === "required");
}

export function ownershipLabel(ownership: Ownership) {
  if (ownership === "harness_verified") return "Harness verified";
  if (ownership === "harness_managed") return "Harness managed";
  return "Custom";
}

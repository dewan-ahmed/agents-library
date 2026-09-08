import { agents, pipelines, type Agent, type Pipeline } from "./catalog";

export type MatchResult = {
  query: string;
  interpretedGoal: string;
  confidence: "high" | "medium" | "low";
  assumptions: string[];
  agents: Array<{ agent: Agent; score: number; reasons: string[] }>;
  pipelines: Array<{ pipeline: Pipeline; score: number; reasons: string[] }>;
};

function tokens(text: string) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function scoreText(queryTokens: string[], fields: Array<{ text: string; weight: number; label: string }>) {
  const reasons = new Set<string>();
  let score = 0;
  for (const token of queryTokens) {
    for (const field of fields) {
      if (field.text.includes(token)) {
        score += field.weight;
        reasons.add(field.label);
      }
    }
  }
  return { score, reasons: [...reasons] };
}

export function matchCatalog(query: string): MatchResult {
  const q = query.trim();
  const queryTokens = tokens(q);
  if (!q || queryTokens.length === 0) {
    return {
      query: q,
      interpretedGoal: "",
      confidence: "low",
      assumptions: [],
      agents: [],
      pipelines: [],
    };
  }

  const agentHits = agents
    .filter((agent) => agent.availability !== "coming_soon")
    .map((agent) => {
      const { score, reasons } = scoreText(queryTokens, [
        { text: agent.name.toLowerCase(), weight: 6, label: "name" },
        { text: agent.keywords.join(" ").toLowerCase(), weight: 4, label: "keywords" },
        { text: agent.summary.toLowerCase(), weight: 3, label: "summary" },
        { text: agent.description.toLowerCase(), weight: 2, label: "description" },
        { text: agent.lifecycle.join(" "), weight: 2, label: "lifecycle" },
        { text: agent.triggers.join(" "), weight: 2, label: "trigger" },
        { text: (agent.useCases ?? []).join(" "), weight: 3, label: "use case" },
        { text: (agent.author ?? "").toLowerCase(), weight: 2, label: "author" },
      ]);
      return { agent, score, reasons };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const pipelineHits = pipelines
    .filter((pipeline) => pipeline.availability !== "coming_soon")
    .map((pipeline) => {
      const relatedNames = pipeline.agentIds
        .map((id) => agents.find((a) => a.id === id)?.name ?? id)
        .join(" ");
      const { score, reasons } = scoreText(queryTokens, [
        { text: pipeline.name.toLowerCase(), weight: 6, label: "name" },
        { text: pipeline.summary.toLowerCase(), weight: 3, label: "summary" },
        { text: relatedNames.toLowerCase(), weight: 3, label: "agent" },
        { text: pipeline.lifecycle.join(" "), weight: 2, label: "lifecycle" },
        { text: pipeline.triggers.join(" "), weight: 2, label: "trigger" },
        { text: (pipeline.useCases ?? []).join(" "), weight: 3, label: "use case" },
        { text: pipeline.stages.join(" ").toLowerCase(), weight: 1, label: "stages" },
      ]);
      return { pipeline, score, reasons };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const top = agentHits[0]?.score ?? 0;
  const confidence: MatchResult["confidence"] =
    top >= 12 ? "high" : top >= 6 ? "medium" : "low";

  return {
    query: q,
    interpretedGoal: q,
    confidence,
    assumptions: [
      "Matching is keyword-based against the curated catalog, not a live Harness inventory.",
      "Copied YAML still needs your LLM connector and Git connector mapped.",
    ],
    agents: agentHits,
    pipelines: pipelineHits,
  };
}

export const starterPrompts = [
  "Optimize Dockerfiles so CI layer cache hits more often",
  "Generate documentation from a cloned repository",
  "Remediate CRITICAL container image CVEs in a Dockerfile",
];

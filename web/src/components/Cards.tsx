import { Link } from "react-router-dom";
import { ownershipLabel, useCasesOf, yamlForPipeline, type Agent, type Pipeline } from "../catalog";
import { CopyButton } from "./YamlBlock";
import { ConfigSummary } from "./ConfigChecklist";
import { applyYamlScope, emptyScope, type HarnessScope } from "../scope";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="card">
      <div className="card-meta">
        <span className="kicker">{ownershipLabel(agent.ownership)}</span>
        {useCasesOf(agent).includes("enterprise") && <span className="pill">Enterprise</span>}
        {agent.availability === "coming_soon" && <span className="pill">Coming soon</span>}
      </div>
      <h3>
        <Link to={`/agents/${agent.id}`}>{agent.name}</Link>
      </h3>
      <p>{agent.summary}</p>
      <ConfigSummary items={agent.configuration} />
      <div className="card-foot">
        <span className="pill">{agent.scope}</span>
        {agent.author && <span className="muted">{agent.author}</span>}
        <span className="muted">v{agent.version}</span>
      </div>
    </article>
  );
}

export function PipelineCard({
  pipeline,
  scope = emptyScope,
}: {
  pipeline: Pipeline;
  scope?: HarnessScope;
}) {
  return (
    <article className="card">
      <div className="card-meta">
        <span className="kicker">{pipeline.complexity}</span>
        {useCasesOf(pipeline).includes("enterprise") && <span className="pill">Enterprise</span>}
        {pipeline.availability === "coming_soon" && <span className="pill">Coming soon</span>}
      </div>
      <h3>
        <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
      </h3>
      <p>{pipeline.summary}</p>
      <ConfigSummary items={pipeline.configuration ?? []} />
      <div className="card-foot">
        <span className="muted">
          {pipeline.stages.length} {pipeline.stages.length === 1 ? "stage" : "stages"}
        </span>
        <CopyButton text={applyYamlScope(yamlForPipeline(pipeline), scope)} />
      </div>
    </article>
  );
}

import { Link, useParams } from "react-router-dom";
import { agentById, ownershipLabel, pipelinesForAgent, useCasesOf, yamlForPipeline } from "../catalog";
import { agentConsoleUrl, applyYamlScope, scopeComplete, type HarnessScope } from "../scope";
import { YamlBlock } from "../components/YamlBlock";
import { ConfigChecklist } from "../components/ConfigChecklist";

export function AgentDetailPage({ scope }: { scope: HarnessScope }) {
  const { id } = useParams();
  const agent = id ? agentById(id) : undefined;
  if (!agent) {
    return (
      <div className="page">
        <p>Agent not found. <Link to="/agents">Back to catalog</Link></p>
      </div>
    );
  }
  const available = agent.availability !== "coming_soon";
  const url = available
    ? agentConsoleUrl(agent.harnessAgentId, agent.linkType, scope)
    : null;
  const related = pipelinesForAgent(agent.id);

  return (
    <div className="page">
      <div className="kicker">
        {ownershipLabel(agent.ownership)} · {agent.scope} · v{agent.version}
        {agent.author ? ` · ${agent.author}` : ""}
        {useCasesOf(agent).includes("enterprise") ? " · enterprise" : ""}
      </div>
      <div className="detail-head">
        <div>
          <h1 style={{ margin: "8px 0" }}>{agent.name}</h1>
          <p className="lede">{agent.description}</p>
        </div>
        <div className="actions">
          {url ? (
            <a className="btn" href={url} target="_blank" rel="noreferrer">
              Open in Harness
            </a>
          ) : (
            <button className="btn" type="button" disabled>
              Open in Harness
            </button>
          )}
        </div>
      </div>
      {!available && (
        <p className="banner" style={{ marginTop: 16 }}>
          This marketplace agent is marked “Coming soon” by Harness and is not ready for use.
        </p>
      )}
      {available && !scopeComplete(scope) && (
        <p className="banner" style={{ marginTop: 16 }}>
          Add account, org, and project IDs in <strong>Your Harness project</strong> to enable Open in Harness.
          This agent uses <code>?type={agent.linkType}</code>.
        </p>
      )}
      {agent.prerequisites.length > 0 && (
        <div className="section">
          <h2>Prerequisites</h2>
          <ul className="list">
            {agent.prerequisites.map((prerequisite) => (
              <li key={prerequisite}>{prerequisite}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="section">
        <h2>What you need to configure</h2>
        <p className="muted">
          Set these in your own Harness project. Nothing here is preconfigured for you.
        </p>
        {agent.configuration.length ? (
          <ConfigChecklist items={agent.configuration} />
        ) : (
          <p className="banner" style={{ marginTop: 12 }}>
            No customer-supplied connectors or required values were detected in the stable template.
          </p>
        )}
      </div>
      {agent.inputs.length > 0 && (
        <div className="section">
          <h2>Configuration fields</h2>
          <div className="starters">
            {agent.inputs.map((input) => (
              <span className="pill" key={input}>
                {input}
              </span>
            ))}
          </div>
        </div>
      )}
      {related.length > 0 && (
        <div className="section">
          <h2>Related pipelines</h2>
          <div className="grid">
            {related.map((pipeline) => (
              <article className="card" key={pipeline.id}>
                <h3>
                  <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
                </h3>
                <p>{pipeline.summary}</p>
              </article>
            ))}
          </div>
        </div>
      )}
      {related[0] && (
        <div className="section">
          <h2>Sample pipeline YAML</h2>
          <YamlBlock yaml={applyYamlScope(yamlForPipeline(related[0]), scope)}>
            <p className="muted">
              From <Link to={`/pipelines/${related[0].id}`}>{related[0].name}</Link>. Map your LLM and Git
              connectors before running.
            </p>
          </YamlBlock>
        </div>
      )}
    </div>
  );
}

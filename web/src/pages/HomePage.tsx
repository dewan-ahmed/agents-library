import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { agents, pipelines, yamlForPipeline } from "../catalog";
import { AgentCard } from "../components/Cards";
import { CopyButton } from "../components/YamlBlock";
import { matchCatalog, starterPrompts } from "../match";
import { applyYamlScope, type HarnessScope } from "../scope";

export function HomePage({ scope }: { scope: HarnessScope }) {
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const [draft, setDraft] = useState(qParam);

  const result = useMemo(() => matchCatalog(qParam), [qParam]);
  const hasQuery = Boolean(qParam.trim());

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const next = new URLSearchParams(params);
    if (draft.trim()) next.set("q", draft.trim());
    else next.delete("q");
    setParams(next);
  }

  function usePrompt(text: string) {
    setDraft(text);
    const next = new URLSearchParams(params);
    next.set("q", text);
    setParams(next);
  }

  return (
    <div className="page">
      <section className="hero">
        <div className="kicker">Public catalog</div>
        <h1>What are you trying to automate?</h1>
        <p className="lede">
          Describe a delivery problem. We’ll match it to worker agents and copyable pipeline YAML.
          Or skip the composer and browse the library.
        </p>
        <form className="composer" onSubmit={submit}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Example: speed up Docker builds by fixing layer cache misses…"
          />
          <div className="composer-row">
            <span className="muted">No login required</span>
            <button className="btn" type="submit">
              Match agents
            </button>
          </div>
        </form>
        <div className="starters">
          {starterPrompts.map((prompt) => (
            <button className="chip" type="button" key={prompt} onClick={() => usePrompt(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </section>

      {hasQuery ? (
        <MatchPanel result={result} scope={scope} />
      ) : (
        <div className="section">
          <h2>Or browse the library</h2>
          <div className="grid grid-3">
            <div className="card">
              <h3>Agents</h3>
              <p>{agents.length} curated worker agents you can explore and open in Harness.</p>
              <Link to="/agents">Browse all agents</Link>
            </div>
            <div className="card">
              <h3>Pipelines</h3>
              <p>{pipelines.length} example pipelines that call those agents. Copy the YAML and paste it in Harness.</p>
              <Link to="/pipelines">Browse all pipelines</Link>
            </div>
            <div className="card">
              <h3>Lifecycle</h3>
              <p>See how many agents contribute to build, deploy, secure, and the rest of the delivery cloud.</p>
              <Link to="/lifecycle">Open the lifecycle cloud</Link>
            </div>
          </div>
          <div className="grid" style={{ marginTop: 16 }}>
            {agents
              .filter((agent) => agent.availability !== "coming_soon")
              .slice(0, 6)
              .map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchPanel({
  result,
  scope,
}: {
  result: ReturnType<typeof matchCatalog>;
  scope: HarnessScope;
}) {
  if (result.agents.length === 0 && result.pipelines.length === 0) {
    return (
      <div className="section">
        <div className="banner">
          No confident match in this catalog. Try Docker cache, documentation, or test summaries — or{" "}
          <Link to="/agents">browse all agents</Link>.
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="kicker">{result.confidence} confidence</div>
      <h2>Interpreted goal</h2>
      <p className="lede">{result.interpretedGoal}</p>
      <ul className="list">
        {result.assumptions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 style={{ marginTop: 28 }}>Recommended worker agents</h2>
      <div className="grid">
        {result.agents.map(({ agent, reasons }) => (
          <article className="card" key={agent.id}>
            <div className="kicker">Why this matched: {reasons.join(", ")}</div>
            <h3>
              <Link to={`/agents/${agent.id}`}>{agent.name}</Link>
            </h3>
            <p>{agent.summary}</p>
            <div className="starters">
              {agent.keywords.slice(0, 4).map((k) => (
                <span className="pill" key={k}>
                  {k}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <h2 style={{ marginTop: 28 }}>Pipeline examples</h2>
      <div className="grid">
        {result.pipelines.map(({ pipeline, reasons }) => (
          <article className="card" key={pipeline.id}>
            <div className="kicker">Why this matched: {reasons.join(", ")}</div>
            <h3>
              <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
            </h3>
            <p>{pipeline.summary}</p>
            <div className="flow">
              {pipeline.stages.map((stage, index) => (
                <span key={stage} className="flow">
                  <span className="pill">{stage}</span>
                  {index < pipeline.stages.length - 1 && <span className="arrow">→</span>}
                </span>
              ))}
            </div>
            <div className="card-foot">
              <Link to={`/pipelines/${pipeline.id}`}>View example</Link>
              <CopyButton text={applyYamlScope(yamlForPipeline(pipeline), scope)} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

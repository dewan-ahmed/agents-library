import { agents, customAgents, marketplaceAgents, pipelines } from "../catalog";

export function AboutPage() {
  const enterpriseAgents = agents.filter((agent) => agent.useCases?.includes("enterprise")).length;
  const enterprisePipelines = pipelines.filter((pipeline) => pipeline.useCases?.includes("enterprise")).length;

  return (
    <div className="page">
      <div className="kicker">About</div>
      <h1>How this library works</h1>
      <p className="lede">
        This is a public, unauthenticated catalog. Matching and browse filters use curated metadata for{" "}
        {marketplaceAgents.length} Harness-managed marketplace agents, {customAgents.length} custom agents, and{" "}
        {pipelines.length} pipeline examples. It does not call Harness APIs and it does not create resources.
      </p>
      <div className="section">
        <h2>What you can do here</h2>
        <ul className="list">
          <li>Describe a problem on the homepage to match agents and copyable pipeline YAML.</li>
          <li>
            Open <strong>Lifecycle</strong> for a cloud of agent counts by delivery stage (build, deploy, and the rest).
          </li>
          <li>
            Browse agents and pipelines, including a <strong>use case</strong> filter. {enterpriseAgents} agents and{" "}
            {enterprisePipelines} pipelines are tagged <code>enterprise</code>.
          </li>
          <li>Copy pipeline YAML with <code>{"{{orgId}}"}</code> / <code>{"{{projectId}}"}</code> substitution.</li>
          <li>Open an agent in the Harness console after you set account, org, and project IDs in this browser.</li>
          <li>
            Custom agents show an author. Governance auditors need a Harness MCP connector (
            <code>YOUR_HARNESS_MCP_CONNECTOR</code>) and are read-only against your account.
          </li>
        </ul>
      </div>
      <div className="section">
        <h2>Open in Harness</h2>
        <p>
          If you provide account, org, and project IDs, agent links are built as:
        </p>
        <pre>{`https://app.harness.io/ng/account/{accountId}/all/ai-agents/orgs/{orgId}/projects/{projectId}/agents/{agentId}?type={custom|system}`}</pre>
        <p className="muted">
          Custom catalog agents use <code>type=custom</code>. Harness-managed marketplace agents use{" "}
          <code>type=system</code>. The agent must already exist in that project (or be a global system agent) for the
          link to open it.
        </p>
      </div>
      <div className="section">
        <h2>Copy YAML</h2>
        <p>
          Pipeline YAML is tokenized so your org and project identifiers can be substituted in the browser. Connectors,
          secrets, and repo names stay as placeholders such as <code>account.YOUR_LLM_CONNECTOR</code> and{" "}
          <code>YOUR_MODEL_ID</code>.
        </p>
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="page">
      <div className="kicker">About</div>
      <h1>How this library works</h1>
      <p className="lede">
        This is a public, unauthenticated catalog. Matching is grounded in curated metadata for three worker agents
        and three pipeline examples. It does not call Harness APIs and it does not create resources.
      </p>
      <div className="section">
        <h2>Open in Harness</h2>
        <p>
          If you provide account, org, and project IDs, agent links are built as:
        </p>
        <pre>{`https://app.harness.io/ng/account/{accountId}/all/ai-agents/orgs/{orgId}/projects/{projectId}/agents/{agentId}?type=custom`}</pre>
        <p className="muted">
          These v1 examples are custom agents (<code>type=custom</code>), not Harness-managed system agents.
        </p>
      </div>
      <div className="section">
        <h2>Copy YAML</h2>
        <p>
          Pipeline YAML is tokenized so your org and project identifiers can be substituted in the browser. Connectors,
          secrets, and repo names stay as examples or placeholders.
        </p>
      </div>
    </div>
  );
}

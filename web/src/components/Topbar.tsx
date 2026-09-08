import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { emptyScope, loadScope, saveScope, scopeComplete, type HarnessScope } from "../scope";

export function useScope() {
  const [scope, setScope] = useState<HarnessScope>(emptyScope);
  useEffect(() => {
    setScope(loadScope());
  }, []);
  function update(next: HarnessScope) {
    setScope(next);
    saveScope(next);
  }
  return { scope, update, complete: scopeComplete(scope) };
}

export function Topbar({
  scope,
  onChange,
}: {
  scope: HarnessScope;
  onChange: (scope: HarnessScope) => void;
}) {
  const [open, setOpen] = useState(false);
  const complete = scopeComplete(scope);
  return (
    <header className="topbar layout-top">
      <NavLink to="/" className="brand">
        <strong>Harness</strong>
        <span>AI Agents Library</span>
      </NavLink>
      <nav className="nav">
        <NavLink to="/lifecycle" className={({ isActive }) => (isActive ? "active" : "")}>
          Lifecycle
        </NavLink>
        <NavLink to="/agents" className={({ isActive }) => (isActive ? "active" : "")}>
          Agents
        </NavLink>
        <NavLink to="/pipelines" className={({ isActive }) => (isActive ? "active" : "")}>
          Pipelines
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
          About
        </NavLink>
        <button className="btn secondary" type="button" onClick={() => setOpen((v) => !v)}>
          {complete ? "Project set" : "Your Harness project"}
        </button>
      </nav>
      {open && (
        <div className="scope-panel">
          <div className="kicker">Optional</div>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            Stored only in this browser. Used to build Open in Harness links and fill org/project in YAML.
          </p>
          <label>
            Account ID
            <input
              value={scope.accountId}
              onChange={(e) => onChange({ ...scope, accountId: e.target.value })}
              placeholder="1234567890-abcdefghij1"
            />
          </label>
          <label>
            Org ID
            <input
              value={scope.orgId}
              onChange={(e) => onChange({ ...scope, orgId: e.target.value })}
              placeholder="default"
            />
          </label>
          <label>
            Project ID
            <input
              value={scope.projectId}
              onChange={(e) => onChange({ ...scope, projectId: e.target.value })}
              placeholder="default"
            />
          </label>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="btn secondary" type="button" onClick={() => setOpen(false)}>
              Done
            </button>
            <button className="btn ghost" type="button" onClick={() => onChange(emptyScope)}>
              Clear
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

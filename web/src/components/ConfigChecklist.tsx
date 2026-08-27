import type { ConfigItem, ConfigKind, ConfigRequirement } from "../catalog";

const kindLabel: Record<ConfigKind, string> = {
  connector: "Connector",
  secret: "Secret",
  input: "Pipeline input",
  value: "Value",
};

const requirementLabel: Record<ConfigRequirement, string> = {
  required: "Required",
  optional: "Optional",
  not_needed: "Not needed",
};

function StatusMark({ requirement }: { requirement: ConfigRequirement }) {
  if (requirement === "not_needed") {
    return (
      <svg className="cfg-mark" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6 9h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="cfg-mark" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.3" />
      {requirement === "required" ? (
        <circle cx="9" cy="9" r="3" fill="currentColor" />
      ) : (
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2" />
      )}
    </svg>
  );
}

export function ConfigChecklist({ items }: { items: ConfigItem[] }) {
  const order: ConfigRequirement[] = ["required", "optional", "not_needed"];
  const sorted = [...items].sort(
    (a, b) => order.indexOf(a.requirement) - order.indexOf(b.requirement),
  );
  return (
    <ul className="cfg-list">
      {sorted.map((item) => (
        <li className={`cfg-row cfg-${item.requirement}`} key={item.key}>
          <StatusMark requirement={item.requirement} />
          <div className="cfg-body">
            <div className="cfg-title">
              <strong>{item.label}</strong>
              <span className="pill">{kindLabel[item.kind]}</span>
              <span className="cfg-req">{requirementLabel[item.requirement]}</span>
            </div>
            <p className="muted">{item.note}</p>
            <code className="cfg-field">{item.field}</code>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** One-line summary for catalog cards. */
export function ConfigSummary({ items }: { items: ConfigItem[] }) {
  const required = items.filter((i) => i.requirement === "required");
  if (required.length === 0) return null;
  return (
    <p className="muted cfg-summary">
      Requires: {required.map((i) => i.label).join(", ")}
    </p>
  );
}

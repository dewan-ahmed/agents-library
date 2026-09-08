import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  agents,
  agentsGroupedByLifecycle,
  customAgents,
  marketplaceAgents,
  type Agent,
} from "../catalog";
import { AgentCard } from "../components/Cards";

type Source = "all" | "custom" | "marketplace";

function sourceAgents(source: Source) {
  if (source === "custom") return customAgents;
  if (source === "marketplace") return marketplaceAgents;
  return agents;
}

type Bubble = {
  key: string;
  label: string;
  color: string;
  count: number;
  agents: Agent[];
  r: number;
  x: number;
  y: number;
};

function packBubbles(groups: ReturnType<typeof agentsGroupedByLifecycle>): Bubble[] {
  const max = Math.max(...groups.map((g) => g.count), 1);
  const seeded = groups.map((g) => ({
    ...g,
    r: 34 + Math.sqrt(g.count / max) * 78,
    x: 0,
    y: 0,
  }));

  const placed: Bubble[] = [];
  for (const bubble of seeded) {
    if (placed.length === 0) {
      placed.push(bubble);
      continue;
    }
    let best: { x: number; y: number; score: number } | null = null;
    for (const other of placed) {
      for (let step = 0; step < 48; step += 1) {
        const angle = (step / 48) * Math.PI * 2;
        const dist = other.r + bubble.r + 14;
        const x = other.x + Math.cos(angle) * dist;
        const y = other.y + Math.sin(angle) * dist;
        const clear = placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + bubble.r + 12);
        if (!clear) continue;
        const score = x * x + y * y * 1.05;
        if (!best || score < best.score) best = { x, y, score };
      }
    }
    placed.push({ ...bubble, x: best?.x ?? 0, y: best?.y ?? 0 });
  }
  return placed;
}

export function LifecyclePage() {
  const [source, setSource] = useState<Source>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const pool = sourceAgents(source);
  const groups = useMemo(() => agentsGroupedByLifecycle(pool), [pool]);
  const bubbles = useMemo(() => packBubbles(groups), [groups]);
  const active = groups.find((g) => g.key === selected) ?? groups[0];

  const xs = bubbles.flatMap((b) => [b.x - b.r, b.x + b.r]);
  const ys = bubbles.flatMap((b) => [b.y - b.r, b.y + b.r]);
  const minX = Math.min(...xs) - 28;
  const maxX = Math.max(...xs) + 28;
  const minY = Math.min(...ys) - 28;
  const maxY = Math.max(...ys) + 28;
  const width = maxX - minX;
  const height = maxY - minY;

  return (
    <div className="page page-wide">
      <div className="kicker">Map</div>
      <h1 style={{ marginTop: 8 }}>Lifecycle cloud</h1>
      <p className="lede">
        Each bubble is a delivery stage. Its size is how many agents in this catalog contribute there.
        An agent that spans more than one stage is counted in each. Catalog CD work is tagged{" "}
        <code>release</code> and shown here as Deploy.
      </p>

      <div className="starters" style={{ marginTop: 18 }}>
        {([
          ["all", `All · ${agents.length}`],
          ["custom", `Custom · ${customAgents.length}`],
          ["marketplace", `Marketplace · ${marketplaceAgents.length}`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`chip ${source === key ? "active" : ""}`}
            onClick={() => {
              setSource(key);
              setSelected(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="life-cloud" aria-label="Agent contribution cloud by lifecycle">
        <div className="life-mist" />
        <svg
          className="life-svg"
          viewBox={`${minX} ${minY} ${width} ${height}`}
          role="img"
        >
          <title>Agents contributed per lifecycle</title>
          {bubbles.map((bubble, index) => {
            const isOn = (selected ?? groups[0]?.key) === bubble.key;
            const wordSize = Math.max(12, Math.min(22, bubble.r * 0.32));
            const countSize = Math.max(16, Math.min(28, bubble.r * 0.38));
            return (
              <g key={bubble.key} transform={`translate(${bubble.x} ${bubble.y})`}>
                <g
                  className={`life-bubble ${isOn ? "is-on" : ""}`}
                  style={{ animationDelay: `${index * 0.28}s` }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isOn}
                  aria-label={`${bubble.label}, ${bubble.count} agents`}
                  onClick={() => setSelected(bubble.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(bubble.key);
                    }
                  }}
                >
                  <circle r={bubble.r} fill={bubble.color} fillOpacity={isOn ? 0.96 : 0.8} />
                  <circle
                    r={bubble.r * 0.7}
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.32)"
                    strokeWidth={1.5}
                  />
                  <text className="life-word" y={-6} fontSize={wordSize}>
                    {bubble.label}
                  </text>
                  <text className="life-count" y={countSize - 4} fontSize={countSize}>
                    {bubble.count}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {active && (
        <div className="section">
          <h2>
            {active.label}
            <span className="muted" style={{ marginLeft: 10, fontWeight: 500 }}>
              {active.count} {active.count === 1 ? "agent" : "agents"}
            </span>
          </h2>
          <div className="grid">
            {active.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            <Link to="/agents">Browse the full catalog</Link> and filter by lifecycle there.
          </p>
        </div>
      )}
    </div>
  );
}

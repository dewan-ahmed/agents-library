import { useCallback, useMemo, useState } from "react";
import { agents, useCasesOf } from "../catalog";
import { AgentCard } from "../components/Cards";
import { EmptyHint, FilterRail, toggleFacet, useFacetFilter } from "../components/Filters";

function values(field: "ownership" | "lifecycle" | "triggers" | "modules" | "availability" | "useCases" | "author") {
  return [...new Set(agents.flatMap((agent) => {
    if (field === "useCases") return useCasesOf(agent);
    if (field === "author") return agent.author ? [agent.author] : [];
    const value = agent[field];
    return Array.isArray(value) ? value : [value ?? "available"];
  }))].sort();
}

export function AgentsPage() {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const facets = useMemo(() => [
    { key: "ownership", label: "Ownership", options: values("ownership") },
    { key: "availability", label: "Availability", options: values("availability") },
    { key: "lifecycle", label: "Lifecycle", options: values("lifecycle") },
    { key: "trigger", label: "Trigger", options: values("triggers") },
    { key: "module", label: "Module", options: values("modules") },
    { key: "useCase", label: "Use case", options: values("useCases") },
    { key: "author", label: "Author", options: values("author") },
  ], []);
  const getValues = useCallback((agent: (typeof agents)[number], key: string) => {
    if (key === "ownership") return [agent.ownership];
    if (key === "availability") return [agent.availability ?? "available"];
    if (key === "lifecycle") return agent.lifecycle;
    if (key === "trigger") return agent.triggers;
    if (key === "module") return agent.modules;
    if (key === "useCase") return useCasesOf(agent);
    if (key === "author") return agent.author ? [agent.author] : [];
    return [];
  }, []);
  const filtered = useFacetFilter(agents, selected, getValues);

  return (
    <div className="page">
      <div className="kicker">Catalog</div>
      <h1 style={{ marginTop: 8 }}>Worker Agents</h1>
      <p className="lede">
        Browse Harness-managed marketplace agents and the curated custom examples. Filter by
        lifecycle, trigger, module, ownership, availability, use case, or author.
      </p>
      <div className="browse" style={{ marginTop: 28 }}>
        <FilterRail
          facets={facets}
          selected={selected}
          onToggle={(key, value) => setSelected((prev) => toggleFacet(prev, key, value))}
        />
        <div className="browse-main">
          <p className="muted">{filtered.length} agents</p>
          {filtered.length === 0 ? (
            <EmptyHint>No agents match those filters. Clear a checkbox or describe the problem on the homepage.</EmptyHint>
          ) : (
            <div className="grid" style={{ marginTop: 12 }}>
              {filtered.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

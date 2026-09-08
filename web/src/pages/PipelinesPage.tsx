import { useCallback, useMemo, useState } from "react";
import { pipelines, useCasesOf } from "../catalog";
import { PipelineCard } from "../components/Cards";
import { EmptyHint, FilterRail, toggleFacet, useFacetFilter } from "../components/Filters";
import type { HarnessScope } from "../scope";

function values(field: "lifecycle" | "triggers" | "complexity" | "availability" | "useCases") {
  return [...new Set(pipelines.flatMap((pipeline) => {
    if (field === "useCases") return useCasesOf(pipeline);
    const value = pipeline[field];
    return Array.isArray(value) ? value : [value ?? "available"];
  }))].sort();
}

export function PipelinesPage({ scope }: { scope: HarnessScope }) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const facets = useMemo(() => [
    { key: "availability", label: "Availability", options: values("availability") },
    { key: "lifecycle", label: "Lifecycle", options: values("lifecycle") },
    { key: "trigger", label: "Trigger", options: values("triggers") },
    { key: "complexity", label: "Complexity", options: values("complexity") },
    { key: "useCase", label: "Use case", options: values("useCases") },
  ], []);
  const getValues = useCallback((pipeline: (typeof pipelines)[number], key: string) => {
    if (key === "availability") return [pipeline.availability ?? "available"];
    if (key === "lifecycle") return pipeline.lifecycle;
    if (key === "trigger") return pipeline.triggers;
    if (key === "complexity") return [pipeline.complexity];
    if (key === "useCase") return useCasesOf(pipeline);
    return [];
  }, []);
  const filtered = useFacetFilter(pipelines, selected, getValues);

  return (
    <div className="page">
      <div className="kicker">Catalog</div>
      <h1 style={{ marginTop: 8 }}>Pipeline examples</h1>
      <p className="lede">Copy YAML and paste it into your Harness project. Agent steps reference the curated worker agent ids.</p>
      <div className="browse" style={{ marginTop: 28 }}>
        <FilterRail
          facets={facets}
          selected={selected}
          onToggle={(key, value) => setSelected((prev) => toggleFacet(prev, key, value))}
        />
        <div className="browse-main">
          <p className="muted">{filtered.length} pipelines</p>
          {filtered.length === 0 ? (
            <EmptyHint>No pipelines match those filters.</EmptyHint>
          ) : (
            <div className="grid" style={{ marginTop: 12 }}>
              {filtered.map((pipeline) => (
                <PipelineCard key={pipeline.id} pipeline={pipeline} scope={scope} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

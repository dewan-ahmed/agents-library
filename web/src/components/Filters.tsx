import { useMemo, type ReactNode } from "react";

export function FilterRail({
  facets,
  selected,
  onToggle,
}: {
  facets: Array<{ key: string; label: string; options: string[] }>;
  selected: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
}) {
  return (
    <aside className="filters">
      {facets.map((facet) => (
        <div className="filter-group" key={facet.key}>
          <strong>{facet.label}</strong>
          {facet.options.map((option) => {
            const checked = selected[facet.key]?.includes(option) ?? false;
            return (
              <label key={option} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(facet.key, option)}
                />
                {option.replaceAll("_", " ")}
              </label>
            );
          })}
        </div>
      ))}
    </aside>
  );
}

export function useFacetFilter<T>(
  items: T[],
  selected: Record<string, string[]>,
  getValues: (item: T, key: string) => string[],
) {
  return useMemo(() => {
    return items.filter((item) =>
      Object.entries(selected).every(([key, values]) => {
        if (!values.length) return true;
        const itemValues = getValues(item, key);
        return values.some((v) => itemValues.includes(v));
      }),
    );
  }, [items, selected, getValues]);
}

export function toggleFacet(
  selected: Record<string, string[]>,
  key: string,
  value: string,
): Record<string, string[]> {
  const current = selected[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return { ...selected, [key]: next };
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="muted">{children}</p>;
}

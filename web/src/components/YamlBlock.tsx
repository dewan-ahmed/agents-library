import { useState, type ReactNode } from "react";

async function writeToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Clipboard API is unavailable outside secure contexts.
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(area);
  if (!ok) throw new Error("copy command rejected");
}

type CopyState = "idle" | "copied" | "failed";

function useCopy(text: string) {
  const [state, setState] = useState<CopyState>("idle");
  async function copy() {
    try {
      await writeToClipboard(text);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }
  return { state, copy };
}

function CopyGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="5.75" y="5.75" width="8.5" height="8.5" rx="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M10.25 3.75V3.5A1.75 1.75 0 0 0 8.5 1.75h-5A1.75 1.75 0 0 0 1.75 3.5v5c0 .966.784 1.75 1.75 1.75h.25"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8.5l3.25 3.25L13 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icon-only copy control, anchored inside a code frame. */
export function CopyIconButton({ text, title = "Copy YAML" }: { text: string; title?: string }) {
  const { state, copy } = useCopy(text);
  const label = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : title;
  return (
    <button className="copy-icon" type="button" onClick={copy} title={label} aria-label={label}>
      {state === "copied" ? <CheckGlyph /> : <CopyGlyph />}
    </button>
  );
}

/** Labeled copy control for places with no visible code, such as catalog cards. */
export function CopyButton({ text, label = "Copy YAML" }: { text: string; label?: string }) {
  const { state, copy } = useCopy(text);
  return (
    <button className="btn secondary" type="button" onClick={copy}>
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label}
    </button>
  );
}

export function YamlBlock({ yaml, children }: { yaml: string; children?: ReactNode }) {
  return (
    <div className="yaml-block">
      {children}
      <div className="code-frame">
        <CopyIconButton text={yaml} />
        <pre>{yaml}</pre>
      </div>
    </div>
  );
}

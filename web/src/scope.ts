export type HarnessScope = {
  accountId: string;
  orgId: string;
  projectId: string;
};

const KEY = "harness-ai-agents-library-scope";

export const emptyScope: HarnessScope = {
  accountId: "",
  orgId: "",
  projectId: "",
};

export function loadScope(): HarnessScope {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyScope;
    const parsed = JSON.parse(raw) as Partial<HarnessScope>;
    return {
      accountId: parsed.accountId ?? "",
      orgId: parsed.orgId ?? "",
      projectId: parsed.projectId ?? "",
    };
  } catch {
    return emptyScope;
  }
}

export function saveScope(scope: HarnessScope) {
  localStorage.setItem(KEY, JSON.stringify(scope));
}

export function scopeComplete(scope: HarnessScope) {
  return Boolean(scope.accountId.trim() && scope.orgId.trim() && scope.projectId.trim());
}

export function applyYamlScope(yaml: string, scope: HarnessScope) {
  let out = yaml;
  const replacements: Array<[string, string]> = [
    ["{{accountId}}", scope.accountId.trim()],
    ["{{orgId}}", scope.orgId.trim()],
    ["{{projectId}}", scope.projectId.trim()],
  ];
  for (const [token, value] of replacements) {
    if (value) out = out.replaceAll(token, value);
  }
  return out;
}

export function agentConsoleUrl(
  harnessAgentId: string,
  linkType: "custom" | "system",
  scope: HarnessScope,
) {
  if (!scopeComplete(scope)) return null;
  const { accountId, orgId, projectId } = scope;
  return `https://app.harness.io/ng/account/${encodeURIComponent(accountId)}/all/ai-agents/orgs/${encodeURIComponent(orgId)}/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(harnessAgentId)}?type=${linkType}`;
}

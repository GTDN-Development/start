export type ApplicationScope = "personal" | "workspace" | "other";

export function normalizeWorkspaceSlug(workspaceSlug: string | null | undefined): string | null {
  const normalizedWorkspaceSlug = workspaceSlug?.trim() ?? "";

  if (!normalizedWorkspaceSlug) {
    return null;
  }

  if (normalizedWorkspaceSlug.startsWith("[") && normalizedWorkspaceSlug.endsWith("]")) {
    return null;
  }

  return normalizedWorkspaceSlug;
}

export function getWorkspaceSlugFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 2 || segments[0] !== "w") {
    return null;
  }

  return normalizeWorkspaceSlug(segments[1] ?? "");
}

export function isPersonalScopePath(pathname: string): boolean {
  return pathname === "/app";
}

export function isWorkspaceScopePath(pathname: string): boolean {
  return pathname === "/w" || pathname.startsWith("/w/");
}

export function resolveApplicationScope(pathname: string): ApplicationScope {
  if (isWorkspaceScopePath(pathname)) {
    return "workspace";
  }

  if (isPersonalScopePath(pathname)) {
    return "personal";
  }

  return "other";
}

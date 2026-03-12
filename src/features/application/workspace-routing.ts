import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-types";

export function normalizeWorkspaceSlug(workspaceSlug: string | null | undefined): string | null {
  const normalizedWorkspaceSlug = workspaceSlug?.trim() ?? "";

  if (!normalizedWorkspaceSlug) {
    return null;
  }

  if (
    normalizedWorkspaceSlug.startsWith("[") &&
    normalizedWorkspaceSlug.endsWith("]")
  ) {
    return null;
  }

  return normalizedWorkspaceSlug;
}

export function getWorkspaceSlugFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3 || segments[0] !== "w") {
    return null;
  }

  return normalizeWorkspaceSlug(segments[1] ?? "");
}

export function resolveSelectedWorkspaceSlug(
  pathname: string,
  activeWorkspaceSlug: string | null,
  workspaces: WorkspaceNavigationItem[]
): string | null {
  const pathnameWorkspaceSlug = getWorkspaceSlugFromPathname(pathname);

  if (pathnameWorkspaceSlug && isWorkspaceSlugAvailable(workspaces, pathnameWorkspaceSlug)) {
    return pathnameWorkspaceSlug;
  }

  const normalizedActiveWorkspaceSlug = normalizeWorkspaceSlug(activeWorkspaceSlug);

  if (
    normalizedActiveWorkspaceSlug &&
    isWorkspaceSlugAvailable(workspaces, normalizedActiveWorkspaceSlug)
  ) {
    return normalizedActiveWorkspaceSlug;
  }

  return normalizeWorkspaceSlug(workspaces[0]?.slug ?? null);
}

function isWorkspaceSlugAvailable(
  workspaces: WorkspaceNavigationItem[],
  workspaceSlug: string
): boolean {
  return workspaces.some((workspace) => workspace.slug === workspaceSlug);
}

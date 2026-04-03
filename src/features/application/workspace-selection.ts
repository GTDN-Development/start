import {
  getWorkspaceSlugFromPathname,
  normalizeWorkspaceSlug,
} from "@/features/application/application-scope";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";

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

  return null;
}

function isWorkspaceSlugAvailable(
  workspaces: WorkspaceNavigationItem[],
  workspaceSlug: string
): boolean {
  return workspaces.some((workspace) => workspace.slug === workspaceSlug);
}

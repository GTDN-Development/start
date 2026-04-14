"use client";

import { WorkspaceNavigationProvider } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";

type ApplicationWorkspaceRootProps = {
  children: React.ReactNode;
  workspaces: WorkspaceNavigationItem[];
  activeWorkspaceSlug: string | null;
};

export function ApplicationWorkspaceRoot({
  children,
  workspaces,
  activeWorkspaceSlug,
}: ApplicationWorkspaceRootProps) {
  const workspaceNavigationKey = `${activeWorkspaceSlug ?? ""}:${workspaces
    .map((workspace) =>
      [
        workspace.id,
        workspace.slug,
        workspace.name,
        workspace.role,
        workspace.avatarUrl ?? "",
      ].join(":")
    )
    .join("|")}`;

  return (
    <WorkspaceNavigationProvider
      key={workspaceNavigationKey}
      initialWorkspaces={workspaces}
      initialActiveWorkspaceSlug={activeWorkspaceSlug}
    >
      {children}
    </WorkspaceNavigationProvider>
  );
}

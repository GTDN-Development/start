"use client";

import { createContext, useContext, useState } from "react";
import type { WorkspaceNavigationItem } from "./workspace-navigation-types";

type WorkspaceNavigationState = {
  activeWorkspaceSlug: string | null;
  workspaces: WorkspaceNavigationItem[];
};

type WorkspaceNavigationContextValue = WorkspaceNavigationState & {
  patchWorkspace: (workspaceId: string, patch: Partial<WorkspaceNavigationItem>) => void;
};

type WorkspaceNavigationProviderProps = {
  initialWorkspaces: WorkspaceNavigationItem[];
  initialActiveWorkspaceSlug: string | null;
  children: React.ReactNode;
};

const WorkspaceNavigationContext = createContext<WorkspaceNavigationContextValue | null>(null);

export function WorkspaceNavigationProvider({
  initialWorkspaces,
  initialActiveWorkspaceSlug,
  children,
}: WorkspaceNavigationProviderProps) {
  const [navigationState, setNavigationState] = useState<WorkspaceNavigationState>({
    activeWorkspaceSlug: initialActiveWorkspaceSlug,
    workspaces: initialWorkspaces,
  });

  function patchWorkspace(workspaceId: string, patch: Partial<WorkspaceNavigationItem>) {
    setNavigationState((current) => {
      const previousWorkspace =
        current.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;

      if (!previousWorkspace) {
        return current;
      }

      const nextWorkspace = {
        ...previousWorkspace,
        ...patch,
      };

      return {
        activeWorkspaceSlug:
          current.activeWorkspaceSlug === previousWorkspace.slug
            ? nextWorkspace.slug
            : current.activeWorkspaceSlug,
        workspaces: current.workspaces.map((workspace) =>
          workspace.id === workspaceId ? nextWorkspace : workspace
        ),
      };
    });
  }

  return (
    <WorkspaceNavigationContext.Provider
      value={{
        activeWorkspaceSlug: navigationState.activeWorkspaceSlug,
        workspaces: navigationState.workspaces,
        patchWorkspace,
      }}
    >
      {children}
    </WorkspaceNavigationContext.Provider>
  );
}

export function useWorkspaceNavigation() {
  const context = useContext(WorkspaceNavigationContext);

  if (!context) {
    throw new Error("useWorkspaceNavigation must be used within WorkspaceNavigationProvider");
  }

  return context;
}

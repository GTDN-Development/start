"use client";

import { createContext, useContext, useState } from "react";
import type { WorkspaceNavigationItem } from "./workspace-navigation-types";

type WorkspaceNavigationState = {
  activeWorkspaceSlug: string | null;
  workspaces: WorkspaceNavigationItem[];
};

type WorkspaceNavigationContextValue = WorkspaceNavigationState & {
  upsertWorkspace: (workspace: WorkspaceNavigationItem) => void;
  removeWorkspace: (workspaceId: string) => void;
  setActiveWorkspaceSlug: (workspaceSlug: string | null) => void;
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

  function upsertWorkspace(workspace: WorkspaceNavigationItem) {
    setNavigationState((current) => {
      const previousWorkspace =
        current.workspaces.find((candidateWorkspace) => candidateWorkspace.id === workspace.id) ??
        null;

      const nextWorkspaces = sortWorkspaceNavigationItems(
        previousWorkspace
          ? current.workspaces.map((candidateWorkspace) =>
              candidateWorkspace.id === workspace.id ? workspace : candidateWorkspace
            )
          : [...current.workspaces, workspace]
      );

      return {
        activeWorkspaceSlug:
          previousWorkspace && current.activeWorkspaceSlug === previousWorkspace.slug
            ? workspace.slug
            : current.activeWorkspaceSlug,
        workspaces: nextWorkspaces,
      };
    });
  }

  function removeWorkspace(workspaceId: string) {
    setNavigationState((current) => {
      const previousWorkspace =
        current.workspaces.find((candidateWorkspace) => candidateWorkspace.id === workspaceId) ??
        null;

      if (!previousWorkspace) {
        return current;
      }

      return {
        activeWorkspaceSlug:
          current.activeWorkspaceSlug === previousWorkspace.slug
            ? null
            : current.activeWorkspaceSlug,
        workspaces: current.workspaces.filter(
          (candidateWorkspace) => candidateWorkspace.id !== workspaceId
        ),
      };
    });
  }

  function setActiveWorkspaceSlug(workspaceSlug: string | null) {
    setNavigationState((current) => ({
      ...current,
      activeWorkspaceSlug: workspaceSlug,
    }));
  }

  return (
    <WorkspaceNavigationContext.Provider
      value={{
        activeWorkspaceSlug: navigationState.activeWorkspaceSlug,
        workspaces: navigationState.workspaces,
        upsertWorkspace,
        removeWorkspace,
        setActiveWorkspaceSlug,
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

export function useOptionalWorkspaceNavigation(): WorkspaceNavigationContextValue | null {
  return useContext(WorkspaceNavigationContext);
}

function sortWorkspaceNavigationItems(workspaces: WorkspaceNavigationItem[]) {
  return [...workspaces].sort((firstWorkspace, secondWorkspace) =>
    firstWorkspace.name.localeCompare(secondWorkspace.name)
  );
}

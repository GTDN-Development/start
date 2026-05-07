"use client";

import { startTransition, useState } from "react";
import { WorkspaceAvatarSettingsItem } from "@/features/workspaces/settings/general/workspace-avatar-settings-item";
import {
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  updateWorkspaceGeneralAction,
} from "@/features/workspaces/settings/general/workspace-general-actions";
import { WorkspaceDangerSettingsItem } from "@/features/workspaces/settings/general/workspace-danger-settings-item";
import { WorkspaceTextSettingsItem } from "@/features/workspaces/settings/general/workspace-text-settings-item";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { useApplyWorkspaceNavigationPatch } from "@/features/workspaces/workspace-navigation-context";
import type {
  WorkspaceNavigationItem,
  WorkspaceNavigationPatch,
} from "@/features/workspaces/workspace-navigation-types";
import { runAsyncTransition } from "@/lib/app-utils";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

type UpdateWorkspaceGeneralActionInput = {
  name?: string;
  slug?: string;
  removeAvatar?: boolean;
  avatarFile?: File;
};

type UpdateWorkspaceGeneralActionResult = WorkspaceResponse<{
  workspaceSlug: string;
  workspace: WorkspaceNavigationItem;
  navigationPatch: WorkspaceNavigationPatch;
}>;

type WorkspaceRemovalActionResult<TFlag extends "left" | "deleted"> = WorkspaceResponse<
  Record<TFlag, true> & {
    navigationPatch: WorkspaceNavigationPatch;
  }
>;

export function WorkspaceGeneralSettingsSection({
  initialWorkspace,
}: {
  initialWorkspace: WorkspaceSettingsWorkspace;
}) {
  const applyWorkspaceNavigationPatch = useApplyWorkspaceNavigationPatch();
  const [workspace, setWorkspace] = useState(initialWorkspace);

  async function handleUpdateWorkspaceAction(
    input: UpdateWorkspaceGeneralActionInput
  ): Promise<UpdateWorkspaceGeneralActionResult> {
    const currentWorkspace = workspace;
    const response = await runAsyncTransition(() =>
      updateWorkspaceGeneralAction(currentWorkspace.slug, input)
    );

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      setWorkspace({ ...currentWorkspace, ...response.data.workspace });
      applyWorkspaceNavigationPatch(response.data.navigationPatch);
    });

    return response;
  }

  async function handleWorkspaceRemovalAction<TFlag extends "left" | "deleted">(
    action: (workspaceSlug: string) => Promise<WorkspaceRemovalActionResult<TFlag>>
  ): Promise<WorkspaceRemovalActionResult<TFlag>> {
    const currentWorkspace = workspace;
    const response = await runAsyncTransition(() => action(currentWorkspace.slug));

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      applyWorkspaceNavigationPatch(response.data.navigationPatch);
    });

    return response;
  }

  function handleLeaveWorkspaceAction() {
    return handleWorkspaceRemovalAction(leaveWorkspaceAction);
  }

  function handleDeleteWorkspaceAction() {
    return handleWorkspaceRemovalAction(deleteWorkspaceAction);
  }

  return (
    <div className="grid gap-8">
      <WorkspaceTextSettingsItem
        key={`workspace-general-name:${workspace.name}:${workspace.role}`}
        field="name"
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceTextSettingsItem
        key={`workspace-general-url:${workspace.slug}:${workspace.role}`}
        field="url"
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceAvatarSettingsItem
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceDangerSettingsItem
        kind="leave"
        workspace={workspace}
        onAction={handleLeaveWorkspaceAction}
      />
      <WorkspaceDangerSettingsItem
        kind="delete"
        workspace={workspace}
        onAction={handleDeleteWorkspaceAction}
      />
    </div>
  );
}

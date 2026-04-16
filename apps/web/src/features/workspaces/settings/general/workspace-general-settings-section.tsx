"use client";

import { startTransition, useState } from "react";
import { APP_HOME_PATH, getWorkspaceSettingsHref } from "@/config/routes";
import { WorkspaceAvatarSettingsItem } from "@/features/workspaces/settings/general/workspace-avatar-settings-item";
import type {
  UpdateWorkspaceGeneralInput,
  WorkspaceGeneralDeleteHandler,
  WorkspaceGeneralLeaveHandler,
  WorkspaceGeneralUpdateHandler,
} from "@/features/workspaces/settings/general/workspace-general-settings-contract";
import {
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  updateWorkspaceGeneralAction,
} from "@/features/workspaces/settings/general/workspace-general-actions";
import { WorkspaceDeleteSettingsItem } from "@/features/workspaces/settings/general/workspace-delete-settings-item";
import { WorkspaceLeaveSettingsItem } from "@/features/workspaces/settings/general/workspace-leave-settings-item";
import { WorkspaceNameSettingsItem } from "@/features/workspaces/settings/general/workspace-name-settings-item";
import { WorkspaceUrlSettingsItem } from "@/features/workspaces/settings/general/workspace-url-settings-item";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import { useRouter } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";

export function WorkspaceGeneralSettingsSection({
  initialWorkspace,
}: {
  initialWorkspace: WorkspaceSettingsWorkspace;
}) {
  const router = useRouter();
  const { activeWorkspaceSlug, removeWorkspace, setActiveWorkspaceSlug, upsertWorkspace } =
    useWorkspaceNavigation();
  const [workspace, setWorkspace] = useState(initialWorkspace);

  const handleUpdateWorkspaceAction: WorkspaceGeneralUpdateHandler = async function updateWorkspace(
    input: UpdateWorkspaceGeneralInput
  ) {
    const currentWorkspace = workspace;
    const response = await runAsyncTransition(() =>
      updateWorkspaceGeneralAction(currentWorkspace.slug, input)
    );

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      const nextWorkspace = mergeWorkspaceSettingsWorkspace(
        currentWorkspace,
        response.data.workspace
      );
      const shouldUpdateActiveWorkspaceSlug =
        response.data.workspaceSlug !== currentWorkspace.slug &&
        (!activeWorkspaceSlug || activeWorkspaceSlug === currentWorkspace.slug);

      setWorkspace(nextWorkspace);
      upsertWorkspace(response.data.workspace);

      if (shouldUpdateActiveWorkspaceSlug) {
        setActiveWorkspaceSlug(response.data.workspaceSlug);
      }

      if (response.data.workspaceSlug !== currentWorkspace.slug) {
        router.replace(getWorkspaceSettingsHref(response.data.workspaceSlug));
      }
    });

    return response;
  };

  const handleLeaveWorkspaceAction: WorkspaceGeneralLeaveHandler = async function leaveWorkspace() {
    const currentWorkspace = workspace;
    const response = await runAsyncTransition(() => leaveWorkspaceAction(currentWorkspace.slug));

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      removeWorkspace(currentWorkspace.id);
      router.replace(APP_HOME_PATH);
    });

    return response;
  };

  const handleDeleteWorkspaceAction: WorkspaceGeneralDeleteHandler =
    async function deleteWorkspace() {
      const currentWorkspace = workspace;
      const response = await runAsyncTransition(() => deleteWorkspaceAction(currentWorkspace.slug));

      if (!response.ok) {
        return response;
      }

      startTransition(() => {
        removeWorkspace(currentWorkspace.id);
        router.replace(APP_HOME_PATH);
      });

      return response;
    };

  return (
    <div className="grid gap-8">
      <WorkspaceNameSettingsItem
        key={`workspace-general-name:${workspace.name}:${workspace.role}`}
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceUrlSettingsItem
        key={`workspace-general-url:${workspace.slug}:${workspace.role}`}
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceAvatarSettingsItem
        workspace={workspace}
        onUpdateWorkspaceAction={handleUpdateWorkspaceAction}
      />
      <WorkspaceLeaveSettingsItem
        workspace={workspace}
        onLeaveWorkspaceAction={handleLeaveWorkspaceAction}
      />
      <WorkspaceDeleteSettingsItem
        workspace={workspace}
        onDeleteWorkspaceAction={handleDeleteWorkspaceAction}
      />
    </div>
  );
}

function mergeWorkspaceSettingsWorkspace(
  workspace: WorkspaceSettingsWorkspace,
  patch: WorkspaceNavigationItem
): WorkspaceSettingsWorkspace {
  return {
    ...workspace,
    ...patch,
  };
}

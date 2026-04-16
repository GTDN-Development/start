import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import type { WorkspaceResponse } from "@/server/workspaces/workspace-types";

export type UpdateWorkspaceGeneralInput = {
  name?: string;
  slug?: string;
  removeAvatar?: boolean;
  avatarFile?: File;
};

export type UpdateWorkspaceGeneralResult = WorkspaceResponse<{
  workspaceSlug: string;
  workspace: WorkspaceNavigationItem;
}>;

export type WorkspaceGeneralUpdateHandler = (
  input: UpdateWorkspaceGeneralInput
) => Promise<UpdateWorkspaceGeneralResult>;

export type WorkspaceGeneralLeaveHandler = () => Promise<WorkspaceResponse<{ left: true }>>;

export type WorkspaceGeneralDeleteHandler = () => Promise<WorkspaceResponse<{ deleted: true }>>;

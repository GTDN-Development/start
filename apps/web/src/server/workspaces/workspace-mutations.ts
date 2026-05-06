import {
  createWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  updateWorkspaceGeneral,
  type CreateWorkspaceInput,
  type UpdateWorkspaceGeneralInput,
} from "@/server/workspaces/workspace-general-mutations";
import {
  createInvite,
  resendInvite,
  revokeInvite,
  type CreateWorkspaceInviteInput,
} from "@/server/workspaces/workspace-invite-mutations";
import { changeMemberRole, removeMember } from "@/server/workspaces/workspace-member-mutations";

export type { CreateWorkspaceInput, UpdateWorkspaceGeneralInput, CreateWorkspaceInviteInput };

export const workspaceMutations = {
  createWorkspace,
  updateWorkspaceGeneral,
  deleteWorkspace,
  leaveWorkspace,
  changeMemberRole,
  removeMember,
  createInvite,
  resendInvite,
  revokeInvite,
};

import type { WorkspaceErrorCode } from "@/features/workspaces/workspace-types";
import type { AuthCookieMutations } from "@/server/auth/auth-cookies";

export type {
  PostAuthDestination,
  UserWorkspace,
  WorkspaceErrorCode,
  WorkspaceInviteAcceptResult,
  WorkspaceInviteInspectResult,
  WorkspaceInviteRole,
  WorkspaceInviteSummary,
  WorkspaceMemberRole,
  WorkspaceMemberSummary,
  WorkspaceResponse,
  WorkspaceSummary,
} from "@/features/workspaces/workspace-types";

export type ServerWorkspaceResponse<TData> =
  | {
      ok: true;
      data: TData;
      cookieMutations?: AuthCookieMutations;
    }
  | {
      ok: false;
      errorCode: WorkspaceErrorCode;
      cookieMutations?: AuthCookieMutations;
    };

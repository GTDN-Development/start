import type {
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "@/types/pocketbase";

export type WorkspaceKind = WorkspacesRecord["kind"];
export type WorkspaceMemberRole = WorkspaceMembersRecord["role"];
export type WorkspaceInviteRole = WorkspaceInvitesRecord["role"];

export type WorkspaceErrorCode =
  | "BAD_REQUEST"
  | "SLUG_NOT_AVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "PERSONAL_WORKSPACE_RESTRICTED"
  | "LAST_OWNER_GUARD"
  | "INVITE_INVALID_OR_EXPIRED"
  | "INVITE_EMAIL_MISMATCH"
  | "UNKNOWN_ERROR";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  kind: WorkspaceKind;
  avatarUrl: string | null;
};

export type UserWorkspace = WorkspaceSummary & {
  membershipId: string;
  role: WorkspaceMemberRole;
};

export type WorkspaceMemberSummary = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: WorkspaceMemberRole;
};

export type WorkspaceInviteSummary = {
  id: string;
  emailNormalized: string;
  role: WorkspaceInviteRole;
  expiresAt: string;
  updatedAt: string;
  invitedByName: string | null;
};

export type WorkspaceInviteAcceptResult =
  | {
      state: "accepted";
      workspace: WorkspaceSummary;
    }
  | {
      state: "already_member";
      workspace: WorkspaceSummary;
    }
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "email_mismatch";
      invitedEmail: string;
      currentEmail: string;
    };

export type PendingInviteConsumeResult =
  | {
      state: "none";
    }
  | WorkspaceInviteAcceptResult;

export type ServerWorkspaceResponse<TData> =
  | {
      ok: true;
      data: TData;
      setCookie?: string[];
    }
  | {
      ok: false;
      errorCode: WorkspaceErrorCode;
      setCookie?: string[];
    };

export type WorkspaceResponse<TData> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      errorCode: WorkspaceErrorCode;
    };

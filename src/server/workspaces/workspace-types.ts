import type { WorkspaceInvitesRecord, WorkspaceMembersRecord } from "@/types/pocketbase";

export type WorkspaceMemberRole = WorkspaceMembersRecord["role"];
export type WorkspaceInviteRole = WorkspaceInvitesRecord["role"];

export type WorkspaceErrorCode =
  | "BAD_REQUEST"
  | "SLUG_NOT_AVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "LAST_OWNER_GUARD"
  | "INVITE_INVALID_OR_EXPIRED"
  | "INVITE_EMAIL_MISMATCH"
  | "UNKNOWN_ERROR";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
  memberCount: number;
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
  inviteUrl: string | null;
};

export type WorkspaceInviteInspectResult =
  | {
      state: "pending";
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

export type PostAuthDestination =
  | {
      state: "app";
    }
  | {
      state: "workspace_redirect";
      workspaceSlug: string;
    }
  | {
      state: "email_mismatch";
      invitedEmail: string;
      currentEmail: string;
    }
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "error";
    };

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

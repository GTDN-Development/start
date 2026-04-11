import type {
  WorkspaceInvitableRole,
  WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";

export type { WorkspaceMemberRole };
export type WorkspaceInviteRole = WorkspaceInvitableRole;

export type WorkspaceErrorCode =
  | "BAD_REQUEST"
  | "SLUG_NOT_AVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "LAST_OWNER_GUARD"
  | "INVITE_INVALID_OR_EXPIRED"
  | "UNKNOWN_ERROR";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
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
    };

export type PostAuthDestination =
  | {
      state: "app";
    }
  | {
      state: "workspace_redirect";
      workspaceSlug: string;
    }
  | {
      state: "invite_redirect";
      inviteToken: string;
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

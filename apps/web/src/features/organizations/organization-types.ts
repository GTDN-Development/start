import type {
  OrganizationInvitableRole,
  OrganizationMemberRole,
} from "@/features/organizations/organization-role-rules";

export type { OrganizationMemberRole };
export type OrganizationInviteRole = OrganizationInvitableRole;

export type OrganizationErrorCode =
  | "BAD_REQUEST"
  | "SLUG_NOT_AVAILABLE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "LAST_OWNER_GUARD"
  | "INVITE_INVALID_OR_EXPIRED"
  | "UNKNOWN_ERROR";

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
};

export type UserOrganization = OrganizationSummary & {
  membershipId: string;
  role: OrganizationMemberRole;
};

export type OrganizationMemberSummary = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: OrganizationMemberRole;
};

export type OrganizationInviteSummary = {
  id: string;
  emailNormalized: string;
  role: OrganizationInviteRole;
  expiresAt: string;
  updatedAt: string;
  invitedByName: string | null;
};

export type OrganizationInviteInspectResult =
  | {
      state: "pending";
      organization: OrganizationSummary;
    }
  | {
      state: "already_member";
      organization: OrganizationSummary;
    }
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "email_mismatch";
    };

export type OrganizationInviteAcceptResult =
  | {
      state: "accepted";
      organization: OrganizationSummary;
    }
  | {
      state: "already_member";
      organization: OrganizationSummary;
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
      state: "organization_redirect";
      organizationSlug: string;
    }
  | {
      state: "invite_redirect";
      inviteToken: string;
    };

export type OrganizationResponse<TData> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      errorCode: OrganizationErrorCode;
    };

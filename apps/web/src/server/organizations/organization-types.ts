import type { OrganizationErrorCode } from "@/features/organizations/organization-types";
import type { AuthCookieMutations } from "@/server/auth/auth-cookies";

export type {
  PostAuthDestination,
  UserOrganization,
  OrganizationErrorCode,
  OrganizationInviteAcceptResult,
  OrganizationInviteInspectResult,
  OrganizationInviteRole,
  OrganizationInviteSummary,
  OrganizationMemberRole,
  OrganizationMemberSummary,
  OrganizationResponse,
  OrganizationSummary,
} from "@/features/organizations/organization-types";

export type ServerOrganizationResponse<TData> =
  | {
      ok: true;
      data: TData;
      cookieMutations?: AuthCookieMutations;
    }
  | {
      ok: false;
      errorCode: OrganizationErrorCode;
      cookieMutations?: AuthCookieMutations;
    };

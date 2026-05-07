import {
  clearActiveOrganizationSlugCookie,
  clearPendingInviteTokenCookie,
} from "@/server/organizations/organization-cookie";

export async function clearSessionScopedApplicationState(): Promise<void> {
  await clearActiveOrganizationSlugCookie();
  await clearPendingInviteTokenCookie();
}

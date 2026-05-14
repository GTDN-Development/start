import { organizationConfig } from "@/config/organization";
import { getPendingInviteTokenCookie } from "@/server/organizations/organization-cookie";
import { resolveActiveOrganizationSlug } from "@/server/organizations/organization-navigation-queries";
import type {
  PostAuthDestination,
  ServerOrganizationResponse,
} from "@/server/organizations/organization-types";

export async function resolvePostAuthDestination({
  userId,
}: {
  userId: string;
}): Promise<ServerOrganizationResponse<PostAuthDestination>> {
  if (!organizationConfig.enabled) {
    return {
      ok: true,
      data: {
        state: "app",
      },
    };
  }

  const pendingInviteToken = await getPendingInviteTokenCookie();

  if (pendingInviteToken) {
    return {
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: pendingInviteToken,
      },
    };
  }

  const activeOrganizationResponse = await resolveActiveOrganizationSlug(userId);

  if (!activeOrganizationResponse.ok) {
    return activeOrganizationResponse;
  }

  if (activeOrganizationResponse.data.organizationSlug) {
    return {
      ok: true,
      data: {
        state: "organization_redirect",
        organizationSlug: activeOrganizationResponse.data.organizationSlug,
      },
    };
  }

  return {
    ok: true,
    data: {
      state: "app",
    },
  };
}

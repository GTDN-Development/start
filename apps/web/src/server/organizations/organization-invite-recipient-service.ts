import {
  createPocketBaseClient,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import { createOrganizationErrorResponse } from "@/server/organizations/organization-errors";
import type {
  ServerOrganizationResponse,
  OrganizationInviteAcceptResult,
  OrganizationInviteInspectResult,
} from "@/server/organizations/organization-types";

type PocketBaseGuestInviteInspectResult = {
  state: "invalid_or_expired" | "valid_guest";
};

export async function validateInviteToken(
  inviteToken: string
): Promise<ServerOrganizationResponse<{ isValid: boolean }>> {
  try {
    const pb = createPocketBaseClient();
    const result = await pb.send<PocketBaseGuestInviteInspectResult>(
      "/api/start/organization-invites/inspect",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        isValid: result.state === "valid_guest",
      },
    };
  } catch (error) {
    return mapInviteRecipientError("validateInviteToken", error);
  }
}

export async function getInviteTokenForUser(
  inviteToken: string
): Promise<ServerOrganizationResponse<{ result: OrganizationInviteInspectResult }>> {
  try {
    const { pb } = await createPocketBaseServerClient();
    const result = await pb.send<OrganizationInviteInspectResult>(
      "/api/start/organization-invites/inspect",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return mapInviteRecipientError("getInviteTokenForUser", error);
  }
}

export async function acceptInviteTokenForUser(
  inviteToken: string
): Promise<ServerOrganizationResponse<{ result: OrganizationInviteAcceptResult }>> {
  try {
    const { pb } = await createPocketBaseServerClient();
    const result = await pb.send<OrganizationInviteAcceptResult>(
      "/api/start/organization-invites/accept",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return mapInviteRecipientError("acceptInviteTokenForUser", error);
  }
}

function mapInviteRecipientError<TData>(
  context: string,
  error: unknown
): ServerOrganizationResponse<TData> {
  return createOrganizationErrorResponse(context, error, {
    400: "INVITE_INVALID_OR_EXPIRED",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "INVITE_INVALID_OR_EXPIRED",
  });
}

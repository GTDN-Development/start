import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInvite,
  resendInvite,
  revokeInvite,
} from "@/server/organizations/organization-invite-mutations";

const mocks = vi.hoisted(function createMocks() {
  return {
    requireCurrentWritableUser: vi.fn(),
    pbSend: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    requireCurrentWritableUser: mocks.requireCurrentWritableUser,
  };
});

describe("organization-invite-mutations", function describeOrganizationInviteMutations() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    process.env.START_INTERNAL_API_SECRET = "test-internal-secret";
    mocks.requireCurrentWritableUser.mockResolvedValue({
      ok: true,
      user: {
        id: "user_1",
      },
      pb: {
        send: mocks.pbSend,
      },
    });
  });

  it("delegates invite creation to the PocketBase endpoint with the internal header", async function testCreateInviteDelegation() {
    const invite = {
      id: "invite_1",
      emailNormalized: "new-user@example.com",
      role: "member",
      expiresAt: "2026-06-01T12:00:00.000Z",
      updatedAt: "2026-05-28T12:00:00.000Z",
      invitedByName: "Owner",
    };

    mocks.pbSend.mockResolvedValue({
      invite,
    });

    const response = await createInvite("acme", {
      locale: "cs",
      email: "New-User@Example.com",
      role: "member",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        invite,
      },
    });
    expect(mocks.pbSend).toHaveBeenCalledWith("/api/start/organization-invites/create", {
      method: "POST",
      body: {
        organizationSlug: "acme",
        email: "New-User@Example.com",
        role: "member",
      },
      headers: {
        "X-Start-Internal-Token": "test-internal-secret",
      },
    });
  });

  it("maps expired resend responses to the current UI error code", async function testExpiredResendMapping() {
    mocks.pbSend.mockRejectedValue(
      createClientResponseError(400, "Organization invite is invalid or expired.")
    );

    const response = await resendInvite("acme", "invite_1", "cs");

    expect(response).toEqual({
      ok: false,
      errorCode: "INVITE_INVALID_OR_EXPIRED",
    });
  });

  it("keeps PocketBase rate limits mapped as rate limited", async function testRateLimitMapping() {
    mocks.pbSend.mockRejectedValue(createClientResponseError(429, "Too Many Requests."));

    const response = await resendInvite("acme", "invite_1", "cs");

    expect(response).toEqual({
      ok: false,
      errorCode: "RATE_LIMITED",
    });
  });

  it("passes revoke requests through PocketBase without sending local mail", async function testRevokeDelegation() {
    mocks.pbSend.mockResolvedValue({
      revoked: true,
    });

    const response = await revokeInvite("acme", "invite_1");

    expect(response).toEqual({
      ok: true,
      data: {
        revoked: true,
      },
    });
    expect(mocks.pbSend).toHaveBeenCalledWith("/api/start/organization-invites/revoke", {
      method: "POST",
      body: {
        organizationSlug: "acme",
        inviteId: "invite_1",
      },
      headers: {
        "X-Start-Internal-Token": "test-internal-secret",
      },
    });
  });
});

function createClientResponseError(status: number, message: string) {
  return new ClientResponseError({
    message,
    response: {
      message,
    },
    status,
    url: "http://localhost:8090/api/start/organization-invites/resend",
  });
}

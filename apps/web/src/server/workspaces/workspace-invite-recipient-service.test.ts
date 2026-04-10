import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "@/types/pocketbase";

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseClient: vi.fn(),
    createPocketBaseServerClient: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    countWorkspaceMembers: vi.fn(),
    ensureWorkspaceMembership: vi.fn(),
    findInviteByHash: vi.fn(),
    findWorkspaceById: vi.fn(),
    findWorkspaceMembershipByWorkspaceAndUser: vi.fn(),
    safeDeleteInvite: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-mappers", function mockWorkspaceMappers() {
  return {
    mapWorkspaceSummary: vi.fn(function mapWorkspaceSummary(
      _pb: PocketBase,
      workspace: WorkspacesRecord,
      memberCount: number
    ) {
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        avatarUrl: null,
        memberCount,
      };
    }),
  };
});

vi.mock("@/server/workspaces/workspace-errors", async function mockWorkspaceErrors() {
  const actual = await vi.importActual<typeof import("./workspace-errors")>(
    "@/server/workspaces/workspace-errors"
  );

  return {
    ...actual,
    logWorkspaceServiceError: vi.fn(),
  };
});

import {
  createPocketBaseClient,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import {
  countWorkspaceMembers,
  ensureWorkspaceMembership,
  findInviteByHash,
  findWorkspaceById,
  findWorkspaceMembershipByWorkspaceAndUser,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import {
  acceptInviteTokenForUser,
  getInviteTokenForUser,
  validateInviteToken,
} from "./workspace-invite-recipient-service";

describe("workspace-invite-recipient-service", function describeWorkspaceInviteRecipientService() {
  let guestSendSpy: ReturnType<typeof vi.fn>;

  beforeEach(function resetMocks() {
    vi.clearAllMocks();

    guestSendSpy = vi.fn();
    const guestPb = {
      send: guestSendSpy,
    } as unknown as PocketBase;
    const authPb = {} as PocketBase;

    vi.mocked(createPocketBaseClient).mockReturnValue(guestPb);
    vi.mocked(createPocketBaseServerClient).mockResolvedValue({
      pb: authPb,
      hasAuthCookie: true,
      hadInvalidAuthCookie: false,
      shouldPersistSession: true,
    });
  });

  it("validates a guest invite token through the guest inspect hook", async function testValidGuest() {
    guestSendSpy.mockResolvedValue({
      state: "valid_guest",
    });

    const response = await validateInviteToken("invite-token");

    expect(response).toEqual({
      ok: true,
      data: {
        isValid: true,
      },
    });
  });

  it("returns invalid for an unavailable guest invite token", async function testInvalidGuest() {
    guestSendSpy.mockResolvedValue({
      state: "invalid_or_expired",
    });

    const response = await validateInviteToken("invite-token");

    expect(response).toEqual({
      ok: true,
      data: {
        isValid: false,
      },
    });
  });

  it("returns an error when guest inspect fails unexpectedly", async function testGuestInspectError() {
    guestSendSpy.mockRejectedValue(createClientResponseError(500));

    const response = await validateInviteToken("invite-token");

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
  });

  it("returns pending when the authenticated user can read the invite directly", async function testPendingInspect() {
    vi.mocked(findInviteByHash).mockResolvedValue(
      createInviteRecord({
        email: "invitee@example.com",
      })
    );
    vi.mocked(findWorkspaceById).mockResolvedValue(createWorkspaceRecord());
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(null);

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "pending",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 0,
          },
        },
      },
    });
    expect(guestSendSpy).not.toHaveBeenCalled();
  });

  it("returns already_member when the authenticated user already belongs to the workspace", async function testAlreadyMemberInspect() {
    vi.mocked(findInviteByHash).mockResolvedValue(
      createInviteRecord({
        email: "invitee@example.com",
      })
    );
    vi.mocked(findWorkspaceById).mockResolvedValue(createWorkspaceRecord());
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(
      createMembershipRecord("membership-1", "user-1")
    );
    vi.mocked(countWorkspaceMembers).mockResolvedValue(3);

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "already_member",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 3,
          },
        },
      },
    });
  });

  it("maps direct-read miss plus valid guest inspect to email mismatch", async function testEmailMismatchFallback() {
    vi.mocked(findInviteByHash).mockResolvedValue(null);
    guestSendSpy.mockResolvedValue({
      state: "valid_guest",
    });

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-2",
      email: "wrong@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "email_mismatch",
        },
      },
    });
  });

  it("maps direct-read miss plus invalid guest inspect to invalid_or_expired", async function testInvalidFallback() {
    vi.mocked(findInviteByHash).mockResolvedValue(null);
    guestSendSpy.mockResolvedValue({
      state: "invalid_or_expired",
    });

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-2",
      email: "wrong@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "invalid_or_expired",
        },
      },
    });
  });

  it("does not fallback when direct invite read fails unexpectedly", async function testUnexpectedDirectReadError() {
    vi.mocked(findInviteByHash).mockRejectedValue(createClientResponseError(500));

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
    expect(guestSendSpy).not.toHaveBeenCalled();
  });

  it("cleans up expired invites without guest fallback", async function testExpiredInviteCleanup() {
    const inviteRecord = createInviteRecord({
      email: "invitee@example.com",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });
    vi.mocked(findInviteByHash).mockResolvedValue(inviteRecord);

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "invalid_or_expired",
        },
      },
    });
    expect(safeDeleteInvite).toHaveBeenCalledWith(expect.anything(), inviteRecord.id);
    expect(guestSendSpy).not.toHaveBeenCalled();
  });

  it("cleans up invites with missing workspace without guest fallback", async function testMissingWorkspaceCleanup() {
    const inviteRecord = createInviteRecord({
      email: "invitee@example.com",
    });
    vi.mocked(findInviteByHash).mockResolvedValue(inviteRecord);
    vi.mocked(findWorkspaceById).mockResolvedValue(null);

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "invalid_or_expired",
        },
      },
    });
    expect(safeDeleteInvite).toHaveBeenCalledWith(expect.anything(), inviteRecord.id);
    expect(guestSendSpy).not.toHaveBeenCalled();
  });

  it("accepts a valid invite and deletes it afterwards", async function testAcceptInvite() {
    const inviteRecord = createInviteRecord({
      email: "invitee@example.com",
      role: "member",
    });
    vi.mocked(findInviteByHash).mockResolvedValue(inviteRecord);
    vi.mocked(findWorkspaceById).mockResolvedValue(createWorkspaceRecord());
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(null);
    vi.mocked(ensureWorkspaceMembership).mockResolvedValue(
      createMembershipRecord("membership-1", "user-1")
    );
    vi.mocked(countWorkspaceMembers).mockResolvedValue(2);

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "accepted",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 2,
          },
        },
      },
    });
    expect(ensureWorkspaceMembership).toHaveBeenCalledWith(
      expect.anything(),
      "workspace-1",
      "user-1",
      "member"
    );
    expect(safeDeleteInvite).toHaveBeenCalledWith(expect.anything(), inviteRecord.id);
  });

  it("returns already_member and cleans up the invite", async function testAlreadyMemberAccept() {
    const inviteRecord = createInviteRecord({
      email: "invitee@example.com",
    });
    vi.mocked(findInviteByHash).mockResolvedValue(inviteRecord);
    vi.mocked(findWorkspaceById).mockResolvedValue(createWorkspaceRecord());
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(
      createMembershipRecord("membership-1", "user-1")
    );
    vi.mocked(countWorkspaceMembers).mockResolvedValue(3);

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "already_member",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 3,
          },
        },
      },
    });
    expect(ensureWorkspaceMembership).not.toHaveBeenCalled();
    expect(safeDeleteInvite).toHaveBeenCalledWith(expect.anything(), inviteRecord.id);
  });

  it("returns email_mismatch during accept when the direct invite read misses but guest inspect stays valid", async function testAcceptMismatch() {
    vi.mocked(findInviteByHash).mockResolvedValue(null);
    guestSendSpy.mockResolvedValue({
      state: "valid_guest",
    });

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-2",
      email: "wrong@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "email_mismatch",
        },
      },
    });
  });

  it("returns invalid_or_expired during accept when the invite is unavailable", async function testAcceptInvalid() {
    vi.mocked(findInviteByHash).mockResolvedValue(null);
    guestSendSpy.mockResolvedValue({
      state: "invalid_or_expired",
    });

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-2",
      email: "wrong@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        result: {
          state: "invalid_or_expired",
        },
      },
    });
  });

  it("returns an error during accept when the backend fails unexpectedly", async function testAcceptError() {
    vi.mocked(findInviteByHash).mockRejectedValue(createClientResponseError(500));

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
    expect(guestSendSpy).not.toHaveBeenCalled();
  });
});

function createClientResponseError(status: number) {
  const error = new ClientResponseError({
    url: "https://example.com/api/error",
    status,
    response: {},
  });
  error.status = status;
  return error;
}

function createWorkspaceRecord(): WorkspacesRecord {
  return {
    id: "workspace-1",
    collectionId: "workspaces",
    collectionName: "workspaces",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    name: "Team Space",
    slug: "team-space",
    kind: "organization",
    created_by: "user-1",
  };
}

function createInviteRecord(options: {
  email: string;
  expiresAt?: string;
  role?: WorkspaceInvitesRecord["role"];
}): WorkspaceInvitesRecord {
  return {
    id: "invite-1",
    collectionId: "workspace_invites",
    collectionName: "workspace_invites",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    workspace: "workspace-1",
    email_normalized: options.email,
    role: options.role ?? "member",
    token_hash: "token-hash",
    invited_by: "user-owner",
    expires_at: options.expiresAt ?? "2099-01-01T00:00:00.000Z",
  };
}

function createMembershipRecord(
  id: string,
  userId: string,
  role: WorkspaceMembersRecord["role"] = "member"
): WorkspaceMembersRecord {
  return {
    id,
    collectionId: "workspace_members",
    collectionName: "workspace_members",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    workspace: "workspace-1",
    user: userId,
    role,
  };
}

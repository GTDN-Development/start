import PocketBase from "pocketbase";
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
      workspace: WorkspacesRecord
    ) {
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        avatarUrl: null,
      };
    }),
  };
});

import {
  createPocketBaseClient,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import {
  ensureWorkspaceMembership,
  findInviteByHash,
  findWorkspaceById,
  findWorkspaceMembershipByWorkspaceAndUser,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import {
  acceptInviteTokenForUser,
  getInviteTokenForUser,
} from "./workspace-invite-recipient-service";

describe("workspace-invite-recipient-service", function describeWorkspaceInviteRecipientService() {
  let guestSendSpy: ReturnType<typeof vi.fn>;

  beforeEach(function resetMocks() {
    vi.clearAllMocks();

    guestSendSpy = vi.fn();
    vi.mocked(createPocketBaseClient).mockReturnValue({
      send: guestSendSpy,
    } as unknown as PocketBase);
    vi.mocked(createPocketBaseServerClient).mockResolvedValue({
      authCookieState: "present",
      pb: {} as PocketBase,
      shouldPersistSession: true,
    });
  });

  it.each([
    {
      name: "returns pending when the authenticated user can read the invite directly",
      setup: function setup() {
        vi.mocked(findInviteByHash).mockResolvedValue(
          createInviteRecord({
            email: "invitee@example.com",
          })
        );
        vi.mocked(findWorkspaceById).mockResolvedValue(createWorkspaceRecord());
        vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(null);
      },
      expectedState: "pending" as const,
    },
    {
      name: "maps direct-read miss plus valid guest inspect to email_mismatch",
      setup: function setup() {
        vi.mocked(findInviteByHash).mockResolvedValue(null);
        guestSendSpy.mockResolvedValue({
          state: "valid_guest",
        });
      },
      expectedState: "email_mismatch" as const,
    },
    {
      name: "cleans up expired invites without guest fallback",
      setup: function setup() {
        vi.mocked(findInviteByHash).mockResolvedValue(
          createInviteRecord({
            email: "invitee@example.com",
            expiresAt: "2020-01-01T00:00:00.000Z",
          })
        );
      },
      expectedState: "invalid_or_expired" as const,
      shouldDeleteInvite: true,
    },
  ])("$name", async function testGetInviteTokenForUser(input) {
    input.setup();

    const response = await getInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expectInviteResult(response, input.expectedState);
    expect(safeDeleteInvite).toHaveBeenCalledTimes(input.shouldDeleteInvite ? 1 : 0);
  });

  it.each([
    {
      name: "accepts a valid invite and deletes it afterwards",
      setup: function setup() {
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
      },
      expectedState: "accepted" as const,
      shouldEnsureMembership: true,
      shouldDeleteInvite: true,
    },
    {
      name: "returns email_mismatch when the direct invite read misses but guest inspect stays valid",
      setup: function setup() {
        vi.mocked(findInviteByHash).mockResolvedValue(null);
        guestSendSpy.mockResolvedValue({
          state: "valid_guest",
        });
      },
      expectedState: "email_mismatch" as const,
    },
  ])("$name", async function testAcceptInviteTokenForUser(input) {
    input.setup();

    const response = await acceptInviteTokenForUser("invite-token", {
      id: "user-1",
      email: "invitee@example.com",
    });

    expectInviteResult(response, input.expectedState);
    expect(ensureWorkspaceMembership).toHaveBeenCalledTimes(input.shouldEnsureMembership ? 1 : 0);
    expect(safeDeleteInvite).toHaveBeenCalledTimes(input.shouldDeleteInvite ? 1 : 0);
  });
});

function expectInviteResult(
  response: unknown,
  expectedState: "accepted" | "email_mismatch" | "invalid_or_expired" | "pending"
) {
  expect(response).toEqual({
    ok: true,
    data: {
      result: {
        state: expectedState,
        ...(expectedState === "accepted" || expectedState === "pending"
          ? {
              workspace: createWorkspaceSummary(),
            }
          : {}),
      },
    },
  });
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

function createWorkspaceSummary() {
  return {
    id: "workspace-1",
    name: "Team Space",
    slug: "team-space",
    avatarUrl: null,
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

function createMembershipRecord(id: string, userId: string): WorkspaceMembersRecord {
  return {
    id,
    collectionId: "workspace_members",
    collectionName: "workspace_members",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    workspace: "workspace-1",
    user: userId,
    role: "member",
  };
}

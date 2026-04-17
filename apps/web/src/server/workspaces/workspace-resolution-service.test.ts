import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";

vi.mock("@/server/auth/current-user", function mockCurrentUser() {
  return {
    requireCurrentUser: vi.fn(),
    requireCurrentWritableUser: vi.fn(),
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseServerClient: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    getActiveWorkspaceSlugCookie: vi.fn(),
    getPendingInviteTokenCookie: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    findWorkspaceBySlug: vi.fn(),
    findWorkspaceMembershipByWorkspaceAndUser: vi.fn(),
    listUserWorkspaceMembershipRecords: vi.fn(),
  };
});

import { requireCurrentUser, requireCurrentWritableUser } from "@/server/auth/current-user";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  getActiveWorkspaceSlugCookie,
  getPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
} from "@/server/workspaces/workspace-repository";
import {
  requireWorkspaceActionMembershipContext,
  requireWorkspaceMembershipContext,
  resolveCurrentUserWorkspaceRouteAccess,
  resolvePostAuthDestinationForUser,
} from "./workspace-resolution-service";

describe("workspace-resolution-service", function describeWorkspaceResolutionService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("prioritizes a pending invite over active workspace resolution", async function testInvitePriority() {
    vi.mocked(getPendingInviteTokenCookie).mockResolvedValue("invite-token");

    const response = await resolvePostAuthDestinationForUser({
      userId: "user-1",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: "invite-token",
      },
    });
    expect(createPocketBaseServerClient).not.toHaveBeenCalled();
  });

  it("falls back to app when the active workspace cookie is stale", async function testStaleActiveWorkspaceFallback() {
    const pb = createPocketBaseMock();
    const workspace = createWorkspaceRecord("team-space");

    vi.mocked(getPendingInviteTokenCookie).mockResolvedValue(null);
    vi.mocked(createPocketBaseServerClient).mockResolvedValue({
      authCookieState: "present",
      pb,
      shouldPersistSession: true,
    });
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("team-space");
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(workspace);
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(null);

    const response = await resolvePostAuthDestinationForUser({
      userId: "user-1",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        state: "app",
      },
    });
  });

  it("keeps auth cleanup cookies on action auth failures", async function testActionAuthFailure() {
    vi.mocked(requireCurrentWritableUser).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });

    const response = await requireWorkspaceActionMembershipContext("team-space");

    expect(response).toEqual({
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: ["pb_auth=; Max-Age=0"],
      },
    });
  });

  it.each([
    {
      name: "maps a missing workspace to NOT_FOUND",
      membership: undefined,
      expectedErrorCode: "NOT_FOUND",
    },
    {
      name: "maps a missing membership to FORBIDDEN",
      membership: null,
      expectedErrorCode: "FORBIDDEN",
    },
  ])("$name", async function testWorkspaceAccessErrors(input) {
    const pb = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");
    const workspace = createWorkspaceRecord("team-space");

    vi.mocked(requireCurrentUser).mockResolvedValue({
      ok: true,
      pb,
      user,
      currentSessionIdHash: "session-hash",
    });
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(
      input.membership === undefined ? null : workspace
    );
    if (input.membership !== undefined) {
      vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(input.membership);
    }

    const response = await requireWorkspaceMembershipContext("team-space");

    expect(response).toEqual({
      ok: false,
      response: {
        ok: false,
        errorCode: input.expectedErrorCode,
      },
    });
  });

  it("returns the route access payload with the mapped workspace summary", async function testRouteAccessPayload() {
    const pb = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");
    const workspace = createWorkspaceRecord("team-space");
    const membership = createWorkspaceMemberRecord("membership-1", user.id, "owner");

    vi.mocked(requireCurrentUser).mockResolvedValue({
      ok: true,
      pb,
      user,
      currentSessionIdHash: "session-hash",
    });
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(workspace);
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(membership);

    const response = await resolveCurrentUserWorkspaceRouteAccess("team-space");

    expect(response).toEqual(
      expect.objectContaining({
        ok: true,
        data: {
          pb,
          user,
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            membershipId: membership.id,
            role: "owner",
          },
        },
      })
    );
  });
});

function createPocketBaseMock(): PocketBase {
  return {
    collection: vi.fn(),
    files: {
      getURL: vi.fn(),
    },
  } as unknown as PocketBase;
}

function createUserRecord(id: string, email: string): UsersRecord {
  return {
    id,
    collectionId: "users",
    collectionName: "users",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    email,
    verified: true,
    name: "User",
  };
}

function createWorkspaceRecord(slug: string): WorkspacesRecord {
  return {
    id: "workspace-1",
    collectionId: "workspaces",
    collectionName: "workspaces",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    name: "Team Space",
    slug,
    kind: "organization",
  };
}

function createWorkspaceMemberRecord(
  id: string,
  userId: string,
  role: WorkspaceMembersRecord["role"]
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

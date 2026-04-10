import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseServerClient: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    getActiveWorkspaceSlugCookie: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    countWorkspaceMembers: vi.fn(),
    listUserWorkspaceMembershipRecords: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-mappers", function mockWorkspaceMappers() {
  return {
    mapUserWorkspaceSummary: vi.fn(),
    sortUserWorkspaces: vi.fn(),
  };
});

vi.mock(
  "@/server/workspaces/workspace-membership-context",
  function mockWorkspaceMembershipContext() {
    return {
      requireWorkspaceActionMembershipContext: vi.fn(),
      resolveWorkspaceMembershipContextBySlug: vi.fn(),
    };
  }
);

import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { resolveWorkspaceMembershipContextBySlug } from "@/server/workspaces/workspace-membership-context";
import { countWorkspaceMembers } from "@/server/workspaces/workspace-repository";
import {
  resolveActiveWorkspaceForUserWithClient,
  resolvePostAuthDestination,
} from "./workspace-resolution-service";

describe("workspace-resolution-service", function describeWorkspaceResolutionService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("prioritizes a pending invite over active workspace resolution", async function testInvitePriority() {
    const response = await resolvePostAuthDestination({
      userId: "user-1",
      userEmail: "user@example.com",
      pendingInviteToken: "invite-token",
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

  it("returns workspace redirect when the active workspace is still accessible", async function testWorkspaceRedirect() {
    const pb = createPocketBaseMock();
    const workspace = createWorkspaceRecord("team-space");
    const membership = createWorkspaceMemberRecord("membership-1", "user-1", "member");

    vi.mocked(createPocketBaseServerClient).mockResolvedValue({
      pb,
      hasAuthCookie: true,
      hadInvalidAuthCookie: false,
      shouldPersistSession: true,
    });
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("team-space");
    vi.mocked(resolveWorkspaceMembershipContextBySlug).mockResolvedValue({
      state: "ready",
      workspace,
      membership,
    });
    vi.mocked(countWorkspaceMembers).mockResolvedValue(3);
    vi.mocked(mapUserWorkspaceSummary).mockReturnValue({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      avatarUrl: null,
      memberCount: 3,
      membershipId: membership.id,
      role: membership.role,
    });

    const response = await resolvePostAuthDestination({
      userId: "user-1",
      userEmail: "user@example.com",
      pendingInviteToken: null,
    });

    expect(response).toEqual({
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: "team-space",
      },
    });
  });

  it("falls back to app when no active workspace is available", async function testAppFallback() {
    const pb = createPocketBaseMock();

    vi.mocked(createPocketBaseServerClient).mockResolvedValue({
      pb,
      hasAuthCookie: true,
      hadInvalidAuthCookie: false,
      shouldPersistSession: true,
    });
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(null);

    const response = await resolvePostAuthDestination({
      userId: "user-1",
      userEmail: "user@example.com",
      pendingInviteToken: null,
    });

    expect(response).toEqual({
      ok: true,
      data: {
        state: "app",
      },
    });
  });

  it("returns null when no active workspace cookie exists", async function testNoCookie() {
    const pb = createPocketBaseMock();

    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(null);

    const response = await resolveActiveWorkspaceForUserWithClient(pb, "user-1");

    expect(response).toEqual({
      ok: true,
      data: {
        workspace: null,
      },
    });
  });

  it("falls back without clearing stale active workspace cookies during render", async function testStaleCookie() {
    const pb = createPocketBaseMock();

    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("team-space");
    vi.mocked(resolveWorkspaceMembershipContextBySlug).mockResolvedValue({
      state: "membership_not_found",
    });

    const response = await resolveActiveWorkspaceForUserWithClient(pb, "user-1");

    expect(response).toEqual({
      ok: true,
      data: {
        workspace: null,
      },
    });
  });
});

function createPocketBaseMock(): PocketBase {
  return {
    collection: vi.fn(),
  } as unknown as PocketBase;
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

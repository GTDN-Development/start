import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";

vi.mock("@/server/workspaces/workspace-auth-context", function mockWorkspaceAuthContext() {
  return {
    requireWorkspaceActionContext: vi.fn(),
    requireWorkspaceAuthContext: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    findWorkspaceBySlug: vi.fn(),
    findWorkspaceMembershipByWorkspaceAndUser: vi.fn(),
  };
});

import {
  requireWorkspaceActionContext,
  requireWorkspaceAuthContext,
} from "@/server/workspaces/workspace-auth-context";
import {
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
} from "@/server/workspaces/workspace-repository";
import {
  requireWorkspaceActionMembershipContext,
  requireWorkspaceMembershipContext,
  resolveWorkspaceMembershipContextBySlug,
} from "./workspace-membership-context";

describe("workspace-membership-context", function describeWorkspaceMembershipContext() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("passes through auth failures without extra lookup work", async function testAuthFailure() {
    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue({
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
      },
    });

    const response = await requireWorkspaceMembershipContext("team-space");

    expect(response).toEqual({
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
      },
    });
    expect(findWorkspaceBySlug).not.toHaveBeenCalled();
  });

  it("preserves action set-cookie metadata on auth failure", async function testActionFailure() {
    vi.mocked(requireWorkspaceActionContext).mockResolvedValue({
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: ["pb_auth=; Max-Age=0"],
      },
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

  it("maps a missing workspace to not found", async function testWorkspaceNotFound() {
    const pb = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(null);

    const response = await requireWorkspaceMembershipContext("team-space");

    expect(response).toEqual({
      ok: false,
      response: {
        ok: false,
        errorCode: "NOT_FOUND",
      },
    });
  });

  it("maps a missing membership to forbidden", async function testMembershipMissing() {
    const pb = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");
    const workspace = createWorkspaceRecord("team-space");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(workspace);
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(null);

    const response = await requireWorkspaceMembershipContext("team-space");

    expect(response).toEqual({
      ok: false,
      response: {
        ok: false,
        errorCode: "FORBIDDEN",
      },
    });
  });

  it("returns the resolved workspace membership context on success", async function testSuccess() {
    const pb = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");
    const workspace = createWorkspaceRecord("team-space");
    const membership = createWorkspaceMemberRecord("membership-1", user.id, "owner");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(findWorkspaceBySlug).mockResolvedValue(workspace);
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(membership);

    const response = await requireWorkspaceMembershipContext("team-space");

    expect(response).toEqual({
      ok: true,
      context: {
        pb,
        user,
        workspace,
        membership,
      },
    });
  });

  it("returns workspace_not_found for direct lookup misses", async function testDirectLookupMiss() {
    const pb = createPocketBaseMock();

    vi.mocked(findWorkspaceBySlug).mockResolvedValue(null);

    const response = await resolveWorkspaceMembershipContextBySlug(pb, "user-1", "team-space");

    expect(response).toEqual({
      state: "workspace_not_found",
    });
  });

  it("returns the workspace and membership for direct lookup hits", async function testDirectLookupHit() {
    const pb = createPocketBaseMock();
    const workspace = createWorkspaceRecord("team-space");
    const membership = createWorkspaceMemberRecord("membership-1", "user-1", "member");

    vi.mocked(findWorkspaceBySlug).mockResolvedValue(workspace);
    vi.mocked(findWorkspaceMembershipByWorkspaceAndUser).mockResolvedValue(membership);

    const response = await resolveWorkspaceMembershipContextBySlug(pb, "user-1", "team-space");

    expect(response).toEqual({
      state: "ready",
      workspace,
      membership,
    });
  });
});

function createPocketBaseMock(): PocketBase {
  return {
    collection: vi.fn(),
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

function createWorkspaceAuthSuccess(pb: PocketBase, user: UsersRecord) {
  return {
    ok: true as const,
    context: {
      pb,
      user,
    },
  };
}

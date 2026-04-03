import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import {
  requireAdminWorkspaceAccessBySlug,
  requireWorkspaceAccess,
  type WorkspaceAccessContext,
} from "@/server/workspaces/workspace-access";
import {
  countWorkspaceOwners,
  findWorkspaceMemberById,
} from "@/server/workspaces/workspace-repository";
import {
  changeWorkspaceMemberRoleForCurrentUser,
  leaveWorkspaceForCurrentUser,
  removeWorkspaceMemberForCurrentUser,
} from "./workspace-members-service";

vi.mock("@/server/workspaces/workspace-auth-context", function mockWorkspaceAuthContext() {
  return {
    requireWorkspaceAuthContext: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-access", function mockWorkspaceAccess() {
  return {
    requireAdminWorkspaceAccessBySlug: vi.fn(),
    requireWorkspaceAccess: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    countWorkspaceOwners: vi.fn(),
    findWorkspaceMemberById: vi.fn(),
    listWorkspaceMemberRecordsByWorkspace: vi.fn(),
  };
});

describe("workspace-members-service", function describeWorkspaceMembersService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("allows a regular member to leave a workspace", async function testMemberLeave() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-member", "member@example.com");
    const membership = createWorkspaceMemberRecord("membership-member", user.id, "member");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireWorkspaceAccess).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, membership)
    );

    const response = await leaveWorkspaceForCurrentUser("team-space");

    expect(response).toEqual({
      ok: true,
      data: {
        left: true,
      },
    });
    expect(deleteSpy).toHaveBeenCalledWith(membership.id);
  });

  it("blocks the final owner from leaving", async function testLastOwnerLeaveGuard() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-owner", "owner@example.com");
    const membership = createWorkspaceMemberRecord("membership-owner", user.id, "owner");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireWorkspaceAccess).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, membership)
    );
    vi.mocked(countWorkspaceOwners).mockResolvedValue(1);

    const response = await leaveWorkspaceForCurrentUser("team-space");

    expect(response).toEqual({
      ok: false,
      errorCode: "LAST_OWNER_GUARD",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("prevents admins from changing an owner role", async function testAdminCannotChangeOwner() {
    const { pb, updateSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", "user-owner", "owner");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireAdminWorkspaceAccessBySlug).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);

    const response = await changeWorkspaceMemberRoleForCurrentUser(
      "team-space",
      ownerMembership.id,
      "member"
    );

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("prevents admins from assigning the owner role", async function testAdminCannotAssignOwner() {
    const { pb, updateSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
    const memberMembership = createWorkspaceMemberRecord(
      "membership-member",
      "user-member",
      "member"
    );

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireAdminWorkspaceAccessBySlug).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(memberMembership);

    const response = await changeWorkspaceMemberRoleForCurrentUser(
      "team-space",
      memberMembership.id,
      "owner"
    );

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("allows owners to promote another member to owner", async function testOwnerPromotion() {
    const { pb, updateSpy } = createPocketBaseMock();
    const user = createUserRecord("user-owner", "owner@example.com");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", user.id, "owner");
    const memberMembership = createWorkspaceMemberRecord(
      "membership-member",
      "user-member",
      "member"
    );

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireAdminWorkspaceAccessBySlug).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, ownerMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(memberMembership);

    const response = await changeWorkspaceMemberRoleForCurrentUser(
      "team-space",
      memberMembership.id,
      "owner"
    );

    expect(response).toEqual({
      ok: true,
      data: {
        updated: true,
      },
    });
    expect(updateSpy).toHaveBeenCalledWith(memberMembership.id, {
      role: "owner",
    });
  });

  it("blocks downgrading the final owner", async function testLastOwnerDowngradeGuard() {
    const { pb, updateSpy } = createPocketBaseMock();
    const user = createUserRecord("user-owner", "owner@example.com");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", user.id, "owner");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireAdminWorkspaceAccessBySlug).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, ownerMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);
    vi.mocked(countWorkspaceOwners).mockResolvedValue(1);

    const response = await changeWorkspaceMemberRoleForCurrentUser(
      "team-space",
      ownerMembership.id,
      "admin"
    );

    expect(response).toEqual({
      ok: false,
      errorCode: "LAST_OWNER_GUARD",
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("prevents admins from removing owners", async function testAdminCannotRemoveOwner() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", "user-owner", "owner");

    vi.mocked(requireWorkspaceAuthContext).mockResolvedValue(createWorkspaceAuthSuccess(pb, user));
    vi.mocked(requireAdminWorkspaceAccessBySlug).mockResolvedValue(
      createWorkspaceAccessSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);

    const response = await removeWorkspaceMemberForCurrentUser("team-space", ownerMembership.id);

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});

function createPocketBaseMock() {
  const deleteSpy = vi.fn(async function deleteRecord() {
    return undefined;
  });
  const updateSpy = vi.fn(async function updateRecord() {
    return undefined;
  });
  const collectionSpy = vi.fn(function getCollection() {
    return {
      delete: deleteSpy,
      update: updateSpy,
    };
  });

  return {
    pb: {
      collection: collectionSpy,
    } as unknown as PocketBase,
    deleteSpy,
    updateSpy,
  };
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

function createWorkspaceAccessSuccess(
  pb: PocketBase,
  user: UsersRecord,
  membership: WorkspaceMembersRecord
): {
  ok: true;
  context: WorkspaceAccessContext;
} {
  return {
    ok: true,
    context: {
      pb,
      user,
      workspace: createWorkspaceRecord(),
      membership,
    },
  };
}

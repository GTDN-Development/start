import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { requireWorkspaceActionMembershipContext } from "@/server/workspaces/workspace-membership-context";
import {
  countWorkspaceOwners,
  findWorkspaceMemberById,
  listWorkspaceMemberRecordsByWorkspace,
} from "@/server/workspaces/workspace-repository";
import {
  changeWorkspaceMemberRoleForCurrentUser,
  leaveWorkspaceForCurrentUser,
  listWorkspaceMembersWithClient,
  removeWorkspaceMemberForCurrentUser,
} from "./workspace-members-service";

vi.mock(
  "@/server/workspaces/workspace-membership-context",
  function mockWorkspaceMembershipContext() {
    return {
      requireWorkspaceActionMembershipContext: vi.fn(),
      requireWorkspaceMembershipContext: vi.fn(),
    };
  }
);

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

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, membership)
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

  it("maps and sorts members through the with-client list helper", async function testListWithClient() {
    const { pb } = createPocketBaseMock();

    vi.mocked(listWorkspaceMemberRecordsByWorkspace).mockResolvedValue([
      createWorkspaceMemberRecordWithUser(
        "membership-member",
        {
          ...createUserRecord("user-member", "member@example.com"),
          name: "Member Person",
        },
        "member"
      ),
      createWorkspaceMemberRecordWithUser(
        "membership-owner",
        {
          ...createUserRecord("user-owner", "owner@example.com"),
          name: "Owner Person",
        },
        "owner"
      ),
    ]);

    const response = await listWorkspaceMembersWithClient(pb, "workspace-1");

    expect(response).toEqual({
      ok: true,
      data: {
        members: [
          {
            id: "membership-owner",
            userId: "user-owner",
            email: "owner@example.com",
            name: "Owner Person",
            avatarUrl: null,
            role: "owner",
          },
          {
            id: "membership-member",
            userId: "user-member",
            email: "member@example.com",
            name: "Member Person",
            avatarUrl: null,
            role: "member",
          },
        ],
      },
    });
  });

  it("maps list failures in the with-client helper to not found", async function testListWithClientNotFound() {
    const { pb } = createPocketBaseMock();

    vi.mocked(listWorkspaceMemberRecordsByWorkspace).mockRejectedValue(createNotFoundError());

    const response = await listWorkspaceMembersWithClient(pb, "workspace-1");

    expect(response).toEqual({
      ok: false,
      errorCode: "NOT_FOUND",
    });
  });

  it("blocks the final owner from leaving", async function testLastOwnerLeaveGuard() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-owner", "owner@example.com");
    const membership = createWorkspaceMemberRecord("membership-owner", user.id, "owner");

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, membership)
    );
    vi.mocked(countWorkspaceOwners).mockResolvedValue(1);

    const response = await leaveWorkspaceForCurrentUser("team-space");

    expect(response).toEqual({
      ok: false,
      errorCode: "LAST_OWNER_GUARD",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("maps PocketBase role deny to forbidden when changing a role", async function testRoleDeny() {
    const { pb, updateSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", "user-owner", "owner");

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);
    vi.mocked(countWorkspaceOwners).mockResolvedValue(2);
    updateSpy.mockRejectedValue(createNotFoundError());

    const response = await changeWorkspaceMemberRoleForCurrentUser(
      "team-space",
      ownerMembership.id,
      "member"
    );

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(updateSpy).toHaveBeenCalledWith(ownerMembership.id, {
      role: "member",
    });
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

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, ownerMembership)
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

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, ownerMembership)
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

  it("blocks removing yourself from the member removal action", async function testRemoveSelfGuard() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(adminMembership);

    const response = await removeWorkspaceMemberForCurrentUser("team-space", adminMembership.id);

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("maps PocketBase owner-removal deny to forbidden", async function testOwnerRemoveDeny() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-admin", "admin@example.com");
    const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
    const ownerMembership = createWorkspaceMemberRecord("membership-owner", "user-owner", "owner");

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, adminMembership)
    );
    vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);
    vi.mocked(countWorkspaceOwners).mockResolvedValue(2);
    deleteSpy.mockRejectedValue(createNotFoundError());

    const response = await removeWorkspaceMemberForCurrentUser("team-space", ownerMembership.id);

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(deleteSpy).toHaveBeenCalledWith(ownerMembership.id);
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

function createNotFoundError() {
  const error = new ClientResponseError({
    url: "https://example.com/api/collections/workspace_members/records/member-1",
    status: 404,
    response: {},
  });
  error.status = 404;
  return error;
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

function createWorkspaceMembershipContextSuccess(
  pb: PocketBase,
  user: UsersRecord,
  membership: WorkspaceMembersRecord
) {
  return {
    ok: true as const,
    context: {
      pb,
      user,
      workspace: createWorkspaceRecord(),
      membership,
    },
  };
}

function createWorkspaceMemberRecordWithUser(
  id: string,
  user: UsersRecord,
  role: WorkspaceMembersRecord["role"]
) {
  return {
    ...createWorkspaceMemberRecord(id, user.id, role),
    expand: {
      user,
    },
  };
}

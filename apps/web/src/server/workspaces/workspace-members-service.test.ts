import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import {
  countWorkspaceOwners,
  findWorkspaceMemberById,
} from "@/server/workspaces/workspace-repository";
import { requireWorkspaceActionMembershipContext } from "@/server/workspaces/workspace-resolution-service";
import {
  changeWorkspaceMemberRoleForCurrentUser,
  leaveWorkspaceForCurrentUser,
  removeWorkspaceMemberForCurrentUser,
} from "./workspace-members-service";

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
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
  };
});

describe("workspace-members-service", function describeWorkspaceMembersService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it.each([
    {
      name: "allows a regular member to leave a workspace",
      ownerCount: null,
      expectedResponse: {
        ok: true as const,
        data: {
          left: true as const,
        },
      },
      shouldDelete: true,
    },
    {
      name: "blocks the final owner from leaving",
      ownerCount: 1,
      expectedResponse: {
        ok: false as const,
        errorCode: "LAST_OWNER_GUARD" as const,
      },
      shouldDelete: false,
    },
  ])("$name", async function testLeaveWorkspace(input) {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-member", "member@example.com");
    const membership = createWorkspaceMemberRecord(
      "membership-member",
      user.id,
      input.ownerCount === null ? "member" : "owner"
    );

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
      createWorkspaceMembershipContextSuccess(pb, user, membership)
    );

    if (input.ownerCount !== null) {
      vi.mocked(countWorkspaceOwners).mockResolvedValue(input.ownerCount);
    }

    const response = await leaveWorkspaceForCurrentUser("team-space");

    expect(response).toEqual(input.expectedResponse);
    expect(deleteSpy).toHaveBeenCalledTimes(input.shouldDelete ? 1 : 0);
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

  it.each([
    {
      name: "blocks downgrading the final owner",
      mutation: function mutation() {
        const { pb, updateSpy } = createPocketBaseMock();
        const user = createUserRecord("user-owner", "owner@example.com");
        const ownerMembership = createWorkspaceMemberRecord("membership-owner", user.id, "owner");

        vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
          createWorkspaceMembershipContextSuccess(pb, user, ownerMembership)
        );
        vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);
        vi.mocked(countWorkspaceOwners).mockResolvedValue(1);

        return {
          response: changeWorkspaceMemberRoleForCurrentUser(
            "team-space",
            ownerMembership.id,
            "admin"
          ),
          writeSpy: updateSpy,
        };
      },
      expectedResponse: {
        ok: false as const,
        errorCode: "LAST_OWNER_GUARD" as const,
      },
      shouldWrite: false,
    },
    {
      name: "blocks removing yourself from the member removal action",
      mutation: function mutation() {
        const { pb, deleteSpy } = createPocketBaseMock();
        const user = createUserRecord("user-admin", "admin@example.com");
        const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");

        vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
          createWorkspaceMembershipContextSuccess(pb, user, adminMembership)
        );
        vi.mocked(findWorkspaceMemberById).mockResolvedValue(adminMembership);

        return {
          response: removeWorkspaceMemberForCurrentUser("team-space", adminMembership.id),
          writeSpy: deleteSpy,
        };
      },
      expectedResponse: {
        ok: false as const,
        errorCode: "FORBIDDEN" as const,
      },
      shouldWrite: false,
    },
    {
      name: "maps PocketBase owner-removal deny to FORBIDDEN",
      mutation: function mutation() {
        const { pb, deleteSpy } = createPocketBaseMock();
        const user = createUserRecord("user-admin", "admin@example.com");
        const adminMembership = createWorkspaceMemberRecord("membership-admin", user.id, "admin");
        const ownerMembership = createWorkspaceMemberRecord(
          "membership-owner",
          "user-owner",
          "owner"
        );

        vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue(
          createWorkspaceMembershipContextSuccess(pb, user, adminMembership)
        );
        vi.mocked(findWorkspaceMemberById).mockResolvedValue(ownerMembership);
        vi.mocked(countWorkspaceOwners).mockResolvedValue(2);
        deleteSpy.mockRejectedValue(createNotFoundError());

        return {
          response: removeWorkspaceMemberForCurrentUser("team-space", ownerMembership.id),
          writeSpy: deleteSpy,
        };
      },
      expectedResponse: {
        ok: false as const,
        errorCode: "FORBIDDEN" as const,
      },
      shouldWrite: true,
    },
  ])("$name", async function testMembershipGuards(input) {
    const mutation = input.mutation();
    const response = await mutation.response;

    expect(response).toEqual(input.expectedResponse);
    expect(mutation.writeSpy).toHaveBeenCalledTimes(input.shouldWrite ? 1 : 0);
  });
});

function createPocketBaseMock() {
  const deleteSpy = vi.fn(async function deleteRecord() {
    return undefined;
  });
  const updateSpy = vi.fn(async function updateRecord() {
    return undefined;
  });

  return {
    pb: {
      collection: vi.fn(function getCollection() {
        return {
          delete: deleteSpy,
          update: updateSpy,
        };
      }),
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

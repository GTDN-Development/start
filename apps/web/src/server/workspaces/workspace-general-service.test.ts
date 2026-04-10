import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";

vi.mock("@/server/workspaces/workspace-auth-context", function mockWorkspaceAuthContext() {
  return {
    requireWorkspaceActionContext: vi.fn(),
    requireWorkspaceAuthContext: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-normalization", function mockWorkspaceNormalization() {
  return {
    normalizeWorkspaceName: vi.fn((value: string) => value.trim()),
    resolveUniqueWorkspaceSlug: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    ensureWorkspaceMembership: vi.fn(),
    findWorkspaceBySlug: vi.fn(),
    findWorkspaceMembershipByWorkspaceAndUser: vi.fn(),
    countWorkspaceMembers: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-mappers", function mockWorkspaceMappers() {
  return {
    mapUserWorkspaceSummary: vi.fn(),
  };
});

import { requireWorkspaceActionContext } from "@/server/workspaces/workspace-auth-context";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { resolveUniqueWorkspaceSlug } from "@/server/workspaces/workspace-normalization";
import { ensureWorkspaceMembership } from "@/server/workspaces/workspace-repository";
import { createWorkspaceForCurrentUser } from "./workspace-general-service";

describe("workspace-general-service", function describeWorkspaceGeneralService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("writes created_by when creating a workspace", async function testCreateWorkspaceWritesCreator() {
    const createSpy = vi.fn().mockResolvedValue(createWorkspaceRecord());
    const pb = createPocketBaseMock(createSpy);
    const user = createUserRecord("user-1", "user@example.com");
    const membership = createWorkspaceMembershipRecord("membership-1", user.id, "owner");

    vi.mocked(requireWorkspaceActionContext).mockResolvedValue({
      ok: true,
      context: {
        pb,
        user,
      },
    });
    vi.mocked(resolveUniqueWorkspaceSlug).mockResolvedValue("team-space");
    vi.mocked(ensureWorkspaceMembership).mockResolvedValue(membership);
    vi.mocked(mapUserWorkspaceSummary).mockReturnValue({
      id: "workspace-1",
      name: "Team Space",
      slug: "team-space",
      avatarUrl: null,
      memberCount: 1,
      membershipId: membership.id,
      role: membership.role,
    });

    const response = await createWorkspaceForCurrentUser({
      name: "Team Space",
    });

    expect(createSpy).toHaveBeenCalledWith({
      name: "Team Space",
      slug: "team-space",
      kind: "organization",
      created_by: user.id,
    });
    expect(response).toEqual({
      ok: true,
      data: {
        workspace: {
          id: "workspace-1",
          name: "Team Space",
          slug: "team-space",
          avatarUrl: null,
          memberCount: 1,
          membershipId: membership.id,
          role: membership.role,
        },
      },
    });
  });
});

function createPocketBaseMock(createSpy: ReturnType<typeof vi.fn>): PocketBase {
  return {
    collection: vi.fn(function getCollection() {
      return {
        create: createSpy,
      };
    }),
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

function createWorkspaceMembershipRecord(
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

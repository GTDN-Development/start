import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
    return {
      requireWorkspaceActionContext: vi.fn(),
      requireWorkspaceActionMembershipContext: vi.fn(),
    };
  }
);

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
  };
});

vi.mock("@/server/workspaces/workspace-mappers", function mockWorkspaceMappers() {
  return {
    mapUserWorkspaceSummary: vi.fn(),
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

import { logWorkspaceServiceError } from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { resolveUniqueWorkspaceSlug } from "@/server/workspaces/workspace-normalization";
import { ensureWorkspaceMembership } from "@/server/workspaces/workspace-repository";
import { requireWorkspaceActionContext } from "@/server/workspaces/workspace-resolution-service";
import { createWorkspaceForCurrentUser } from "./workspace-general-service";

describe("workspace-general-service", function describeWorkspaceGeneralService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("writes created_by when creating a workspace", async function testCreateWorkspaceWritesCreator() {
    const { pb, createSpy } = createPocketBaseMock();
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
          membershipId: membership.id,
          role: membership.role,
        },
      },
    });
  });

  it("rolls back the created workspace when owner membership creation fails", async function testCreateWorkspaceMembershipRollback() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");

    vi.mocked(requireWorkspaceActionContext).mockResolvedValue({
      ok: true,
      context: {
        pb,
        user,
      },
    });
    vi.mocked(resolveUniqueWorkspaceSlug).mockResolvedValue("team-space");
    vi.mocked(ensureWorkspaceMembership).mockRejectedValue(createClientResponseError(403));

    const response = await createWorkspaceForCurrentUser({
      name: "Team Space",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "FORBIDDEN",
    });
    expect(deleteSpy).toHaveBeenCalledWith("workspace-1");
    expect(logWorkspaceServiceError).not.toHaveBeenCalled();
  });

  it("keeps the original membership error when rollback delete also fails", async function testCreateWorkspaceRollbackFailureLogging() {
    const rollbackError = new Error("rollback failed");
    const { pb, deleteSpy } = createPocketBaseMock({
      deleteSpy: vi.fn().mockRejectedValue(rollbackError),
    });
    const user = createUserRecord("user-1", "user@example.com");

    vi.mocked(requireWorkspaceActionContext).mockResolvedValue({
      ok: true,
      context: {
        pb,
        user,
      },
    });
    vi.mocked(resolveUniqueWorkspaceSlug).mockResolvedValue("team-space");
    vi.mocked(ensureWorkspaceMembership).mockRejectedValue(createClientResponseError(400));

    const response = await createWorkspaceForCurrentUser({
      name: "Team Space",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "BAD_REQUEST",
    });
    expect(deleteSpy).toHaveBeenCalledWith("workspace-1");
    expect(logWorkspaceServiceError).toHaveBeenCalledWith(
      "rollbackWorkspaceAfterFailedMembership",
      rollbackError
    );
  });

  it("does not roll back the workspace when mapping fails after membership creation", async function testCreateWorkspaceMappingFailureDoesNotRollback() {
    const { pb, deleteSpy } = createPocketBaseMock();
    const user = createUserRecord("user-1", "user@example.com");
    const membership = createWorkspaceMembershipRecord("membership-1", user.id, "owner");
    const mappingError = new Error("mapping failed");

    vi.mocked(requireWorkspaceActionContext).mockResolvedValue({
      ok: true,
      context: {
        pb,
        user,
      },
    });
    vi.mocked(resolveUniqueWorkspaceSlug).mockResolvedValue("team-space");
    vi.mocked(ensureWorkspaceMembership).mockResolvedValue(membership);
    vi.mocked(mapUserWorkspaceSummary).mockImplementation(function throwMappingError() {
      throw mappingError;
    });

    const response = await createWorkspaceForCurrentUser({
      name: "Team Space",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(logWorkspaceServiceError).toHaveBeenCalledWith(
      "createWorkspaceForCurrentUser",
      mappingError
    );
  });
});

function createPocketBaseMock(input?: {
  createSpy?: ReturnType<typeof vi.fn>;
  deleteSpy?: ReturnType<typeof vi.fn>;
}) {
  const createSpy = input?.createSpy ?? vi.fn().mockResolvedValue(createWorkspaceRecord());
  const deleteSpy = input?.deleteSpy ?? vi.fn().mockResolvedValue(undefined);

  const pb = {
    collection: vi.fn(function getCollection() {
      return {
        create: createSpy,
        delete: deleteSpy,
      };
    }),
  } as unknown as PocketBase;

  return {
    pb,
    createSpy,
    deleteSpy,
  };
}

function createClientResponseError(status: number) {
  const error = new ClientResponseError({
    url: "https://example.com/api/collections/workspaces/records/workspace-1",
    status,
    response: {},
  });
  error.status = status;
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

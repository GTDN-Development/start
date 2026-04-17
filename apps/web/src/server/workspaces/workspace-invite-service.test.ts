import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceInvitesRecord } from "@/types/pocketbase";
import {
  findInviteById,
  listWorkspaceInviteRecordsByWorkspace,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import {
  createInviteExpiryDate,
  createInviteToken,
  hashInviteToken,
} from "@/server/workspaces/workspace-invite-utils";
import { createWorkspaceInviteUrl } from "@/server/workspaces/workspace-invite-url";
import { requireWorkspaceActionMembershipContext } from "@/server/workspaces/workspace-resolution-service";
import {
  listWorkspaceInvitesWithClient,
  refreshWorkspaceInviteLinkForCurrentUser,
} from "./workspace-invite-service";

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
    findInviteById: vi.fn(),
    findInviteByWorkspaceAndEmail: vi.fn(),
    listWorkspaceInviteRecordsByWorkspace: vi.fn(),
    listWorkspaceMemberRecordsByWorkspace: vi.fn(),
    safeDeleteInvite: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-invite-utils", function mockWorkspaceInviteUtils() {
  return {
    createInviteExpiryDate: vi.fn(),
    createInviteToken: vi.fn(),
    hashInviteToken: vi.fn(),
    isDateStringExpired(value: string, now?: number) {
      const expiresAt = Date.parse(value);

      if (!Number.isFinite(expiresAt)) {
        return true;
      }

      return expiresAt <= (now ?? Date.now());
    },
  };
});

vi.mock("@/server/workspaces/workspace-invite-url", function mockWorkspaceInviteUrl() {
  return {
    createWorkspaceInviteUrl: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-invite-mailer", function mockWorkspaceInviteMailer() {
  return {
    sendWorkspaceInviteEmail: vi.fn(),
  };
});

describe("workspace-invite-service", function describeWorkspaceInviteService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("filters expired invites from the list payload", async function testListFiltersExpiredInvites() {
    vi.mocked(listWorkspaceInviteRecordsByWorkspace).mockResolvedValue([
      createInviteRecord("invite-active", {
        expiresAt: "2099-01-01T00:00:00.000Z",
        updated: "2026-01-02T00:00:00.000Z",
      }),
      createInviteRecord("invite-expired", {
        expiresAt: "2020-01-01T00:00:00.000Z",
        updated: "2026-01-01T00:00:00.000Z",
      }),
    ]);

    const response = await listWorkspaceInvitesWithClient("pb-client" as never, "workspace-1");

    expect(response).toEqual({
      ok: true,
      data: {
        invites: [
          {
            id: "invite-active",
            emailNormalized: "invite-active@example.com",
            role: "member",
            expiresAt: "2099-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
            invitedByName: "Inviter",
            inviteUrl: null,
          },
        ],
      },
    });
  });

  it("refreshes an active invite and returns the updated link payload", async function testRefreshInviteLink() {
    const { pb, updateSpy } = createPocketBaseMock();
    const currentInvite = createInviteRecord("invite-1", {
      expiresAt: "2099-01-01T00:00:00.000Z",
      updated: "2026-01-01T00:00:00.000Z",
    });

    vi.mocked(requireWorkspaceActionMembershipContext).mockResolvedValue({
      ok: true,
      context: {
        pb,
        user: {
          id: "user-1",
          name: "Inviter",
        } as never,
        membership: {
          id: "membership-1",
          role: "owner",
        } as never,
        workspace: {
          id: "workspace-1",
          slug: "team-space",
        } as never,
      },
    });
    vi.mocked(findInviteById).mockResolvedValue(currentInvite);
    vi.mocked(createInviteToken).mockReturnValue("next-token");
    vi.mocked(hashInviteToken).mockReturnValue("next-token-hash");
    vi.mocked(createInviteExpiryDate).mockReturnValue("2099-02-01T00:00:00.000Z");
    vi.mocked(createWorkspaceInviteUrl).mockReturnValue("/invite/next-token");
    updateSpy.mockResolvedValue(
      createInviteRecord("invite-1", {
        expiresAt: "2099-02-01T00:00:00.000Z",
        updated: "2026-02-01T00:00:00.000Z",
      })
    );

    const response = await refreshWorkspaceInviteLinkForCurrentUser(
      "team-space",
      currentInvite.id,
      "en"
    );

    expect(updateSpy).toHaveBeenCalledWith(currentInvite.id, {
      token_hash: "next-token-hash",
      expires_at: "2099-02-01T00:00:00.000Z",
    });
    expect(response).toEqual({
      ok: true,
      data: {
        inviteId: "invite-1",
        expiresAt: "2099-02-01T00:00:00.000Z",
        updatedAt: "2026-02-01T00:00:00.000Z",
        inviteUrl: "/invite/next-token",
      },
    });
    expect(safeDeleteInvite).not.toHaveBeenCalled();
  });
});

function createPocketBaseMock() {
  const updateSpy = vi.fn();

  return {
    pb: {
      collection: vi.fn(function getCollection() {
        return {
          update: updateSpy,
        };
      }),
    } as unknown as PocketBase,
    updateSpy,
  };
}

function createInviteRecord(
  id: string,
  options: {
    expiresAt: string;
    updated: string;
  }
): WorkspaceInvitesRecord {
  return {
    id,
    collectionId: "workspace_invites",
    collectionName: "workspace_invites",
    created: "2026-01-01T00:00:00.000Z",
    updated: options.updated,
    workspace: "workspace-1",
    email_normalized: `${id}@example.com`,
    role: "member",
    token_hash: `${id}-hash`,
    expires_at: options.expiresAt,
    invited_by: "user-1",
    expand: {
      invited_by: {
        id: "user-1",
        name: "Inviter",
      },
    },
  } as WorkspaceInvitesRecord;
}

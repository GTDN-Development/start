import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord, WorkspaceInvitesRecord } from "@/types/pocketbase";

vi.mock("@/server/workspaces/workspace-repository", function mockWorkspaceRepository() {
  return {
    findInviteById: vi.fn(),
    findInviteByWorkspaceAndEmail: vi.fn(),
    listWorkspaceInviteRecordsByWorkspace: vi.fn(),
    listWorkspaceMemberRecordsByWorkspace: vi.fn(),
    safeDeleteInvite: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-invite-mailer", function mockWorkspaceInviteMailer() {
  return {
    sendWorkspaceInviteEmail: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-invite-url", function mockWorkspaceInviteUrl() {
  return {
    createWorkspaceInviteUrl: vi.fn(),
  };
});

import { listWorkspaceInviteRecordsByWorkspace } from "@/server/workspaces/workspace-repository";
import { listWorkspaceInvitesWithClient } from "./workspace-invite-service";

describe("workspace-invite-service", function describeWorkspaceInviteService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("maps non-expired invites through the with-client list helper", async function testListWithClient() {
    const pb = {} as PocketBase;

    vi.mocked(listWorkspaceInviteRecordsByWorkspace).mockResolvedValue([
      createExpandedInviteRecord({
        id: "invite-expired",
        email: "expired@example.com",
        expiresAt: "2020-01-01T00:00:00.000Z",
      }),
      createExpandedInviteRecord({
        id: "invite-active",
        email: "active@example.com",
        invitedByName: "Workspace Owner",
      }),
    ]);

    const response = await listWorkspaceInvitesWithClient(pb, "workspace-1");

    expect(response).toEqual({
      ok: true,
      data: {
        invites: [
          {
            id: "invite-active",
            emailNormalized: "active@example.com",
            role: "member",
            expiresAt: "2099-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            invitedByName: "Workspace Owner",
            inviteUrl: null,
          },
        ],
      },
    });
  });

  it("maps list failures in the with-client helper to not found", async function testListWithClientNotFound() {
    const pb = {} as PocketBase;

    vi.mocked(listWorkspaceInviteRecordsByWorkspace).mockRejectedValue(
      createClientResponseError(404)
    );

    const response = await listWorkspaceInvitesWithClient(pb, "workspace-1");

    expect(response).toEqual({
      ok: false,
      errorCode: "NOT_FOUND",
    });
  });
});

function createClientResponseError(status: number) {
  const error = new ClientResponseError({
    url: "https://example.com/api/error",
    status,
    response: {},
  });
  error.status = status;
  return error;
}

function createExpandedInviteRecord(options: {
  id: string;
  email: string;
  invitedByName?: string;
  expiresAt?: string;
  role?: WorkspaceInvitesRecord["role"];
}) {
  return {
    ...createInviteRecord(options),
    expand: {
      invited_by: options.invitedByName
        ? ({
            ...createUserRecord("user-owner", "owner@example.com"),
            name: options.invitedByName,
          } as UsersRecord)
        : undefined,
    },
  };
}

function createInviteRecord(options: {
  id: string;
  email: string;
  expiresAt?: string;
  role?: WorkspaceInvitesRecord["role"];
}): WorkspaceInvitesRecord {
  return {
    id: options.id,
    collectionId: "workspace_invites",
    collectionName: "workspace_invites",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    workspace: "workspace-1",
    email_normalized: options.email,
    role: options.role ?? "member",
    token_hash: `${options.id}-hash`,
    invited_by: "user-owner",
    expires_at: options.expiresAt ?? "2099-01-01T00:00:00.000Z",
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

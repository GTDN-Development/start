import { describe, expect, it } from "vitest";
import {
  applyWorkspaceInvitePatched,
  applyWorkspaceInviteRemoved,
  applyWorkspaceMemberRemoval,
  applyWorkspaceMemberRoleChange,
} from "./workspace-members-screen-state";

describe("workspace-members-screen-state", function describeWorkspaceMembersScreenState() {
  it("recomputes the current user role and last-owner flag after a role change", function testRoleChangeForCurrentUser() {
    const response = applyWorkspaceMemberRoleChange({
      workspace: createWorkspace(),
      members: [
        createMember({
          id: "member-current",
          userId: "user-1",
          email: "user@example.com",
          role: "owner",
        }),
        createMember({
          id: "member-other",
          userId: "user-2",
          email: "admin@example.com",
          role: "owner",
        }),
      ],
      memberId: "member-current",
      role: "admin",
    });

    expect(response.workspace.role).toBe("admin");
    expect(response.workspace.isCurrentUserLastOwner).toBe(false);
    expect(response.members.map((member) => member.id)).toEqual(["member-other", "member-current"]);
  });

  it("keeps the owner-count invariant when removing another owner", function testOwnerRemoval() {
    const response = applyWorkspaceMemberRemoval({
      workspace: {
        ...createWorkspace(),
        isCurrentUserLastOwner: false,
      },
      members: [
        createMember({
          id: "member-current",
          userId: "user-1",
          email: "user@example.com",
          role: "owner",
        }),
        createMember({
          id: "member-other",
          userId: "user-2",
          email: "owner@example.com",
          role: "owner",
        }),
        createMember({
          id: "member-admin",
          userId: "user-3",
          email: "admin@example.com",
          role: "admin",
        }),
      ],
      memberId: "member-other",
    });

    expect(response.workspace.role).toBe("owner");
    expect(response.workspace.isCurrentUserLastOwner).toBe(true);
    expect(response.members.map((member) => member.id)).toEqual(["member-current", "member-admin"]);
  });

  it("patches and removes invitations without touching other rows", function testInvitePatchAndRemoval() {
    const invites = [
      createInvite({
        id: "invite-1",
        emailNormalized: "first@example.com",
        inviteUrl: "https://example.com/invite-1",
      }),
      createInvite({
        id: "invite-2",
        emailNormalized: "second@example.com",
        inviteUrl: "https://example.com/invite-2",
      }),
    ];

    const patchedInvites = applyWorkspaceInvitePatched(invites, "invite-2", {
      expiresAt: "2026-05-01T12:00:00.000Z",
      inviteUrl: "https://example.com/refreshed-2",
    });
    const remainingInvites = applyWorkspaceInviteRemoved(patchedInvites, "invite-1");

    expect(remainingInvites).toEqual([
      expect.objectContaining({
        id: "invite-2",
        emailNormalized: "second@example.com",
        expiresAt: "2026-05-01T12:00:00.000Z",
        inviteUrl: "https://example.com/refreshed-2",
      }),
    ]);
  });
});

function createWorkspace() {
  return {
    id: "workspace-1",
    slug: "team-space",
    name: "Team Space",
    currentUserId: "user-1",
    role: "owner" as const,
    isCurrentUserLastOwner: true,
    avatarUrl: null,
  };
}

function createMember(input: {
  id: string;
  userId: string;
  email: string;
  role: "owner" | "admin" | "member";
}) {
  return {
    id: input.id,
    userId: input.userId,
    email: input.email,
    name: null,
    avatarUrl: null,
    role: input.role,
  };
}

function createInvite(input: { id: string; emailNormalized: string; inviteUrl: string | null }) {
  return {
    id: input.id,
    emailNormalized: input.emailNormalized,
    role: "member" as const,
    expiresAt: "2026-04-20T12:00:00.000Z",
    updatedAt: "2026-04-16T12:00:00.000Z",
    invitedByName: "Owner",
    inviteUrl: input.inviteUrl,
  };
}

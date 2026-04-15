/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const workspaces = app.findCollectionByNameOrId("workspaces");
    const workspaceInvites = app.findCollectionByNameOrId("workspace_invites");

    const sameWorkspaceMemberRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= id",
    ].join(" && ");
    const inviteWorkspaceAdminOrOwnerRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= workspace",
      '(@collection.workspace_members.role ?= "owner" || @collection.workspace_members.role ?= "admin")',
    ].join(" && ");
    const inviteRecipientReadRule = [
      '@request.auth.id != ""',
      "email_normalized ?= @request.auth.email:lower",
      "expires_at > @now",
    ].join(" && ");
    const pendingInviteWorkspaceViewRule = [
      '@request.auth.id != ""',
      "@collection.workspace_invites.workspace ?= id",
      "@collection.workspace_invites.email_normalized ?= @request.auth.email:lower",
      "@collection.workspace_invites.expires_at > @now",
    ].join(" && ");

    workspaces.viewRule = `(${sameWorkspaceMemberRule}) || (${pendingInviteWorkspaceViewRule})`;
    workspaceInvites.listRule = `(${inviteWorkspaceAdminOrOwnerRule}) || (${inviteRecipientReadRule})`;
    workspaceInvites.viewRule = `(${inviteWorkspaceAdminOrOwnerRule}) || (${inviteRecipientReadRule})`;
    workspaceInvites.deleteRule = `(${inviteWorkspaceAdminOrOwnerRule}) || (${inviteRecipientReadRule})`;

    app.save(workspaces);
    app.save(workspaceInvites);
  },
  (app) => {
    const workspaces = app.findCollectionByNameOrId("workspaces");
    const workspaceInvites = app.findCollectionByNameOrId("workspace_invites");

    const sameWorkspaceMemberRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= id",
    ].join(" && ");
    const inviteWorkspaceAdminOrOwnerRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= workspace",
      '(@collection.workspace_members.role ?= "owner" || @collection.workspace_members.role ?= "admin")',
    ].join(" && ");

    workspaces.viewRule = sameWorkspaceMemberRule;
    workspaceInvites.listRule = inviteWorkspaceAdminOrOwnerRule;
    workspaceInvites.viewRule = inviteWorkspaceAdminOrOwnerRule;
    workspaceInvites.deleteRule = inviteWorkspaceAdminOrOwnerRule;

    app.save(workspaces);
    app.save(workspaceInvites);
  }
);

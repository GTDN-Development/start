/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const workspaces = app.findCollectionByNameOrId("workspaces");
    const workspaceInvites = app.findCollectionByNameOrId("workspace_invites");
    const workspaceMembers = app.findCollectionByNameOrId("workspace_members");
    const workspaceFieldNames = workspaces.fields.fieldNames();

    if (!workspaceFieldNames.includes("created_by")) {
      workspaces.fields.addMarshaledJSON(`{
      "cascadeDelete": false,
      "collectionId": "_pb_users_auth_",
      "hidden": false,
      "id": "relation1775836000",
      "maxSelect": 1,
      "minSelect": 0,
      "name": "created_by",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "relation"
    }`);
    }

    const sameWorkspaceMemberRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= id",
    ].join(" && ");
    const sameWorkspaceAdminOrOwnerRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= id",
      '(@collection.workspace_members.role ?= "owner" || @collection.workspace_members.role ?= "admin")',
    ].join(" && ");
    const sameWorkspaceOwnerRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= id",
      '@collection.workspace_members.role ?= "owner"',
    ].join(" && ");
    const inviteWorkspaceAdminOrOwnerRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= workspace",
      '(@collection.workspace_members.role ?= "owner" || @collection.workspace_members.role ?= "admin")',
    ].join(" && ");
    const inviteCreateAdminOrOwnerRule = [
      '@request.auth.id != ""',
      '@request.body.workspace != ""',
      "@request.body.invited_by = @request.auth.id",
      "@collection.workspace_members.user ?= @request.auth.id",
      "@collection.workspace_members.workspace ?= @request.body.workspace",
      '(@collection.workspace_members.role ?= "owner" || @collection.workspace_members.role ?= "admin")',
    ].join(" && ");
    const membershipReadRule = [
      '@request.auth.id != ""',
      "@collection.workspace_members:auth.user ?= @request.auth.id",
      "@collection.workspace_members:auth.workspace ?= workspace",
    ].join(" && ");
    const membershipUpdateRule = [
      '@request.auth.id != ""',
      [
        "(",
        "  (",
        "    @collection.workspace_members:auth.user ?= @request.auth.id &&",
        "    @collection.workspace_members:auth.workspace ?= workspace &&",
        '    @collection.workspace_members:auth.role ?= "owner"',
        "  )",
        "  ||",
        "  (",
        "    @collection.workspace_members:auth.user ?= @request.auth.id &&",
        "    @collection.workspace_members:auth.workspace ?= workspace &&",
        '    @collection.workspace_members:auth.role ?= "admin" &&',
        '    role != "owner" &&',
        '    (@request.body.role:isset = false || @request.body.role != "owner")',
        "  )",
        ")",
      ].join("\n"),
    ].join(" && ");
    const membershipDeleteRule = [
      '@request.auth.id != ""',
      [
        "(",
        "  user = @request.auth.id",
        "  ||",
        "  (",
        "    @collection.workspace_members:auth.user ?= @request.auth.id &&",
        "    @collection.workspace_members:auth.workspace ?= workspace &&",
        '    @collection.workspace_members:auth.role ?= "owner"',
        "  )",
        "  ||",
        "  (",
        "    @collection.workspace_members:auth.user ?= @request.auth.id &&",
        "    @collection.workspace_members:auth.workspace ?= workspace &&",
        '    @collection.workspace_members:auth.role ?= "admin" &&',
        '    role != "owner"',
        "  )",
        ")",
      ].join("\n"),
    ].join(" && ");
    const membershipCreateRule = [
      '@request.auth.id != ""',
      '@request.body.workspace != ""',
      "@request.body.user = @request.auth.id",
      [
        "(",
        "  (",
        '    @request.body.role = "owner" &&',
        "    @collection.workspaces.id ?= @request.body.workspace &&",
        "    @collection.workspaces.created_by ?= @request.auth.id",
        "  )",
        "  ||",
        "  (",
        '    @request.body.role != "owner" &&',
        "    @collection.workspace_invites.workspace ?= @request.body.workspace &&",
        "    @collection.workspace_invites.role ?= @request.body.role &&",
        "    @collection.workspace_invites.email_normalized ?= @request.auth.email:lower &&",
        "    @collection.workspace_invites.expires_at > @now",
        "  )",
        ")",
      ].join("\n"),
    ].join(" && ");

    workspaces.createRule = '@request.auth.id != "" && @request.body.created_by = @request.auth.id';
    workspaces.listRule = sameWorkspaceMemberRule;
    workspaces.viewRule = sameWorkspaceMemberRule;
    workspaces.updateRule = sameWorkspaceAdminOrOwnerRule;
    workspaces.deleteRule = sameWorkspaceOwnerRule;

    workspaceInvites.createRule = inviteCreateAdminOrOwnerRule;
    workspaceInvites.listRule = inviteWorkspaceAdminOrOwnerRule;
    workspaceInvites.viewRule = inviteWorkspaceAdminOrOwnerRule;
    workspaceInvites.updateRule = inviteWorkspaceAdminOrOwnerRule;
    workspaceInvites.deleteRule = inviteWorkspaceAdminOrOwnerRule;

    workspaceMembers.createRule = membershipCreateRule;
    workspaceMembers.listRule = membershipReadRule;
    workspaceMembers.viewRule = membershipReadRule;
    workspaceMembers.updateRule = membershipUpdateRule;
    workspaceMembers.deleteRule = membershipDeleteRule;

    app.save(workspaces);
    app.save(workspaceInvites);
    app.save(workspaceMembers);

    app
      .db()
      .newQuery(
        `UPDATE workspaces
         SET created_by = (
           SELECT workspace_members.user
           FROM workspace_members
           WHERE workspace_members.workspace = workspaces.id
             AND workspace_members.role = 'owner'
           ORDER BY workspace_members.created ASC
           LIMIT 1
         )
         WHERE created_by IS NULL`
      )
      .execute();
  },
  (app) => {
    const workspaces = app.findCollectionByNameOrId("workspaces");
    const workspaceInvites = app.findCollectionByNameOrId("workspace_invites");
    const workspaceMembers = app.findCollectionByNameOrId("workspace_members");

    workspaces.createRule = "";
    workspaces.listRule = "";
    workspaces.viewRule = "";
    workspaces.updateRule = "";
    workspaces.deleteRule = "";

    workspaceInvites.createRule = "";
    workspaceInvites.listRule = "";
    workspaceInvites.viewRule = "";
    workspaceInvites.updateRule = "";
    workspaceInvites.deleteRule = "";

    workspaceMembers.createRule = "";
    workspaceMembers.listRule = "";
    workspaceMembers.viewRule = "";
    workspaceMembers.updateRule = "";
    workspaceMembers.deleteRule = "";

    if (workspaces.fields.fieldNames().includes("created_by")) {
      workspaces.fields.removeByName("created_by");
    }

    app.save(workspaces);
    app.save(workspaceInvites);
    return app.save(workspaceMembers);
  }
);

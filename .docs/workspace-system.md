# Workspace System

## What This Solves

This layer handles optional workspace-based collaboration inside an account-first SaaS starter.

It owns:

- workspace creation, update, leave, and deletion
- workspace selection and shell scope-switcher behavior
- workspace-scoped routes and access checks
- workspace members and invites
- signed-out invite handoff into post-auth routing

It does not define the default authenticated application entrypoint.

## Current Model

The app is account-first.

That means:

- auth lands users in `/app`
- `/app` and `/account*` are personal scope
- workspace pages only exist where page identity depends on workspace
- the shell remains usable when the user has zero workspaces
- switching between personal and collaborative scope happens in one shell surface

Workspace kinds currently supported by the data model:

- `organization`

Member roles:

- `owner`
- `admin`
- `member`

Invite roles:

- `admin`
- `member`

## Route Model

The main application routes are:

- `/app`
- `/account`
- `/account/preferences`
- `/account/security`
- `/w/[workspaceSlug]`
- `/w/[workspaceSlug]/overview`
- `/w/[workspaceSlug]/settings`
- `/w/[workspaceSlug]/settings/members`
- `/invite/[token]`

Important route rules:

- `/app` is the authenticated home page
- `/account*` is always user-scoped
- `/w/[workspaceSlug]/*` is always workspace-scoped
- `/w/[workspaceSlug]` is an entry route that redirects to workspace overview when valid
- concrete workspace pages resolve access directly from pathname slug
- invalid or inaccessible workspace routes render scoped not-found states instead of bouncing through `/overview`

## File Map

- shell scope helpers: [application-scope.ts](/Users/fanda/Dev/start/apps/web/src/features/application/application-scope.ts)
- shell route selection helpers: [workspace-selection.ts](/Users/fanda/Dev/start/apps/web/src/features/application/workspace-selection.ts)
- shell scope switcher: [scope-switcher.tsx](/Users/fanda/Dev/start/apps/web/src/features/application/scope-switcher.tsx)
- personal home route: [page.tsx](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/(application-shell)/app/page.tsx>)
- access checks: [workspace-membership-context.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-membership-context.ts)
- write and lifecycle service: [workspace-general-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-general-service.ts)
- read and resolution service: [workspace-resolution-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-resolution-service.ts)
- members service: [workspace-members-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.ts)
- invite service: [workspace-invite-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-invite-service.ts)
- invite recipient service: [workspace-invite-recipient-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-invite-recipient-service.ts)
- repository layer: [workspace-repository.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-repository.ts)
- cookie helpers: [workspace-cookie.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-cookie.ts)
- general workspace actions: [workspace-general-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts)
- members workspace actions: [workspace-members-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts)
- workspace navigation state: [workspace-navigation-context.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/workspace-navigation-context.tsx)
- workspace creation UI: [workspace-create-drawer.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/workspace-create-drawer.tsx)

## Service Split

The split remains direct and domain-based.

`workspace-general-service.ts` owns write and lifecycle operations:

- `createWorkspaceForCurrentUser()`
- `updateWorkspaceGeneralForCurrentUser()`
- `deleteWorkspaceForCurrentUser()`

`workspace-resolution-service.ts` owns read and route-selection operations:

- `listUserWorkspaces()`
- `resolveWorkspaceForUserBySlug()`
- `resolvePostAuthDestination()`
- `resolveAccessibleWorkspaceForCurrentUser()`

Important rule:

- `workspace-resolution-service.ts` is read-only with respect to cookies
- it may read preference cookies
- it must not consume `pending_invite` or repair `active_workspace` during render

`workspace-members-service.ts` owns membership changes.

`workspace-invite-service.ts` owns invite creation, resend, refresh, and revoke.

`workspace-invite-recipient-service.ts` owns invite validation and acceptance for the invited user.

## Explicit Integration Points

Workspace-specific code is intentionally localized. The main app core touches it only in a few places:

- app shell scope switcher mount in [application-layout.tsx](/Users/fanda/Dev/start/apps/web/src/features/application/application-layout.tsx)
- contextual personal/workspace navigation in [application-menu-tree.tsx](/Users/fanda/Dev/start/apps/web/src/features/application/application-menu-tree.tsx)
- personal home route under [page.tsx](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/(application-shell)/app/page.tsx>)
- post-auth invite handoff in sign-in navigation and [post-auth route](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.ts>)
- invite routes under [apps/web/src/app/[locale]/(auth)/(flow)/invite](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/invite>)

That keeps the removal path bounded without adding a runtime feature system.

## Cookies

The workspace layer uses two cookies.

### Active Workspace Cookie

- name: `active_workspace`
- purpose: remember the user's preferred workspace for shell shortcuts and switcher state

Used by:

- scope switcher workspace preference
- workspace-aware shell links
- direct invite acceptance
- explicit post-auth and invite route handlers

Important rules:

- `active_workspace` is a UI preference, not a requirement for auth or app entry
- stale `active_workspace` is ignored during render; it is not repaired or cleared by render-time code
- only Server Actions and Route Handlers may set or clear it

It may also be used to resume the user's last valid app context from non-shell surfaces such as marketing CTA links.

### Pending Invite Cookie

- name: `pending_invite`
- purpose: store the invite token for a guest who opened a workspace invite before signing in

Used by:

- `/invite/[token]/start`
- `/post-auth`

Important rules:

- `pending_invite` may be read during render if needed
- it is only cleared in explicit response-writing boundaries when an invite redirect is actually chosen

## Post-Auth Behavior

The default authenticated destination is `/app`.

Post-auth workspace handling only changes the destination when a pending workspace invite exists.

The invite handoff chain is:

- `/invite/[token]/start`
- `/sign-in`
- `/post-auth`
- `/invite/[token]` or `/w/[workspaceSlug]/overview` or `/app`

Outside auth flows, non-shell `Go to app` entry points restore the last valid app context:

- valid `active_workspace` -> `/w/[workspaceSlug]/overview`
- missing or stale `active_workspace` -> `/app`

Outcome priority:

1. pending invite -> `/invite/[token]`
2. valid active workspace -> `/w/[workspaceSlug]/overview`
3. no workspace-specific outcome -> `/app`

The app no longer bootstraps a personal workspace as part of the universal auth path.

## Scope Switcher Behavior

The shell uses a scope switcher, not a workspace-only switcher.

It always renders:

- one `Personal` option
- one `Workspaces` group
- one `Create workspace` action

This keeps personal scope first-class without changing the workspace data model.

Behavior inside workspace routes:

- pathname workspace slug has priority
- if the slug is valid and available, that workspace is shown as selected

Behavior inside personal routes:

- the `Personal` option is shown as active
- the preferred workspace still comes from `active_workspace`
- selecting a workspace from personal scope navigates to `/w/[workspaceSlug]/overview`

Behavior outside workspace routes but still inside the application shell:

- the selected workspace comes from `active_workspace`
- if the cookie is stale, the shell ignores it and falls back read-only
- switching from `/app` or `/account*` to a workspace navigates to `/w/[workspaceSlug]/overview`
- selecting `Personal` always navigates to `/app`
- if no workspace exists, the switcher still renders with explicit empty copy plus a separate create action

## Zero-Workspace State

Zero workspaces is a valid authenticated state.

Current shell behavior:

- `/app` remains usable
- `/account`, `/account/preferences`, and `/account/security` remain usable
- the scope switcher still shows `Personal`
- the sidebar uses personal navigation only
- the switcher shows explicit empty workspace copy and a separate create action

## Shell Navigation Model

The application shell is contextual.

Personal scope navigation:

- `Home`
- `Account`
- `Support`

Workspace scope navigation:

- `Overview`
- `Settings`
- `Support`

Breadcrumbs and compact header labels also show scope explicitly:

- `Personal / Home`
- `Personal / Account`
- `{WorkspaceName} / Overview`
- `{WorkspaceName} / Settings / Members`

## Members And Role Rules

Current behavior:

- admin or owner is required for invite management and most member management
- only owner can transfer ownership
- owner removal or leave is blocked when it would remove the last owner

Rules stay explicit in service files instead of being moved into a policy engine.

## Billing Compatibility

The workspace layer is intentionally billing-compatible, not billing-opinionated.

Current guardrails:

- workspace ownership is represented by stable internal IDs, not slugs
- workspace routes are collaboration routes, not billing routes
- the workspace domain does not assume seats, credits, or subscriptions
- billing can later attach to either personal scope or workspace scope without changing the shell model

Non-goals for this layer:

- no provider-neutral billing abstraction before the first real provider exists
- no assumption that member count automatically equals billable quantity
- no billing side effects inside generic workspace navigation logic

## Removal Path

If a fork removes workspaces later, the intended bounded deletion path is:

1. remove workspace PocketBase collections
2. delete [apps/web/src/server/workspaces](/Users/fanda/Dev/start/apps/web/src/server/workspaces)
3. delete [apps/web/src/features/workspaces](/Users/fanda/Dev/start/apps/web/src/features/workspaces)
4. delete [apps/web/src/app/[locale]/(application)/w/[workspaceSlug]](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/w/[workspaceSlug]>)
5. remove workspace shell integrations from scope switcher, contextual navigation, personal home CTA, and post-auth invite handoff

No runtime feature registry or provider-neutral abstraction is required for that future change.

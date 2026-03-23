# Workspace System

Planning note:

- the implementation plan for this target state lives in [workspace-refactor-plan.md](/Users/fanda/Dev/start/.plans/workspace-refactor-plan.md)

## What This Solves

This layer handles optional workspace-based collaboration inside an account-first SaaS starter.

It owns:

- workspace creation, update, leave, and deletion
- workspace selection and shell switcher behavior
- workspace-scoped routes and access checks
- workspace members and invites
- signed-out invite handoff into post-auth routing

It does not define the default authenticated application entrypoint.

## Current Model

The app is account-first.

That means:

- auth lands users in `/app`
- account pages are user-scoped
- workspace pages only exist where page identity depends on workspace
- the shell remains usable when the user has zero workspaces

Workspace kinds currently supported by the data model:

- `personal`
- `organization`

Personal workspaces are still supported if they already exist, but they are no longer a required post-auth invariant.

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
- `/invite/result`

Important route rules:

- `/app` is the authenticated home page
- `/account*` is always user-scoped
- `/w/[workspaceSlug]/*` is always workspace-scoped
- `/w/[workspaceSlug]` is an entry route that redirects to workspace overview when valid
- concrete workspace pages resolve access directly from pathname slug
- invalid or inaccessible workspace routes render scoped not-found states instead of bouncing through `/overview`

## File Map

- shell route selection helpers: [workspace-routing.ts](/Users/fanda/Dev/start/src/features/application/workspace-routing.ts)
- access checks: [workspace-access.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-access.ts)
- write and lifecycle service: [workspace-general-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-general-service.ts)
- read and resolution service: [workspace-resolution-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts)
- members service: [workspace-members-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-members-service.ts)
- invite service: [workspace-invite-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts)
- repository layer: [workspace-repository.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-repository.ts)
- cookie helpers: [workspace-cookie.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-cookie.ts)
- server actions: [workspace-actions.ts](/Users/fanda/Dev/start/src/features/workspaces/actions/workspace-actions.ts)
- switcher UI: [workspace-switcher.tsx](/Users/fanda/Dev/start/src/features/workspaces/workspace-switcher.tsx)

## Service Split

The split remains direct and domain-based.

`workspace-general-service.ts` owns write and lifecycle operations:

- `createOrganizationWorkspaceForCurrentUser()`
- `updateWorkspaceGeneralForCurrentUser()`
- `deleteOrganizationWorkspaceForCurrentUser()`

`workspace-resolution-service.ts` owns read and route-selection operations:

- `listUserWorkspaces()`
- `resolveWorkspaceForUserBySlug()`
- `resolvePostAuthDestination()`
- `switchWorkspaceForCurrentUser()`

`workspace-members-service.ts` owns membership changes.

`workspace-invite-service.ts` owns invite validation, acceptance, creation, resend, revoke, and pending invite consumption.

## Explicit Integration Points

Workspace-specific code is intentionally localized. The main app core touches it only in a few places:

- app shell workspace switcher mount in [application-layout.tsx](/Users/fanda/Dev/start/src/features/application/application-layout.tsx)
- workspace menu item resolution in [application-menu-tree.tsx](/Users/fanda/Dev/start/src/features/application/application-menu-tree.tsx)
- post-auth invite handoff in [auth-actions.ts](/Users/fanda/Dev/start/src/features/auth/actions/auth-actions.ts) and [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts)
- invite routes under [src/app/[locale]/(auth)/(flow)/invite](</Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite>)

That keeps the removal path bounded without adding a runtime feature system.

## Cookies

The workspace layer uses two cookies.

### Active Workspace Cookie

- name: `active_workspace`
- purpose: remember the user's preferred workspace for shell shortcuts and switcher state

Used by:

- workspace switcher selection
- workspace-aware shell links
- direct invite acceptance
- application layout repair of stale workspace preference

Important rule:

- `active_workspace` is a UI preference, not a requirement for auth or app entry

### Pending Invite Cookie

- name: `pending_invite`
- purpose: store the hashed invite token for a guest who opened a workspace invite before signing in

Used by:

- `/invite/[token]/start`
- post-auth invite handoff

## Post-Auth Behavior

The default authenticated destination is `/app`.

Post-auth workspace handling only changes the destination when a pending workspace invite exists.

Outcome priority:

1. accepted invite -> workspace overview
2. already-member invite -> workspace overview
3. invite email mismatch -> `/invite/result`
4. invite invalid or expired -> `/invite/result`
5. pending invite transient failure -> explicit `/invite/result?state=error`
6. no workspace-specific outcome -> `/app`

The app no longer bootstraps a personal workspace as part of the universal auth path.

## Workspace Switcher Behavior

The workspace switcher is a shell feature, not a route resolver.

Behavior inside workspace routes:

- pathname workspace slug has priority
- if the slug is valid and available, that workspace is shown as selected

Behavior outside workspace routes:

- the selected workspace comes from `active_workspace`
- if the cookie is stale, the shell repairs it to the first available workspace
- switching from `/app` or `/account*` navigates to `/w/[workspaceSlug]/overview`
- if no workspace exists, the switcher shows an explicit create-only empty state

## Zero-Workspace State

Zero workspaces is a valid authenticated state.

Current shell behavior:

- `/app` remains usable
- `/account`, `/account/preferences`, and `/account/security` remain usable
- the workspace menu item is hidden
- the workspace switcher shows a create-only empty state

## Members And Role Rules

Current behavior:

- admin or owner is required for invite management and most member management
- only owner can transfer ownership
- owner removal or leave is blocked when it would remove the last owner
- personal workspaces cannot be left, deleted, or used for member invites
- personal workspaces do not expose the `Members` settings item

Rules stay explicit in service files instead of being moved into a policy engine.

## Removal Path

If a fork removes workspaces later, the intended bounded deletion path is:

1. remove workspace PocketBase collections
2. delete [src/server/workspaces](/Users/fanda/Dev/start/src/server/workspaces)
3. delete [src/features/workspaces](/Users/fanda/Dev/start/src/features/workspaces)
4. delete [src/app/[locale]/(application)/w/[workspaceSlug]](</Users/fanda/Dev/start/src/app/[locale]/(application)/w/[workspaceSlug]>)
5. remove workspace shell integrations from navigation, layout, and post-auth invite handoff

No runtime feature registry or provider-neutral abstraction is required for that future change.

# Workspace System

## What This Solves

This layer handles the app's workspace model.

- personal workspace bootstrap
- organization workspace creation and deletion
- workspace selection and post-auth landing
- workspace member management
- workspace invite lifecycle
- workspace-scoped access checks

The goal is a simple workspace-first SaaS model without billing, entitlements, or generic policy layers.

## Current Model

Workspace kinds:

- `personal`
- `organization`

Member roles:

- `owner`
- `admin`
- `member`

Invite roles:

- `admin`
- `member`

Current assumptions:

- every user should end up with a personal workspace
- users can belong to multiple workspaces
- one active workspace slug can be remembered in a cookie

## How It Works

The workspace flow is split into a few explicit layers:

- auth context guard
- workspace access guard
- focused workspace services
- server actions for UI mutations
- application routes reading from the services directly

Short version:

- `workspace-auth-context.ts` turns auth into a workspace-safe server context
- `workspace-access.ts` resolves workspace membership and role checks
- service files each own one workspace concern
- actions apply cookies and revalidation after successful mutations

## File Map

- auth bridge: [workspace-auth-context.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-auth-context.ts)
- access checks: [workspace-access.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-access.ts)
- write/lifecycle service: [workspace-general-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-general-service.ts)
- read/resolution service: [workspace-resolution-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts)
- members service: [workspace-members-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-members-service.ts)
- invite service: [workspace-invite-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts)
- repository layer: [workspace-repository.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-repository.ts)
- cookie helpers: [workspace-cookie.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-cookie.ts)
- server actions: [workspace-actions.ts](/Users/fanda/Dev/start/src/features/workspaces/actions/workspace-actions.ts)

## Service Split

The current split is intentional.

`workspace-general-service.ts` owns write and lifecycle operations:

- `ensurePersonalWorkspace()`
- `createOrganizationWorkspaceForCurrentUser()`
- `updateWorkspaceGeneralForCurrentUser()`
- `deleteOrganizationWorkspaceForCurrentUser()`

`workspace-resolution-service.ts` owns read and resolution operations:

- `listUserWorkspaces()`
- `resolveWorkspaceForUserBySlug()`
- `pickWorkspaceForOverview()`
- `resolvePostAuthWorkspace()`
- `switchWorkspaceForCurrentUser()`

`workspace-members-service.ts` owns membership changes.

`workspace-invite-service.ts` owns invite validation, acceptance, creation, resend, revoke, and pending invite consumption.

## Access Model

There are two explicit gates.

### Auth Gate

[workspace-auth-context.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-auth-context.ts) requires a valid authenticated user and converts auth failures into workspace response errors.

### Workspace Gate

[workspace-access.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-access.ts) resolves:

- workspace by slug
- current user's membership in that workspace
- optional owner/admin role enforcement

This keeps service files direct:

- get auth context
- get workspace access
- run the domain operation

## Cookies

The workspace layer currently uses two cookies.

### Active Workspace Cookie

- name: `active_workspace`
- purpose: remember the user's preferred current workspace slug

Used by:

- workspace switcher flow
- `/overview` resolution
- application layout active workspace state
- direct signed-in invite accept

### Pending Invite Cookie

- name: `pending_invite`
- purpose: store the hashed invite token for a guest who opened an invite link before signing in

Used by:

- `/invite/[token]/start`
- post-auth workspace resolution

## Post-Auth Workspace Resolution

This is one of the main workspace flows.

`resolvePostAuthWorkspace()` currently does three things in order:

1. ensure the user's personal workspace exists
2. consume a pending invite cookie if present
3. return an explicit post-auth destination

Workspace redirect priority is:

1. accepted/already-member invite workspace
2. active workspace cookie match
3. first workspace in the user's sorted workspace list

Possible destination outcomes are:

- workspace redirect
- invite email mismatch
- invite invalid/expired

This is what powers:

- `/overview`
- post-auth client redirect after sign-in/sign-up
- explicit invite result handling after auth

## Invite Flow

Current invite flow:

1. admin creates an invite
2. email contains `/invite/[token]`
3. invite page validates the token
4. if the visitor is signed out, `/invite/[token]/start` stores the hashed token in `pending_invite` and redirects to sign-in
5. after auth, `resolvePostAuthWorkspace()` consumes that pending invite
6. accepted invites send the user to the invited workspace overview and persist `active_workspace`
7. mismatch/invalid outcomes after auth are surfaced through `/invite/result`

Signed-in invite handling also supports:

- already-member result
- email mismatch result
- invalid/expired token result

Direct signed-in accept now also persists the invited workspace as `active_workspace` before redirecting.

## Members And Role Rules

Current behavior:

- any workspace member can list workspace members and invites through an access-checked workspace
- admin or owner is required for invite management and most member management
- only owner can transfer ownership
- owner removal/demotion is blocked when it would remove the last owner
- personal workspaces cannot be left, deleted, or used for member invites
- personal workspaces do not expose the `Members` item in workspace settings navigation

This keeps the rules explicit in the service layer instead of hiding them in a separate policy engine.

## Current Routes

The main workspace-facing routes are:

- `/overview`
- `/w/[workspaceSlug]`
- `/w/[workspaceSlug]/overview`
- `/w/[workspaceSlug]/settings`
- `/w/[workspaceSlug]/settings/members`
- `/invite/[token]`
- `/invite/result`

Important behavior:

- the application layout loads the current user's workspace list
- `/overview` is a resolver route, not a permanent content page
- `/w/[workspaceSlug]` is an entry route that redirects to the workspace overview when the workspace is valid
- concrete workspace pages resolve the workspace again by slug and membership
- invalid workspace slugs redirect back to `/overview`
- unknown nested routes inside a valid workspace render a scoped not-found page inside the application shell
- `/w/[workspaceSlug]/settings/members` shows an informational state for personal workspaces instead of member management UI
- the visible workspace switcher follows pathname-first selection, then `active_workspace`, then the first available workspace

## Current Constraints

Not currently implemented:

- billing-based workspace limits
- feature flags or entitlements
- workspace suspension / disabled states
- plugin hooks around workspace lifecycle

The current system is intentionally direct:

- PocketBase data access in the repository layer
- business rules in focused service files
- UI mutations in server actions

## Common Changes

Adding a new workspace capability:

- prefer a new focused service file in `src/server/workspaces/` when the concern is genuinely new
- keep imports direct
- keep role checks in the service that owns the operation

Changing workspace landing behavior:

- check [workspace-resolution-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts)
- check [workspace-cookie.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-cookie.ts)
- check [overview/page.tsx](</Users/fanda/Dev/start/src/app/[locale]/(application)/overview/page.tsx>)
- check [page.tsx](</Users/fanda/Dev/start/src/app/[locale]/(application)/w/[workspaceSlug]/page.tsx>)

Changing invite behavior:

- check [workspace-invite-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts)
- check [page.tsx](</Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx>)
- check [page.tsx](</Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/result/page.tsx>)
- check [route.ts](</Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts>)

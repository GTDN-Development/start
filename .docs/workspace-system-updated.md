# Workspace System

Planning note:

- the implementation plan for this target state lives in [workspace-refactor-plan.md](/Users/fanda/Dev/start/.plans/workspace-refactor-plan.md)

## What This Solves

This layer handles optional workspace-based collaboration inside an account-first SaaS starter.

It owns:

- workspace creation and deletion
- workspace selection
- workspace-scoped navigation
- workspace member management
- workspace invite lifecycle
- workspace-scoped access checks

It does not define the default authenticated application entrypoint.

The starter now treats workspaces as a real feature module, not as a mandatory global app invariant.

## Current Model

The app is account-first.

That means:

- auth lands users in the application core
- account pages are user-scoped
- workspace pages are only used when the page identity depends on workspace

Workspace kinds:

- `organization`

Member roles:

- `owner`
- `admin`
- `member`

Invite roles:

- `admin`
- `member`

Current assumptions:

- users may belong to zero, one, or many workspaces
- one active workspace slug may be remembered in a cookie
- the application must still work when no workspace exists

## Route Model

The main application routes are:

- `/app`
- `/account`
- `/account/preferences`
- `/account/security`
- `/support`
- `/w/[workspaceSlug]`
- `/w/[workspaceSlug]/overview`
- `/w/[workspaceSlug]/settings`
- `/w/[workspaceSlug]/settings/members`
- `/invite/[token]`
- `/invite/result`

Route rules:

- `/app` is the authenticated home page
- `/account*` is always user-scoped
- `/w/[workspaceSlug]/*` is always workspace-scoped
- `/w/[workspaceSlug]` is an entry route that redirects to the workspace overview when valid
- concrete workspace pages resolve workspace access directly by slug
- invalid or inaccessible concrete workspace routes render a scoped failure state instead of bouncing through a resolver route

There is no resolver-only application home route.

## Why The Model Looks Like This

This system intentionally keeps two things separate:

- account-level app access
- workspace-level collaboration context

That keeps the starter usable for:

- B2C products that may never need workspaces
- B2B products that need workspace URLs for collaboration and access control

It also keeps the code aligned with the project architecture principles:

- direct imports
- direct route composition
- no feature registry
- no plugin-style workspace mode layer

## File Map

- route selection helpers: [workspace-routing.ts](/Users/fanda/Dev/start/src/features/application/workspace-routing.ts)
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

The split stays concrete and domain-based.

`workspace-general-service.ts` owns write and lifecycle operations:

- `createOrganizationWorkspaceForCurrentUser()`
- `updateWorkspaceGeneralForCurrentUser()`
- `deleteOrganizationWorkspaceForCurrentUser()`

`workspace-resolution-service.ts` owns read and selection operations:

- `listUserWorkspaces()`
- `resolveWorkspaceForUserBySlug()`
- `pickWorkspaceForShellSelection()`
- `switchWorkspaceForCurrentUser()`

`workspace-members-service.ts` owns membership changes.

`workspace-invite-service.ts` owns invite validation, acceptance, creation, resend, revoke, and pending invite consumption.

No generic policy engine or provider abstraction was added.

## Access Model

There are two explicit gates.

### Auth Gate

[current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts) owns authentication and session validation.

Workspace services only run after authenticated user resolution succeeds.

### Workspace Gate

[workspace-access.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-access.ts) resolves:

- workspace by slug
- current user's membership in that workspace
- optional owner or admin role requirements

Service flow remains easy to trace:

- route or action
- auth check
- workspace access check
- domain operation

## Cookies

The workspace layer uses two cookies.

### Active Workspace Cookie

- name: `active_workspace`
- purpose: remember the user's preferred workspace for shell shortcuts and switcher state

Used by:

- workspace switcher selection
- workspace-aware shell links
- direct invite acceptance

Important rule:

- `active_workspace` is a preference, not a requirement for auth or app entry

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
5. no workspace-specific outcome -> `/app`

This keeps auth focused on auth, while still preserving correct invite behavior.

The app no longer bootstraps a personal workspace as part of the universal auth path.

If a pending invite exists and cannot be resolved safely, the app keeps the outcome explicit instead of silently falling back to `/app`.

## Workspace Switcher Behavior

The workspace switcher is a shell feature, not a route resolver.

Behavior inside workspace routes:

- the current pathname workspace slug has priority
- if the slug is valid and available, that workspace is shown as selected

Behavior outside workspace routes:

- the selected workspace comes from `active_workspace`
- if the cookie is stale, the first available workspace is used
- if no workspace exists, the switcher shows create-only empty state

Switch behavior:

- switching from `/app`, `/account`, or `/support` navigates to `/w/[workspaceSlug]/overview`
- switching inside a workspace route preserves the current workspace-scoped path shape when possible

This means the switcher outside workspace routes represents "preferred workspace", not "current page context".

## Zero-Workspace Behavior

Zero workspaces is a supported application state.

When the authenticated user has no workspace:

- `/app` remains the normal authenticated home
- account and support routes remain fully available
- the main navigation does not point to workspace routes as fallback
- the workspace menu item is hidden
- the switcher shows an explicit create-only empty state if the workspace feature is present

If a fork removes the workspace feature entirely, the switcher is removed from the shell instead of being replaced with a generic mode system.

## Invite Flow

Current invite flow:

1. admin creates an invite
2. email contains `/invite/[token]`
3. invite page validates the token
4. if the visitor is signed out, `/invite/[token]/start` stores the hashed token in `pending_invite` and redirects to sign-in
5. after auth, pending invite consumption decides whether the user should enter a workspace or see an invite result state
6. accepted or already-member outcomes persist `active_workspace`
7. mismatch or invalid outcomes go to `/invite/result`

Signed-in invite handling still supports:

- already-member result
- email mismatch result
- invalid or expired result

## Routing Guarantees

The system guarantees:

- workspace-scoped pages are canonical only under `/w/[workspaceSlug]/*`
- app home never depends on workspace existence
- invalid concrete workspace URLs do not bounce through an app-wide resolver
- stale workspace cookie state does not block app access

## Members And Role Rules

Current behavior:

- any workspace member can list workspace members and invites through an access-checked workspace
- admin or owner is required for invite management and most member management
- only owner can transfer ownership
- owner removal or demotion is blocked when it would remove the last owner

These rules remain explicit in the service layer.

## Workspace Removability

The workspace feature is intentionally localized.

Main workspace-only areas:

- `src/server/workspaces/`
- `src/features/workspaces/`
- `src/app/[locale]/(application)/w/[workspaceSlug]/`
- workspace shell entry points in the application layout and navigation

This is the supported removal path for a future no-workspace fork:

1. remove PocketBase workspace collections
2. delete workspace server files
3. delete workspace feature files
4. delete workspace routes
5. remove workspace switcher and workspace menu entry from the shell
6. remove invite-specific workspace handoff from post-auth flow

This removability is structural. It is not implemented as a runtime feature-flag framework.

## Current Constraints

Not currently implemented:

- billing-based workspace limits
- workspace suspension or disabled states
- feature-entitlement layers around workspaces
- plugin hooks around workspace lifecycle

This is intentional.

The system stays direct:

- PocketBase data access in the repository layer
- business rules in focused service files
- UI mutations in server actions
- shell selection logic in concrete UI helpers

## Common Changes

Adding a new workspace capability:

- prefer a new focused service file in `src/server/workspaces/` only when the concern is genuinely new
- keep route identity workspace-scoped if the page meaning depends on workspace
- keep non-workspace pages out of the workspace tree

Changing workspace landing behavior:

- check [workspace-invite-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts)
- check [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts)
- check [workspace-cookie.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-cookie.ts)
- check [workspace-switcher.tsx](/Users/fanda/Dev/start/src/features/workspaces/workspace-switcher.tsx)

Changing workspace page routing:

- check [workspace-routing.ts](/Users/fanda/Dev/start/src/features/application/workspace-routing.ts)
- check [page.tsx](/Users/fanda/Dev/start/src/app/[locale]/(application)/w/[workspaceSlug]/page.tsx)
- check concrete workspace pages under [src/app/[locale]/(application)/w/[workspaceSlug]](/Users/fanda/Dev/start/src/app/[locale]/(application)/w/[workspaceSlug])

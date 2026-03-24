# Workspace Refactor Plan

Location note:

- implementation plan lives in `.plans/`
- target-state documentation lives in `.docs/`

## Purpose

This plan changes the starter from a workspace-first default to an account-first core with an optional workspace feature.

The goal is to keep the project:

- aligned with [Project Architecture Principles](/Users/fanda/Dev/start/.rules/project-architecture-principles.md)
- KISS
- production-ready
- easy to fork for both B2B and B2C products
- easier to strip of workspace functionality later

This is not a framework-style feature toggle project. The change should reduce coupling, not replace one kind of complexity with another.

## Why Change The Current Model

The current model has one architectural mismatch:

- the app behaves like workspace-scoped software in many routes
- but the shell and auth flow still rely on a non-workspace resolver route, `/overview`

That creates avoidable ambiguity:

- `/overview` looks like a real content page but is only a resolver
- auth is coupled to workspace bootstrap and workspace landing
- invalid workspace routes bounce through `/overview`
- the active workspace cookie affects app-wide navigation even when the current page is not workspace-scoped
- redirect loops become easier to introduce because route meaning is split across path, cookie, and fallback resolution

For a forkable SaaS starter, that is too much default coupling for a feature that should stay optional.

## Target Architecture

The target model is:

- account-first application core
- workspace-scoped collaboration routes
- auth that defaults to app home
- workspace only where the page identity truly depends on workspace

### Canonical Route Rules

- pages that make sense without workspace must not require workspace
- pages whose identity depends on workspace must include workspace in the URL

### Target Route Tree

```text
/[locale]
  /(marketing)
    /
    /pricing
    /blog
    /contact
    /about/features
    /about/integrations
    /about/changelog
    /about/roadmap
    /gdpr
    /terms-of-service
    /cookies

  /(auth)
    /sign-in
    /sign-up
    /forgot-password
    /reset-password
    /verify-email
    /confirm-email-change
    /invite/[token]
    /invite/result

  /(application)
    /app
    /settings/profile
    /settings/preferences
    /settings/security
    /support

    /w/[workspaceSlug]
    /w/[workspaceSlug]/overview
    /w/[workspaceSlug]/settings/general
    /w/[workspaceSlug]/settings/members
```

### Inspiration

This target intentionally combines two ideas without copying either system blindly.

From Linear:

- workspace-scoped URLs are useful when workspace changes the page identity
- a workspace switcher is a good shell concept

From Better Auth demo:

- the authenticated app should have a normal default landing page
- organization or workspace context should not be the mandatory entrypoint for every user flow

What we are explicitly not copying:

- not a fully session-driven "active organization replaces URL identity" model
- not a workspace-first app where auth always resolves to a workspace
- not a plugin-style runtime workspace flag system

## Guard Rails

These rules keep the refactor aligned with the project principles.

- Do not add provider-neutral abstractions.
- Do not add a runtime "workspaces enabled" framework.
- Do not add menu registries or route registries.
- Keep direct composition: route -> action -> service -> repository/helper.
- Prefer changing a few concrete files over introducing a new compatibility layer.
- If a phase grows past the LoC guard rail, stop and review scope before continuing.

## Phase Summary

| Phase | Goal | Estimated gross touched LoC | Expected net delta | Guard rail |
| --- | --- | ---: | ---: | ---: |
| 1 | Introduce real app home and route semantics | 220-340 | +60 to +140 | 380 |
| 2 | Decouple auth from workspace bootstrap | 120-220 | -20 to +30 | 260 |
| 3 | Harden workspace routing and switcher behavior | 180-280 | -10 to +60 | 320 |
| 4 | Make workspace seams explicit and removable | 60-120 | -20 to +20 | 150 |
| 5 | Production verification, regression coverage, docs | 140-260 | +20 to +90 | 300 |
| Optional 6 | PocketBase simplification for a no-workspace fork | 80-180 | -150 to -400 | 220 |

Gross touched LoC means total modified lines in the phase. Expected net delta means rough project growth or shrinkage after the phase settles.

Use this for actual measurement after each phase:

```bash
git diff --shortstat
git diff --numstat
```

Prefer tracking per phase in a dedicated branch or commit boundary.

## Hard Cutover Inventory For `/overview` -> `/app`

The cutover is not safe if implemented only from the initial narrow file list.

As of the current runtime, `/overview` is wired into multiple behavior classes.

### Core Auth And Route Guards

- `src/config/auth.ts`
- `src/features/auth/auth-proxy.ts`
- `src/i18n/routing.ts`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`

### Shell And Navigation

- `src/config/navigation.ts`
- `src/features/application/application-menu-tree.tsx`
- `src/features/application/application-page-header.tsx`
- `src/features/settings/user-settings-menu.tsx`
- `src/app/[locale]/(application)/error.tsx`

### Auth And Invite Flows

- `src/features/auth/post-auth-redirect.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/result/page.tsx`

### Workspace Route Fallbacks

- `src/app/[locale]/(application)/w/[workspaceSlug]/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/layout.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/[...rest]/page.tsx`

### Workspace Mutations That Return To App Home

- `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`
- `src/features/workspaces/actions/workspace-actions.ts`

### Cutover Rule

Phase 1 is not complete until all runtime `/overview` references have been classified as exactly one of:

- replaced with `/app`
- kept only as temporary compatibility redirect
- intentionally preserved because it belongs to `/w/[workspaceSlug]/overview`
- deleted as part of route fallback cleanup

Do not ship the cutover if any unclassified runtime `/overview` reference remains.

## Phase 1: Real App Home And Route Semantics

### Goal

Make the default authenticated destination a real application page instead of a resolver route.

### Why

This is the most important semantic fix.

Today `/overview` pretends to be content but actually performs dispatch logic. That violates the "keep behavior easy to trace" principle because route identity is hidden in indirect resolution logic.

A real `/app` route makes the app shell honest:

- `/app` is the authenticated home
- `/settings/profile` is the canonical user-scoped profile/settings entry
- `/w/[workspaceSlug]/*` is workspace-scoped content

### Work

1. Add `/app` as a real application home page.
2. Decide whether `/overview` becomes:
   - a temporary compatibility redirect to `/app`, or
   - is removed immediately if no external dependency exists.
3. Change `AUTH_REDIRECTS.authenticatedTo` from `"/overview"` to `"/app"`.
4. Update app navigation in [navigation.ts](/Users/fanda/Dev/start/src/config/navigation.ts):
   - replace the current "overview" app entry with a real "app" or "home" app entry
   - keep workspace settings as a separate workspace-scoped entry
5. Update [application-page-header.tsx](/Users/fanda/Dev/start/src/features/application/application-page-header.tsx) and [user-settings-menu.tsx](/Users/fanda/Dev/start/src/features/settings/user-settings-menu.tsx) so their primary app link points to `/app`.
6. Update route guards and localization maps:
   - add `/app` to protected route prefixes
   - remove `/overview` from default auth target behavior
   - add `/app` localized pathname in `src/i18n/routing.ts`
7. Update invite result and any user-facing "go to app" links that still point to `/overview`.
8. Update message keys in `messages/en.json` and `messages/cs.json` to match the new route semantics.
9. Decide the compatibility window:
   - if `/overview` remains temporarily, it must be a dumb redirect only
   - no business routing logic may remain in that page

### Main Files

- `src/config/auth.ts`
- `src/features/auth/auth-proxy.ts`
- `src/i18n/routing.ts`
- `src/config/navigation.ts`
- `src/app/[locale]/(application)/app/page.tsx`
- `src/app/[locale]/(application)/overview/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/result/page.tsx`
- `src/features/application/application-menu-tree.tsx`
- `src/features/application/application-page-header.tsx`
- `src/features/settings/user-settings-menu.tsx`
- `messages/en.json`
- `messages/cs.json`

### What This Fixes

- misleading route semantics
- app shell links pointing to a dispatcher instead of a page
- unnecessary coupling between "authenticated home" and "workspace landing"

### Acceptance Criteria

- signing in without any invite lands on `/app`
- user menu "overview" equivalent points to `/app`
- sidebar has a real app home item
- `/overview` no longer contains business routing logic
- no auth guard, localized pathname, or user-facing CTA still assumes `/overview` is app home
- all runtime `/overview` references are classified according to the cutover rule

## Phase 2: Decouple Auth From Workspace Bootstrap

### Goal

Stop treating workspace creation and workspace selection as the default authenticated flow.

### Why

The starter must work for B2B and B2C products. Automatic workspace bootstrap in the universal auth path is too opinionated for a default template.

The current flow makes auth depend on:

- `ensurePersonalWorkspace()`
- workspace cookie selection
- workspace list sorting

That is the wrong default abstraction boundary.

### Work

1. Replace the current "post-auth workspace resolution" default with "post-auth destination resolution".
2. Default destination becomes `/app`.
3. Preserve workspace-aware invite behavior:
   - accepted invite -> `/w/[workspaceSlug]/overview`
   - already-member invite -> `/w/[workspaceSlug]/overview`
   - email mismatch -> `/invite/result?...`
   - invalid or expired -> `/invite/result?...`
4. Remove `ensurePersonalWorkspace()` from the mandatory post-auth path.
5. Either:
   - rename the current resolver to reflect the new behavior, or
   - keep the file but narrow it to invite-aware destination handling only.
6. Preserve the signed-out invite handoff seam explicitly:
   - keep pending invite consumption in the post-auth destination path
   - do not let invite-aware auth silently degrade to generic `/app` landing
   - if invite resolution cannot be completed safely, return an explicit error path instead of discarding the invite context

### Recommended Shape

Keep direct composition.

Preferred orchestration:

- auth UI calls one post-auth destination action
- that action checks the authenticated session
- it asks the workspace invite domain only for pending invite outcome
- otherwise it returns `/app`

This is intentionally more explicit than a generic "destination strategy" abstraction.

### Invite Safety Rule

The signed-in accept route already redirects directly to workspace and is not the fragile part.

The fragile seam is:

- signed out user opens invite
- invite token hash is stored in `pending_invite`
- user signs in
- post-auth destination logic must consume or surface that invite outcome

For production safety:

- pending invite consumption must stay in the post-auth destination path
- if a pending invite exists and resolution fails transiently, the app must not silently fall back to `/app`
- the failure should stay explicit so the invite is not effectively "lost"

### Main Files

- `src/features/auth/post-auth-redirect.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- `src/app/[locale]/(auth)/(guest)/layout.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/result/page.tsx`

### What This Fixes

- auth coupled to workspace-first assumptions
- unnecessary personal workspace bootstrap on every sign-in
- harder future removal of workspaces from the starter

### Acceptance Criteria

- sign-in with no invite lands on `/app`
- invite accept while signed out still works end to end
- no auth flow requires workspace existence to complete
- pending invite handoff is still resolved after login
- invite-specific failures do not silently downgrade to `/app`

## Phase 3: Harden Workspace Routing And Switcher Behavior

### Goal

Keep workspace behavior strong where it belongs, while removing resolver-style fallback behavior from normal app flow.

### Why

The current route behavior mixes three concepts:

- current workspace from pathname
- preferred workspace from cookie
- fallback workspace from list order

That is acceptable for a switcher, but risky as a routing model.

### Work

1. Keep `/w/[workspaceSlug]` as an entry route that redirects to `/w/[workspaceSlug]/overview` when valid.
2. Change concrete workspace pages so they do not redirect to `/overview`.
3. Recommended rule for concrete pages:
   - invalid or inaccessible workspace -> scoped `notFound()` or equivalent app-safe failure state
4. Keep `active_workspace` only as a UI preference:
   - switcher default selection
   - quick entry into workspace routes
   - invite accept persistence
5. In the application layout, clear or repair stale `active_workspace` values when they are no longer present in the current workspace list.
6. Simplify [workspace-routing.ts](/Users/fanda/Dev/start/src/features/application/workspace-routing.ts) so it only handles:
   - extracting workspace slug from pathname
   - selecting the best workspace for the switcher UI
7. Update workspace-aware links in:
   - sidebar menu
   - page header
   - user account menu

### Zero-Workspace UX

This must be explicit for the starter because B2C and early-stage B2B forks may have no workspace at all.

Required behavior when the authenticated user has zero workspaces:

- `/app` remains fully usable
- `/settings/profile`, `/settings/preferences`, `/settings/security`, and `/support` remain fully usable
- the main app menu must not route the user to workspace pages as a fallback
- the workspace menu item is hidden when no workspace exists
- the switcher does not disappear silently; it shows an explicit create-only empty state when the workspace feature is present
- if a fork removes the workspace feature entirely, the switcher is removed from the shell completely

This keeps "no workspace" as a first-class valid application state instead of an accidental edge case.

### Workspace Switcher Outside Workspace Routes

Outside `/w/[workspaceSlug]/*`, the switcher should show the selected workspace, not claim page context.

Rules:

- on `/app`, `/settings/profile`, `/support`, the switcher uses `active_workspace`
- if the cookie is invalid, it falls back to the first available workspace
- switching workspace from a non-workspace page navigates to `/w/[workspaceSlug]/overview`
- if no workspace exists, the switcher shows create-only empty state
- if the workspace feature is removed from a fork, the switcher is removed entirely

### Main Files

- `src/features/application/workspace-routing.ts`
- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/application/application-menu-tree.tsx`
- `src/features/application/application-page-header.tsx`
- `src/config/navigation.ts`
- `src/app/[locale]/(application)/w/[workspaceSlug]/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/general/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/layout.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/[...rest]/page.tsx`
- `src/features/workspaces/settings/general/workspace-leave-settings-item.tsx`
- `src/features/workspaces/settings/general/workspace-delete-settings-item.tsx`

### What This Fixes

- redirect loops through a non-canonical resolver
- stale workspace cookie ambiguity
- mismatch between page identity and selected workspace display
- invalid default behavior when the user has zero workspaces

### Acceptance Criteria

- workspace pages never bounce through `/overview`
- invalid workspace links do not create redirect loops
- switcher outside workspace routes remains useful and predictable
- the app shell behaves correctly for users with zero workspaces
- no mutation or fallback path returns to `/overview` as app home

## Phase 4: Make Workspace Seams Explicit And Removable

### Goal

Make the workspace feature easy to remove structurally, without adding a runtime feature-flag framework.

### Why

The requirement is clear: the starter should be able to lose workspaces later through a bounded refactor, not through a permanent abstraction layer.

The KISS approach is not "add a plugin system". The KISS approach is "keep the boundaries real and local".

### Work

1. Keep all workspace server code in `src/server/workspaces/`.
2. Keep all workspace client and UI code in `src/features/workspaces/`.
3. Keep all workspace routes under `src/app/[locale]/(application)/w/[workspaceSlug]/`.
4. Reduce workspace references in core files to a small set of integration points:
   - app shell workspace switcher mount
   - workspace menu item
   - post-auth invite handoff
   - invite routes
5. Do not add a generic feature registry.
6. Do not add an adapter facade just to preserve import paths.

### Removal Path After Refactor

The intended future removal should look like this:

1. remove PocketBase workspace collections
2. delete `src/server/workspaces/`
3. delete `src/features/workspaces/`
4. delete `src/app/[locale]/(application)/w/[workspaceSlug]/`
5. remove workspace links from:
   - `src/config/navigation.ts`
   - `src/features/application/application-layout.tsx`
   - `src/features/application/application-menu-tree.tsx`
   - `src/features/auth/post-auth-redirect.ts`
   - invite-specific auth flow if no invite system remains

That is a bounded deletion path, not a mode system.

### What This Fixes

- hidden workspace assumptions in core auth and shell
- harder AI-assisted removal later
- drift toward framework-like complexity

### Acceptance Criteria

- workspace-specific code is visibly localized
- core app routes are understandable without reading workspace services
- no new runtime feature system exists

## Phase 5: Production Verification And Documentation

### Goal

Finish the refactor with enough verification that the new routing model is safer than the old one.

### Why

This refactor changes:

- auth landing
- route identity
- invite handling
- workspace navigation

Without verification, the architecture gets cleaner but the runtime risk rises.

### Work

1. Add regression coverage for:
   - auth with no invite -> `/app`
   - auth with pending invite -> workspace overview
   - invalid invite -> `/invite/result`
   - pending invite resolution failure -> explicit non-silent outcome
   - invalid workspace concrete route -> no redirect loop
   - stale `active_workspace` cookie on `/app`
   - zero-workspace authenticated shell state
   - switcher outside workspace routes
2. Add a short manual QA matrix for:
   - signed in with zero workspaces
   - signed in with one workspace
   - signed in with multiple workspaces
   - invite opened while signed out
   - invite opened while signed in
   - workspace deleted or membership revoked in another session
3. Update:
   - `workspace-system.md`
   - `auth-system.md`
   - route or navigation docs if needed
   - any other plan or implementation docs that still describe `/overview` as app home

### Suggested Verification Focus

Even a small number of good tests is enough if they cover the true risk points.

Prefer focused tests over broad harnesses:

- route decision tests
- invite outcome tests
- stale cookie tests

### Acceptance Criteria

- no known redirect loop path remains
- auth and invite flows are covered by tests or explicit QA checklist
- docs describe the real architecture, not the pre-refactor model

## Optional Phase 6: PocketBase Simplification For A No-Workspace Fork

### Goal

Support a future fork that removes workspaces completely.

### Why

This should be a separate step. It should not distort the main refactor.

### Work

1. Remove PocketBase collections:
   - `workspaces`
   - `workspace_members`
   - `workspace_invites`
2. Re-run PocketBase type generation.
3. Delete workspace routes and services.
4. Remove workspace switcher and menu entries.
5. Remove invite-to-workspace flows or replace them with product-specific onboarding.

### Important Rule

Do not block the main routing refactor on this phase.

The default starter gets better first. Hard removal support comes after the architecture is clean.

## Recommended Execution Order

Do the phases in this order:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 5
5. Phase 4 cleanup pass
6. Optional Phase 6 only if needed for a fork

Phase 4 is intentionally late because the real seams become clearer after the route and auth behavior settles.

## Expected Outcome

After the refactor:

- the app has a real authenticated home
- auth is no longer workspace-first by default
- workspaces remain a first-class feature, but not a global invariant
- the code follows direct composition instead of hidden route indirection
- removing workspaces later is a bounded deletion task, not a redesign

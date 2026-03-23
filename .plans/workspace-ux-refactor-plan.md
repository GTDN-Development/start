# Workspace UX Refactor Plan

Location note:

- implementation plan lives in `.plans/`
- target-state documentation lives in `.docs/`

## Purpose

This plan refines the starter UX after the workspace-first to account-first architecture cutover.

The goal is to make the product easier to understand for first-time users without reintroducing:

- a mandatory personal workspace
- hidden workspace bootstrap behavior
- feature-flag architecture for workspaces
- generic abstraction layers that make the starter harder to remove or fork

The desired end state:

- personal scope is explicit
- workspace scope is explicit
- switching between them is obvious
- the shell stays simple
- workspace functionality remains removable later with low effort

This plan must stay aligned with:

- [Project Architecture Principles](/Users/fanda/Dev/start/.rules/project-architecture-principles.md)
- the current account-first route model
- KISS

## UX Problem To Solve

The current architecture is correct, but the shell still leaves one ambiguity:

- users can create and switch workspaces
- but the switcher is only workspace-aware
- personal scope lives elsewhere in navigation

That creates a UX mismatch:

- technically, personal scope is `/app` and `/account`
- visually, the top shell suggests that "context switching" only means workspaces

The result is subtle confusion:

- "How do I leave the current workspace?"
- "Where is my own personal area?"
- "Is `App` my account, my dashboard, or a workspace?"

The fix should be a UX clarification, not a data-model rollback.

## Product Model To Preserve

The starter should keep this mental model:

- `Personal` = my own app scope
- `Workspace` = shared collaborative scope

Canonical route model:

- `/app` = personal app home
- `/account/*` = personal settings
- `/w/[workspaceSlug]/*` = collaborative scope

Important:

- do not reintroduce `personal` into the workspace data model
- do not invent a hidden personal workspace just to make the UI easier
- do not make auth depend on workspace existence again

## Design Principles For This Refactor

1. Scope must be explicit.
2. Scope switching must live in one obvious place.
3. Personal scope must be a first-class option, not a fallback.
4. Workspace UI should appear only when the current page is truly workspace-scoped.
5. The shell should get simpler, not more configurable.
6. If workspaces are removed later, personal UX should still make sense with minimal surgery.

## Recommended UX Model

### 1. Replace The Workspace Switcher With A Scope Switcher

The shell header/sidebar should no longer contain a workspace-only switcher.

It should contain a **scope switcher** with:

- one `Personal` option
- one `Workspaces` group
- workspace items under that group
- one `Create workspace` action

Behavior:

- selecting `Personal` navigates to `/app`
- selecting a workspace navigates to `/w/[workspaceSlug]/overview`
- when no workspaces exist, the switcher still renders with `Personal` selected and a `Create workspace` action

Why this is the right default:

- fixes the "how do I leave a workspace?" problem
- keeps account-first architecture intact
- stays honest to the underlying model
- is still easy to strip down later by removing the workspace group

### 2. Make Primary Navigation Contextual, Not Ambiguous

The current label `App` is too abstract for a starter.

Recommended user-facing labels:

- `Home` for `/app`
- `Account` for `/account`
- `Support` for `/contact/support`

Contextual rule:

- in personal scope, primary navigation shows personal destinations
- in workspace scope, primary navigation shows workspace destinations

Recommended shape:

#### Personal Scope

- `Home`
- `Account`
- `Support`

#### Workspace Scope

- `Overview`
- `Settings`
- `Support`

Do not show a generic `Workspace` nav item that points to settings from every scope. It makes "workspace" sound like a page instead of a context.

## 3. Make The Current Scope Visible In Header And Breadcrumbs

The current page shell should always make scope legible.

Recommendations:

- show `Personal` as the active scope label when on `/app` or `/account/*`
- show workspace name when on `/w/[workspaceSlug]/*`
- breadcrumbs should reflect scope first, then page

Examples:

- `Personal / Home`
- `Personal / Account`
- `Acme / Overview`
- `Acme / Settings / Members`

This does not require a global scope state system. The scope can be derived from pathname.

## 4. Strengthen The Zero-Workspace State

Zero-workspace must feel intentional, not incomplete.

The `/app` home page should explicitly explain the model:

- personal features work immediately
- workspace is optional
- create a workspace when you need collaboration

Recommended content structure on `/app`:

- personal section
- account/settings shortcuts
- one clear collaboration CTA:
  - `Create a workspace for your team`

This keeps workspaces enabled by default in the starter without making them feel mandatory.

## Naming Decisions

Keep naming changes focused and purposeful.

### Rename In The Shell

- `WorkspaceSwitcher` -> `ScopeSwitcher`
- user-facing nav label `App` -> `Home`

### Keep Domain Names Stable

Do **not** rename the deeper domain layer just for UX polish:

- keep `workspace-navigation-context.tsx`
- keep `workspace-actions.ts`
- keep `workspace-resolution-service.ts`
- keep `workspace-create-drawer.tsx`

Reason:

- those files still model real workspace behavior
- renaming them would add churn without simplifying current code

### Suggested File Ownership

Because the switcher is now a shell concern, move it under `src/features/application`.

Recommended target:

- `src/features/application/scope-switcher.tsx`

It may still import:

- workspace context
- workspace create drawer
- workspace actions

This is a real seam:

- shell composition lives in `src/features/application`
- workspace domain logic stays in `src/features/workspaces`

## Concrete Implementation Approach

## Phase 1: Scope Semantics In The Shell

### Goal

Make personal scope and workspace scope explicit in the main shell.

### Work

1. Replace the current sidebar/header switcher with a new `ScopeSwitcher`.
2. Add a top item for `Personal`.
3. Group workspaces visually below it.
4. Keep `Create workspace` in the same surface.
5. Default selection logic:
   - personal routes select `Personal`
   - workspace routes select the matching workspace
   - zero-workspace state still renders correctly

### Main Files

- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/application/application-layout.tsx`
- `src/features/application/workspace-routing.ts`
- `messages/en.json`
- `messages/cs.json`

### Expected Result

The user can always answer:

- where am I?
- how do I go back to my own area?
- how do I switch to a team workspace?

## Phase 2: Contextual Navigation

### Goal

Stop using navigation labels that mix page identity and scope identity.

### Work

1. Replace user-facing `App` label with `Home`.
2. Remove the generic top-level `Workspace` menu item from personal scope.
3. Render one of two flat nav sets based on current pathname:
   - personal nav
   - workspace nav
4. Keep menus as direct exported arrays in `src/config/navigation.ts`.
5. Do not add menu factories, registries, or generic resolver layers.

### Recommended Structure In `src/config/navigation.ts`

Use flat arrays only:

- `personalApplicationMenu`
- `workspaceApplicationMenu`
- `applicationFooterMenu`

No `getMenu`, no menu registry, no runtime configuration engine.

### Main Files

- `src/config/navigation.ts`
- `src/features/application/application-menu-tree.tsx`
- `src/features/account/user-account-menu.tsx`
- `src/features/application/application-page-header.tsx`
- `messages/en.json`
- `messages/cs.json`

## Phase 3: Explicit Scope Labeling

### Goal

Make the current scope visible beyond the switcher.

### Work

1. Add a small derived scope model in the shell:
   - `personal`
   - `workspace`
2. Derive it directly from pathname.
3. Use it in:
   - breadcrumbs
   - page header label
   - mobile menu title if needed
4. Keep this logic in one focused helper file only if it has at least 3 real call sites.

### Recommended Helper

If the seam is real, add:

- `src/features/application/application-scope.ts`

Functions should stay direct and concrete, for example:

- `resolveApplicationScope(pathname)`
- `isPersonalScopePath(pathname)`
- `isWorkspaceScopePath(pathname)`

Do not add context providers or generic routing engines for this.

## Phase 4: Improve `/app` As A Personal Home

### Goal

Turn `/app` into a clearer home for account-first products.

### Work

1. Update copy in `/app` so it explicitly explains:
   - personal area
   - account settings
   - optional collaboration via workspaces
2. Keep current KISS card layout unless there is a strong reason to change it.
3. Add one clear collaboration block:
   - title oriented around team collaboration
   - create workspace CTA
4. When at least one workspace exists, optionally show a short section listing recent or available workspaces.
5. When none exist, show an intentional empty state, not a warning state.

### Main Files

- `src/app/[locale]/(application)/app/page.tsx`
- `messages/en.json`
- `messages/cs.json`

## Phase 5: Removability Audit

### Goal

Keep workspaces enabled by default while ensuring they remain easy to remove later.

### Work

1. Verify that shell UX depends on a small number of seams only:
   - scope switcher workspace group
   - workspace routes under `/w/[workspaceSlug]/*`
   - create workspace CTA
2. Verify that personal shell still works with `workspaces = []`.
3. Avoid introducing:
   - runtime `workspacesEnabled`
   - feature registries
   - noop compatibility layers
4. Keep workspace-aware code concentrated in existing workspace domain files plus one shell integration point.

### Desired Removability Outcome

To remove workspaces later, a contributor should mostly need to:

1. delete `/w/[workspaceSlug]/*` routes
2. remove workspace group from `ScopeSwitcher`
3. remove create workspace CTA from `/app`
4. delete workspace domain files if no longer needed

The personal shell should not need redesign after that.

## Recommended Component And File Decisions

### Do

- move shell composition concerns into `src/features/application`
- keep workspace domain logic in `src/features/workspaces`
- keep route -> action -> service flow direct
- keep flat navigation arrays
- keep zero-workspace support first-class

### Do Not

- do not introduce a generic "context framework"
- do not add a cross-app "scope provider" unless a concrete seam emerges
- do not make the shell depend on hidden cookies for personal/workspace mode
- do not reintroduce a compatibility `/overview` style resolver
- do not rename every workspace file to `scope-*` just for vocabulary consistency

## Acceptance Criteria

The UX refactor is complete when all of the following are true:

- a signed-in user can always switch between personal scope and workspace scope from one stable shell surface
- zero-workspace users understand that the app is usable immediately
- `Home` clearly means personal app home
- workspace routes clearly communicate that the user is in a collaborative context
- no user-facing copy suggests that a personal workspace exists
- the shell remains understandable by tracing:
  - route
  - menu selection
  - switcher selection
  - page content
- workspaces remain removable later without introducing a feature toggle architecture

## Suggested Implementation Order

1. Phase 1: Scope switcher
2. Phase 2: Contextual navigation and label cleanup
3. Phase 3: Scope labeling in header and breadcrumbs
4. Phase 4: `/app` home refinement
5. Phase 5: removability audit and docs sync

## Summary

The correct UX move for this starter is not "bring back personal workspace."

It is:

- keep account-first architecture
- make scope switching explicit
- make personal scope first-class in the shell
- make collaboration opt-in and obvious

That gives the starter:

- better onboarding
- clearer navigation
- cleaner mental model
- lower coupling
- easier future removal of workspaces


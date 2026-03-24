# Global Settings Shell And Route Refactor Plan

Location note:

- implementation plan lives in `.plans/`
- this document describes the target structure, the problem it solves, and a migration path

## Purpose

This plan separates global user settings from contextual app and workspace navigation.

The current product model is already close to the right one:

- `/app` is personal app space
- `/w/[workspaceSlug]/*` is collaborative workspace space
- `/settings/*` already behaves like a settings center

The UX problem is that the current shell still treats `/settings/*` as part of the personal application scope, even though users experience it more like global settings.

This plan should solve that mismatch without:

- reintroducing a hidden personal workspace
- making global settings pretend to be workspace-aware
- adding complicated conditional shell logic inside one giant layout
- renaming internal account domain code just for surface-level URL polish

## Current Architecture Findings

### 1. One protected shell currently owns three different route types

Today `src/app/[locale]/(application)/layout.tsx` does all of the following:

- enforces auth
- loads current user
- loads workspace list
- resolves active workspace
- mounts `ApplicationLayout`

That visible shell then renders:

- app sidebar
- scope switcher
- application page header
- application footer

This one shell currently wraps:

- `/app`
- `/w/[workspaceSlug]/*`
- `/settings/*`

That is the core architectural tension.

### 2. `/settings/*` is modeled as personal scope in shell logic

In `src/features/application/application-scope.ts`:

- `/app`
- `/settings`
- `/settings/*`

all count as `personal` scope.

That means when the user clicks `Account` from the avatar menu while inside a workspace, the shell changes from workspace presentation to personal presentation.

Even if the selected workspace is still remembered in cookies/context, the UI suggests that the user has switched context.

### 3. The user menu behavior is standard, but the destination shell is not

`src/features/settings/user-settings-menu.tsx` currently links directly to `/settings/profile`.

That is not the UX mistake.

The avatar menu is a normal and expected place for:

- profile
- settings
- sign out

The problem is the destination shell, not the existence of the link.

### 4. Account pages are already a settings area in all but name

The current `/settings/*` area already has settings-style information architecture:

- `/settings` -> redirect to `/settings/profile`
- `/settings/profile`
- `/settings/preferences`
- `/settings/security`

It also already uses:

- `SettingsPage`
- `InnerSidebarLayout`
- page-local settings navigation

So the product is already halfway to a global settings area. The route and shell just do not admit it yet.

### 5. Route naming is now the weakest part of the mental model

The current route naming creates this ambiguity:

- `Account` sounds like identity/profile only
- but the section also contains preferences and security
- and eventually it could reasonably contain notifications, billing, API keys, sessions, etc.

That makes `/settings/*` a poor long-term URL namespace.

## UX Problem To Solve

The current behavior creates three kinds of confusion:

### 1. False context switch

The user clicks a global utility action from the avatar menu.

The app visually behaves as if the user intentionally switched from:

- workspace context
- to personal app context

That is not what the action means.

### 2. Mixed navigation layers

The sidebar and scope switcher represent contextual navigation:

- personal app destinations
- workspace destinations

The account area is different:

- it is a global utility area
- it should not visually compete with workspace scope

Right now those layers are blended together.

### 3. Weak information architecture for future growth

If the product grows, the current `account` namespace gets awkward fast:

- `/settings/preferences`
- `/settings/security`
- `/settings/billing`
- `/settings/api-keys`

This is workable, but not ideal. A `settings` namespace scales much better.

## Recommended Product Model

The clean model is:

- `/app` = personal home
- `/w/[workspaceSlug]/*` = workspace context
- `/settings/*` = global user settings

This creates three distinct navigation modes:

- contextual personal
- contextual workspace
- context-agnostic global settings

That matches user intent much better.

## Should `/settings/profile` Replace `/settings`?

Yes. This is a strong improvement.

Recommended public route model:

- `/settings` -> redirect to `/settings/profile`
- `/settings/profile`
- `/settings/preferences`
- `/settings/security`

Why this is a good fit:

- `Settings` is the expected umbrella label in user menus
- `Profile`, `Preferences`, and `Security` fit naturally underneath it
- the structure scales if you later add more global settings sections
- it avoids implying that the entire area is only about identity/profile

Important implementation note:

- keep the internal domain folder as `src/features/settings/*`

That preserves the current domain boundary and respects the existing architecture rule that account domain code lives in `src/features/settings`.

In other words:

- rename the route and user-facing language
- do not force a risky internal rename of every account feature file

## Recommended Target Architecture

### 1. Split auth/protected concerns from visible shell concerns

The current top-level `(application)` layout should stop being the visible app shell.

It should become a protected root that is responsible only for:

- auth gating
- loading current user
- shared providers needed across protected routes

This gives you one protected area with multiple visible shells underneath it.

### 2. Keep a contextual application shell for `/app` and `/w/*`

Create one visible shell for contextual product navigation:

- sidebar
- scope switcher
- contextual header
- application footer

This shell should own:

- `/app`
- `/w/[workspaceSlug]/*`

This shell should no longer own:

- `/settings/*`

### 3. Add a dedicated global settings shell for `/settings/*`

Create a second visible shell for global settings pages.

This shell should be:

- authenticated
- context-agnostic
- without the application sidebar
- without the scope switcher
- without workspace-as-active-context presentation

It should still provide:

- consistent page chrome
- breadcrumbs or a clear page title
- a deterministic way back to the app

Recommended header behavior:

- title: `Settings`
- secondary nav: `Profile`, `Preferences`, `Security`
- back link: `Back to {workspace}` if an active workspace exists, otherwise `Back to Home`

This keeps settings detached from active scope without trapping the user.

### 4. Let settings keep their own inner navigation

The current account area already uses a local settings navigation model.

That part is good and should remain.

The right separation is:

- app shell navigation = contextual
- settings shell navigation = local/global settings navigation

Do not try to make the global settings area participate in the app scope switcher.

## Recommended File Structure

One clean target structure would look like this:

```text
src/app/[locale]/(application)/layout.tsx
src/app/[locale]/(application)/(app-shell)/layout.tsx
src/app/[locale]/(application)/(app-shell)/app/page.tsx
src/app/[locale]/(application)/(app-shell)/w/[workspaceSlug]/overview/page.tsx
src/app/[locale]/(application)/(app-shell)/w/[workspaceSlug]/settings/layout.tsx
src/app/[locale]/(application)/(settings-shell)/settings/layout.tsx
src/app/[locale]/(application)/(settings-shell)/settings/page.tsx
src/app/[locale]/(application)/(settings-shell)/settings/profile/page.tsx
src/app/[locale]/(application)/(settings-shell)/settings/preferences/page.tsx
src/app/[locale]/(application)/(settings-shell)/settings/security/page.tsx
```

Recommended ownership:

- protected route gate and shared providers: `src/app/[locale]/(application)/layout.tsx`
- contextual shell composition: `src/features/application/*`
- global settings shell composition: `src/features/application/*`
- account/settings content and actions: `src/features/settings/*`

That keeps shell composition in the application feature and leaves account domain logic in the account feature.

## Why A Separate Settings Shell Is Better Than Special-Casing The Existing One

Do not solve this by teaching the current app shell to do more pathname branching.

Avoid these approaches:

- “if pathname starts with `/settings` then hide sidebar”
- “if pathname starts with `/settings` then scope badge becomes neutral”
- “if pathname starts with `/settings` then render a different header variant”

Why that is the wrong direction:

- it turns one shell into a configuration matrix
- it makes visual rules harder to reason about
- it couples unrelated route families together
- it becomes harder to remove or reshape workspaces later

Separate shells are simpler than one shell with many exceptions.

## Navigation Recommendations

### User Menu

Keep the global settings entry in the avatar menu.

Recommended label:

- `Settings`

Recommended destination:

- `/settings/profile`

This is the primary and most standard entry point.

### App Sidebar

Once global settings has its own shell, the personal app sidebar no longer needs to treat settings as a first-class contextual destination.

Recommended default:

- remove `Account` from the personal sidebar

Why:

- it avoids duplicating a global utility destination inside contextual navigation
- it keeps the sidebar focused on contextual destinations only
- it makes the avatar menu the obvious home for settings

If you want a secondary in-app shortcut later, add it deliberately as a utility link, not as a context item.

## Routing And Naming Impact

### Routing

Update the route model from:

- `/settings`
- `/settings/preferences`
- `/settings/security`

to:

- `/settings/profile`
- `/settings/preferences`
- `/settings/security`

Recommended migration support:

- keep temporary redirects from `/settings/*` to `/settings/*`
- keep redirects long enough to protect bookmarks and internal stale links

### Localized Pathnames

`src/i18n/routing.ts` will need new canonical pathnames for:

- `/settings`
- `/settings/profile`
- `/settings/preferences`
- `/settings/security`

For Czech, a reasonable direction would be:

- `/nastaveni`
- `/nastaveni/profil`
- `/nastaveni/preference`
- `/nastaveni/zabezpeceni`

### Auth Protection

`src/config/auth.ts` currently protects:

- `/app`
- `/w`
- `/settings`

This should become:

- `/app`
- `/w`
- `/settings`

## Shell And Scope Logic Changes

### ApplicationScope

After the split, `ApplicationScope` should stop knowing about account/settings routes.

It can become simpler:

- `personal` for `/app`
- `workspace` for `/w/*`
- `other` for anything outside the contextual app shell

If `/settings/*` no longer uses the application shell, it does not need to participate in application scope derivation at all.

### Header Scope Badge

The existing scope badge in `ApplicationPageHeader` should only appear in the contextual shell.

That means:

- `Personal` on `/app`
- workspace name on `/w/[workspaceSlug]/*`

No fake `Personal` state for settings pages.

## Recommended Migration Strategy

### Phase 1. Introduce the new settings route family and shell

- create `/settings/*` routes
- create a dedicated settings shell without app sidebar and scope switcher
- keep account feature components unchanged internally

### Phase 2. Move user navigation to the new settings entry

- change avatar menu item from `Account` to `Settings`
- point it to `/settings/profile`
- decide whether to remove the personal sidebar `Account` item

### Phase 3. Add temporary legacy redirects

- redirect `/settings` to `/settings/profile`
- redirect `/settings/preferences` to `/settings/preferences`
- redirect `/settings/security` to `/settings/security`

### Phase 4. Simplify contextual shell logic

- remove `/settings` handling from `application-scope.ts`
- update any breadcrumb/scope assumptions
- ensure the app shell now only reasons about `/app` and `/w/*`

### Phase 5. Rename copy where it matters

- user-facing nav label: `Settings`
- page shell title/root label: `Settings`
- keep domain/internals as `account` unless there is a compelling reason to rename later

## Risks To Avoid

- do not rename `src/features/settings/*` immediately; it adds churn without solving UX
- do not keep `/settings/*` inside the workspace/personal shell and hide pieces conditionally
- do not preserve `Account` as a “personal scope” concept after the route split
- do not make settings depend on the currently selected workspace

## Final Recommendation

The best long-term architecture is:

- contextual app shell for `/app` and `/w/*`
- global settings shell for `/settings/*`
- avatar menu entry labeled `Settings`
- route model based on `/settings/profile`, `/settings/preferences`, `/settings/security`
- temporary redirects from legacy `/settings/*`
- internal account domain code kept stable

This solves the real problem:

- global settings stop pretending to be a context switch
- workspace UX stays honest
- the route model becomes more scalable
- the shell architecture becomes simpler, not more conditional

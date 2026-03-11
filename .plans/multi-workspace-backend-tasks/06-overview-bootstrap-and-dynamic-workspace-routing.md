# Task 06: Overview bootstrap and dynamic workspace routing

## Goal
Migrate app navigation from hardcoded `/w/workspace/*` paths to real slug-based routes and enforce central server bootstrap via `/overview`.

## Scope
1. Implement `/overview` as central redirect orchestrator.
2. Add dynamic routes:
   - `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
   - `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
   - `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
3. Validate membership server-side on every workspace slug route.
4. Remove legacy static routes in `src/app/[locale]/(application)/w/workspace/*`.
5. Update navigation layer:
   - `applicationMenu`
   - `workspaceSettingsInnerSidebarItems`
   - `isMenuItemActive`
   - `getWorkspaceSegments`
   - user menu links
6. Do not provide backward-compatible alias for `/w/workspace/*`.

## Implementation steps
1. In `/overview`, perform:
   - session validation
   - `ensurePersonalWorkspace` (idempotent)
   - `active_workspace` cookie read
   - membership validation
   - redirect to `/w/[workspaceSlug]/overview`
2. Use i18n navigation helpers for localized redirects (no manual `/${locale}/...`).
3. On slug routes, fail closed for invalid membership (`403/404` based on contract).
4. Update all internal links to use active workspace slug.
5. Remove hardcoded `workspace` segment assumptions from helpers.

## Acceptance criteria
1. `/overview` always redirects to a concrete valid workspace.
2. Legacy `/w/workspace/*` routes are removed and no longer referenced.
3. Invalid slug or missing membership cannot expose foreign workspace data.
4. Menu/sidebar links are consistent with active workspace.

## User-visible behavior
1. After login, users always land in a concrete workspace context.
2. Navigation reflects the actually selected workspace.
3. If a user loses workspace access, app routes to a valid fallback.

## Dependencies
1. Task 02 (core service and workspace selection).
2. Task 05 (API contract for related fetch/mutations).

## Coverage of source plan
1. Section 8.1 (`/overview` bootstrap)
2. Section 8.2 (Workspace routes + legacy route removal)
3. Section 13.1 and 13.5 (DoD points for overview and route migration)

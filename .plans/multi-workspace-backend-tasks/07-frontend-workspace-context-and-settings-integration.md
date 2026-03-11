# Task 07: Frontend workspace context, settings integration, and i18n cleanup

## Goal
Replace static/mock workspace UI with real backend data, preserve existing UI components, and complete production-level localization coverage.

## Scope
1. Implement `src/features/workspaces/workspace-context.tsx` provider (server-first).
2. Implement/integrate `src/features/workspaces/workspace-client.ts`.
3. Load initial data server-side and pass to provider as initial state.
4. Use client fetch only for mutations and explicit refresh.
5. Replace mock data in workspace settings:
   - `WORKSPACE_SETTINGS_PREVIEW`
   - hardcoded rows
6. Connect invite token page to real backend result states and actions.
7. Move user-facing copy to `messages/en.json` and `messages/cs.json`.

## Implementation steps
1. In workspace route layout, load server data for:
   - `activeWorkspace`
   - `availableWorkspaces`
   - members cache
   - invites cache
2. Keep unified state in provider and expose refresh utilities after mutations.
3. Connect settings actions/forms to API routes from Task 05.
4. Keep UI guards (personal restrictions, last-owner warning) as secondary protection.
5. Invite page:
   - remove dev state switcher
   - map real result codes
   - wire CTA actions (`sign-in`, `go to workspace`, `sign-out`)
6. Move invite domain logic to `features/workspaces/invites/*`; keep auth route as thin wrapper.
7. Add localization for all new strings and error states.

## Acceptance criteria
1. Workspace settings UI contains no mock data and no hardcoded production copy.
2. First render of workspace pages does not depend on client refetch.
3. Invite token page uses real server outcomes.
4. All new labels/copy exist in both `messages/en.json` and `messages/cs.json`.
5. UI error behavior is consistent via `WorkspaceErrorCode`.

## User-visible behavior
1. Users see real workspace/member data immediately on page load.
2. Settings changes are reflected without manual reload.
3. Invite page accurately reflects current invite state and next actions.
4. Workspace UI is fully localized in English and Czech.

## Dependencies
1. Task 05 (stable API contract).
2. Task 06 (dynamic routes and slug context).

## Coverage of source plan
1. Section 9.1 (Shared workspace context)
2. Section 9.2 (Workspace settings components)
3. Section 9.3 (Invite token page)
4. Section 9.4 (i18n cleanup)
5. Section 13.6 and 13.9 (DoD points for backend settings and i18n)

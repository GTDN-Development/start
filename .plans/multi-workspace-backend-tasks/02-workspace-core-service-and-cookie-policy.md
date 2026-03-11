# Task 02: Core workspace service and cookie policy

## Goal
Implement core workspace business logic so the system can reliably manage personal and organization workspaces, select an active workspace, and keep cookie state consistent.

## Scope
1. Implement `src/server/workspaces/workspace-service.ts`:
   - `ensurePersonalWorkspace(userId, userEmail, displayName)`
   - `createOrganizationWorkspace(userId, input)`
   - `listUserWorkspaces(userId)`
   - `resolveWorkspaceForUserBySlug(userId, slug)`
   - `pickWorkspaceForOverview(userId, activeWorkspaceSlugCookie)`
   - `updateWorkspaceGeneral(...)`
   - `deleteOrganizationWorkspace(...)`
   - `leaveWorkspace(...)`
2. Implement `src/server/workspaces/workspace-cookie.ts`:
   - set/clear utility for `active_workspace`
   - set/clear utility for `pending_invite_hash`
3. Implement slug policy and race handling for personal/organization workspaces.
4. Enforce server-side guards for personal workspace restrictions.

## Implementation steps
1. Design `ensurePersonalWorkspace` as fully idempotent and parallel-safe.
2. Generate personal slug deterministically (`u-{userId}`), no suffixes.
3. On personal slug conflict, refetch existing personal workspace first (do not create another).
4. Enforce invariant: one user can have at most one personal workspace.
5. For organization workspaces, implement slugify + suffix `-2` to `-10`.
6. Enforce reserved slug list: `overview`, `settings`, `account`, `api`, `invite`, `sign-in`, `sign-up`, `sign-out`.
7. Set cookie attributes:
   - `active_workspace`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production
   - `pending_invite_hash`: `HttpOnly` + short TTL
8. Implement fallback when `active_workspace` cookie is invalid:
   - valid cookie workspace
   - personal workspace
   - first available workspace
9. Enforce server guards:
   - personal workspace cannot be deleted
   - personal workspace cannot be left

## Acceptance criteria
1. `ensurePersonalWorkspace` is retry-safe and does not create duplicate personal workspaces under concurrent load.
2. `createOrganizationWorkspace` follows slug policy and returns predictable errors when attempts are exhausted.
3. `pickWorkspaceForOverview` returns a valid workspace even with a stale/broken cookie.
4. `active_workspace` cookie never points to a workspace where the user is not a member.
5. `deleteOrganizationWorkspace` and `leaveWorkspace` block personal workspace actions with domain error codes.

## User-visible behavior
1. Every user always has their personal workspace available.
2. Returning users open the last valid workspace; if unavailable, the system picks a safe fallback.
3. Users cannot accidentally delete their personal workspace.

## Dependencies
1. Task 01 (schema, indexes, types, base error codes).

## Coverage of source plan
1. Section 5.1 (`workspace-service`)
2. Section 5.4 (Cookie helper)
3. Section 8.4 (Race handling and slug policy)

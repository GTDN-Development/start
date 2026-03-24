# Workspace Members Multi-Owner Refactor Plan

Date: 2026-03-24

## Goal

Align workspace membership UX with the Better Auth mental model where it makes sense, while keeping the implementation simple and direct for this codebase:

- `remove member` is only for acting on someone else
- `leave workspace` is only for acting on yourself
- `owner` can promote another member to `owner` without losing their own owner role
- the last owner cannot be removed, demoted, or leave
- no backwards compatibility for the old owner-swap flow
- no leftover artifacts from the previous implementation

This should follow `.rules/kiss-project-architecture-principles.md`:

- direct page -> action -> service flow
- no new abstraction layers
- focused edits in existing files
- delete obsolete code instead of preserving compatibility shims

## Product Decisions

### Keep

- Roles stay `owner | admin | member`
- Single-role members stay sufficient for now
- Existing dedicated leave intent remains valid
- Existing last-owner guard remains valid

### Change

- Promote to `owner` becomes a normal role change, not ownership transfer
- Self-removal is no longer available through members management
- Members management gets a simple self-only leave action
- The old transfer-ownership implementation is removed

### Do Not Add

- Multi-role memberships
- Compatibility wrappers for old owner-transfer behavior
- New shared helper layers or reusable policy systems
- Separate mini-framework for member action menus or dialogs

## Target UX

### Members table

- For another member:
  - `Change role`
  - `Remove from workspace`
- For current user:
  - `Change role` only when it makes sense and is allowed by current role rules
  - `Leave workspace`
  - never `Remove from workspace`

### Owner behavior

- Owner can promote another `admin` or `member` to `owner`
- Owner can remain owner after promoting another owner
- Owner can leave only when at least one other owner exists
- Last owner sees a blocked leave state with clear explanation

### Dialogs

- Keep the existing role-change dialog
- Keep the existing remove-member dialog for non-self targets only
- Add one simple leave dialog inside members management for self-action
- Reuse the current confirmation pattern and existing leave copy where practical

## Implementation Plan

### 1. Convert server role changes from owner-swap to multi-owner

Files:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-members-service.ts`
- `/Users/fanda/Dev/start/src/features/workspaces/actions/workspace-actions.ts`

Changes:

- Allow `changeWorkspaceMemberRoleForCurrentUser()` to set another member to `owner`
- Keep the guard that prevents demoting the last owner
- Keep admin restriction that admins cannot assign or manage `owner`
- Remove `transferWorkspaceOwnershipForCurrentUser()`
- Remove `transferOwnershipAction()`

Expected outcome:

- `owner -> owner` is a normal role update path
- no server code remains that swaps current owner to admin

Estimated change:

- 25-45 LoC changed
- 20-35 LoC deleted

### 2. Block self-remove on the remove-member server path

Files:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-members-service.ts`

Changes:

- In `removeWorkspaceMemberForCurrentUser()`, reject attempts to remove the acting member
- Return a simple existing domain error if possible, otherwise use `FORBIDDEN`

Expected outcome:

- members-management remove endpoint cannot be used for self-leave
- backend enforces the intent split even if UI regresses later

Estimated change:

- 5-12 LoC changed

### 3. Pass current-user context into members settings

Files:

- `/Users/fanda/Dev/start/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/members/page.tsx`
- `/Users/fanda/Dev/start/src/features/workspaces/settings/workspace-settings-types.ts`

Changes:

- Add a small `currentUserId` field to workspace settings payload for this page
- Pass it through to the client owner for members management decisions

Expected outcome:

- members UI can distinguish `self` from `other` without extra queries or new providers

Estimated change:

- 5-10 LoC changed

### 4. Refactor members management UI to separate self from others

Files:

- `/Users/fanda/Dev/start/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`

Changes:

- Add explicit self detection for each member row
- Replace self `remove` action with self `leave` action
- Keep remove action only for non-self rows
- Keep mobile and table layouts aligned with the same rules
- Wire the self action to `leaveWorkspaceAction()`
- On success:
  - close dialog
  - show success toast
  - redirect out of the workspace to app home

Expected outcome:

- no 404 after self action
- clear intent split in the UI
- no hidden reuse of remove-member flow for leave behavior

Estimated change:

- 45-80 LoC changed

### 5. Add a simple leave dialog inside members management

Files:

- `/Users/fanda/Dev/start/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`
- `/Users/fanda/Dev/start/messages/cs.json`
- `/Users/fanda/Dev/start/messages/en.json`

Changes:

- Add one simple confirm dialog for self leave inside members management
- Keep it lighter than the general settings form
- Suggested structure:
  - title
  - short consequence text
  - last-owner warning if blocked
  - cancel / leave buttons

Expected outcome:

- self leave is available directly where the user is looking at members
- the interaction stays simple and avoids duplicated complex validation UI

Estimated change:

- 30-60 LoC changed in component
- 10-20 LoC changed in messages

### 6. Remove obsolete owner-transfer client code and state updates

Files:

- `/Users/fanda/Dev/start/src/features/workspaces/settings/members/workspace-members-management-settings-item.tsx`
- `/Users/fanda/Dev/start/src/features/workspaces/settings/members/workspace-members-settings-section.tsx`
- `/Users/fanda/Dev/start/src/features/workspaces/actions/workspace-actions.ts`
- `/Users/fanda/Dev/start/src/server/workspaces/workspace-members-service.ts`

Changes:

- Delete `onOwnershipTransferred` callback path if no longer needed
- Delete optimistic owner-swap update logic
- Delete unused imports and action state branches tied to transfer flow

Expected outcome:

- no dead branches from the old model
- the code reflects one membership model only

Estimated change:

- 20-40 LoC deleted

## Suggested Scope Order

1. Server multi-owner role update
2. Server self-remove guard
3. Client self vs other split
4. Simple leave dialog in members tab
5. Delete transfer-ownership artifacts
6. Copy cleanup

This order keeps the domain model correct first, then aligns the UX, then removes dead code.

## Estimated Total LoC

### Goldilocks scope

The target scope requested here is:

- non-backward-compatible
- simple self leave dialog in members tab
- no leftover transfer-ownership artifacts

Estimated total:

- 95-160 LoC changed
- 40-70 LoC deleted
- net delta roughly 55-110 LoC

### Why this is still KISS

- one existing server service changes behavior instead of adding a new service
- one existing client component gets the self/other branch
- existing leave action is reused
- old owner-swap code is removed rather than maintained

## Acceptance Criteria

- Owner can promote another member to `owner` and remain owner
- Admin still cannot promote anyone to `owner`
- Last owner cannot be demoted
- Last owner cannot be removed
- Last owner cannot leave
- Current user never sees self as `Remove from workspace`
- Current user can leave from members management through a dedicated leave intent
- Leaving clears active workspace state and redirects safely
- No `transfer ownership` action, server flow, or optimistic update remains

## Risks To Watch

- Copy drift between general settings leave flow and members leave flow
- Accidentally leaving the general settings page with outdated owner wording
- Forgetting mobile member cards after updating only the desktop table
- Keeping dead action imports or callbacks after removing transfer flow

## Out Of Scope

- Multi-role memberships
- Invite-to-owner support
- Broader settings-shell redesign
- Reworking the general settings leave form unless copy must be aligned

## Recommended Final Shape

After the refactor, the code path should stay easy to trace:

- members page resolves current user and members
- members client component decides self vs other action rendering
- self leave uses `leaveWorkspaceAction`
- other-member removal uses `removeMemberAction`
- role changes use `changeMemberRoleAction`
- server service enforces last-owner and self-remove rules

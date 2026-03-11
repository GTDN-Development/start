# Task 03: Workspace members and ownership

## Goal
Deliver an isolated membership layer that safely manages role changes, member removal, and ownership transfer without ever allowing a zero-owner state.

## Scope
1. Implement `src/server/workspaces/workspace-members-service.ts`:
   - `listMembers(workspaceId)`
   - `changeMemberRole(workspaceId, actorUserId, targetUserId, role)`
   - `removeMember(workspaceId, actorUserId, targetUserId)`
   - `transferOwnership(workspaceId, fromUserId, toUserId)`
2. Enforce last-owner guard on the server.
3. Implement ownership transfer without transactions using the defined operation order.

## Implementation steps
1. Add actor-role authorization checks (owner-only for sensitive mutations).
2. In `changeMemberRole`, block demotion of the last owner.
3. In `removeMember`, allow self-leave and owner removal with last-owner guard.
4. Implement `transferOwnership` as:
   - promote target -> demote source
5. Never run `demote source` first.
6. If demote fails after successful promote, return `OWNERSHIP_TRANSFER_PARTIAL` and keep safe state (2 owners).
7. Ensure idempotent and retry-safe behavior.

## Acceptance criteria
1. The last owner cannot be removed or demoted.
2. `transferOwnership` cannot end with zero owners.
3. Partial failures are consistent and safe to retry.
4. Service returns stable domain error codes consumable by API/UI.

## User-visible behavior
1. Owners can change member roles and transfer ownership.
2. Users cannot accidentally leave a workspace without an owner.
3. In partial transfer failures, users get an explicit safe-state result.

## Dependencies
1. Task 01 (schema + rules).
2. Task 02 (core service + error conventions).

## Coverage of source plan
1. Section 5.2 (`workspace-members-service`)
2. Section 5.5 (Ownership transfer without transactions)
3. Section 10.4 (Idempotent race handling)

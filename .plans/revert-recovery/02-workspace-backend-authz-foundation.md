# 02. Workspace Backend Authz Foundation

Source history: `a0724e4`, rule-fix portion of `91cce2c`

Depends on: none

Skip impact: workspace authorization remains more app-owned than backend-owned, so the system stays more fragile to service-layer mistakes.

## Goal

Move coarse workspace authorization back into PocketBase rules and reintroduce the `created_by` relation so the backend can enforce ownership and membership constraints directly.

## Value

- backend denies invalid reads and writes even if app code regresses
- workspace services become simpler and easier to maintain
- current and future E2E tests validate real security boundaries, not only UI behavior

## Current Gap

Current `main` is back to the pre-revert shape:

- `apps/web/src/server/workspaces/workspace-access.ts` carries a lot of coarse access checks
- `apps/pocketbase/pb_migrations` does not contain the lost workspace authz migrations
- `workspaces.created_by` is not currently restored from the lost work

The lost backend rules covered:

- workspace create/list/view/update/delete
- invite create/list/view/update/delete
- membership create/list/view/update/delete
- owner bootstrap through `created_by`

## Scope

- add a new migration that restores the intent of `1775715571_workspace_rules_and_created_by.js`
- restore `created_by` on `workspaces`
- simplify these services so they rely on PocketBase for coarse authz and keep only domain-specific rules in app code:
- `apps/web/src/server/workspaces/workspace-general-service.ts`
- `apps/web/src/server/workspaces/workspace-members-service.ts`
- `apps/web/src/server/workspaces/workspace-invite-service.ts`
- `apps/web/src/server/workspaces/workspace-resolution-service.ts`
- reduce or remove the need for `apps/web/src/server/workspaces/workspace-access.ts`
- include the rule corrections that later appeared in `91cce2c`

## Non-goals

- invite recipient public flow decisions
- device-session rules
- workspace UX polish unrelated to backend authz

## Acceptance Criteria

- PocketBase enforces workspace membership and role boundaries directly
- workspace creation uses `created_by` as part of owner bootstrap
- app services mainly translate backend outcomes into domain responses
- destructive rule changes are delivered as new migrations only

## Validation

- restore a direct backend-authz E2E similar to the lost `workspace-rules-enforce-authz.spec.ts`
- keep current workspace E2E green, especially last-owner, ownership transfer, stale-workspace fallback, and slug-redirect behavior

## Notes

This is the main backend-hardening task. Later invite work should build on top of this instead of trying to solve invite security in isolation.


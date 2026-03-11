# Task 10: Rollout, Definition of Done, and DB hardening

## Goal
Close implementation with staged rollout, explicit Definition of Done release gates, and optional DB-level owner-invariant hardening.

## Scope
1. Define staged rollout with feature flag.
2. Define final Definition of Done checklist.
3. Define rollback procedure without impacting auth endpoints.
4. Add optional PocketBase hooks for strict DB-level owner safety.

## Implementation steps
1. Formalize implementation stages into release checklist:
   - Stage A: data + server foundation
   - Stage B: members + invites backend
   - Stage C: auth hook + overview bootstrap
   - Stage D: UI wiring
   - Stage E: hardening
2. Apply feature-flag rollout strategy:
   - deploy backend/API behind flag while UI remains static
   - enable `/overview` bootstrap + dynamic routing
   - enable settings mutations gradually (general -> members -> invites -> delete/leave)
3. Define fast rollback path:
   - disable workspace feature flag
   - revert to static workspace UI components
   - keep auth API untouched
4. Prepare final DoD checklist validating all nine source-plan DoD points.
5. Prepare optional DB hardening hooks:
   - PB `Before Update workspace_members`: block `owner -> member` if resulting owner count would be zero
   - PB `Before Delete workspace_members`: block deletion of last owner

## Acceptance criteria
1. There is a clear rollout sequence with defined activation order.
2. There is a clear rollback procedure with minimal auth risk.
3. DoD checklist is actionable as release gate and linked to test evidence.
4. Optional DB hooks provide owner-invariant safety even if service/API logic fails.

## User-visible behavior
1. Rollout happens gradually without breaking entire workspace experience at once.
2. In case of issues, workspace functionality can be quickly disabled without login outage.
3. After final rollout, users get full production workspace experience (overview, settings, members, invites) without dead-end states.

## Dependencies
1. Tasks 01-09 (finalization and release task).

## Coverage of source plan
1. Section 12 (Implementation stages)
2. Section 13 (Definition of Done)
3. Section 14 (Recommended low-risk rollout)
4. Section 15 (Nice-to-have DB hardening)

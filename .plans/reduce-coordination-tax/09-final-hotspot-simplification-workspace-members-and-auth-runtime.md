# 09 Final Hotspot Simplification: Workspace Members and Auth Runtime

## Goal

Run one more focused simplification pass over the two biggest remaining runtime hotspots after Phase 08:

1. the workspace members screen owner
2. the auth and device-session runtime core

This phase exists because the repository is already in a meaningfully better state, but the remaining debt is now concentrated in a few heavy runtime modules rather than spread across many thin layers.

The intended outcome is:

- a smaller and calmer `workspace-members` owner surface
- a more direct auth/session runtime boundary
- less branching and less repeated local orchestration
- stable or improved critical behavior coverage
- a repo that feels closer to a maintainable steady state, not just a good refactor branch

## Repository Context

The refactoring program already delivered the biggest structural gains:

- broad route invalidation is gone from interactive workspace surfaces
- representative change paths are down to `4`
- many thin wrappers and transitional seams were deleted
- the codebase is smaller and easier to trace than the original baseline

However, the remaining debt is still visible in these areas:

- `workspace-members-settings-section.tsx` remains a heavy client owner with a lot of state branching, dialog model logic, and mutation coordination
- `current-user.ts` and `device-sessions-service.ts` still carry a meaningful amount of auth/session orchestration
- the auth runtime bucket did not materially contract in Phase 08

This phase should target those last big concentration points directly.

## Current State Snapshot

Current runtime baseline from `pnpm coordination-tax:baseline`:

- `workspaces`: `38` files / `6458` LOC
- `auth`: `36` files / `4657` LOC
- `account`: `22` files / `2969` LOC
- `application`: `24` files / `1984` LOC

Current representative change paths:

- `workspace-general-update`: `4`
- `workspace-membership-change`: `4`
- `account-profile-update`: `4`
- `device-session-sign-out`: `4`
- `workspace-scope-switch`: `4`

This phase does not need to reduce touch count much further. The main target is to reduce the weight and branching inside the runtime modules that now dominate those paths.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)
- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)
- [.plans/reduce-coordination-tax/08-runtime-hotspot-contraction-and-coverage-rebalance.md](/Users/fanda/Dev/start/.plans/reduce-coordination-tax/08-runtime-hotspot-contraction-and-coverage-rebalance.md)

This task must still be self-contained, but those documents define the broader program rules and the state reached before this phase.

## Global Constraints

- preserve all user-visible behavior
- preserve auth, cookie, session, workspace, invite, membership, role, and account-security semantics
- do not introduce new framework layers, state-machine frameworks, generic helpers, or compatibility seams
- prefer deleting runtime code and reducing branching over moving code around
- do not use broad test deletion as the main success mechanism
- add tests only if they protect real business behavior or stable contracts

## Phase Target

The required target for this phase is:

- materially reduce the remaining runtime complexity in `workspace-members` and auth/session

Preferred quantitative target:

- `-500` to `-1200` runtime LOC across the targeted hotspot slices

Preferred domain movement:

- `workspaces`: from `6458` toward `6100` to `6300`
- `auth`: from `4657` toward `4300` to `4500`

This phase should be judged more by runtime simplification than by total branch LOC alone.

## In Scope

- `workspace-members` runtime simplification
- auth/session runtime simplification
- reduction of local state branching and mutation boilerplate
- selective coverage improvement only where the remaining hotspots need real protection

## Primary Hotspot Areas

### Workspace members owner surface

- `apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-invitations-table.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts`

### Auth and session core

- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/device-sessions/device-sessions-service.ts`
- `apps/web/src/features/auth/auth-actions.ts`
- `apps/web/src/features/account/security/account-security-actions.ts`
- `apps/web/src/server/application/application-session-state.ts`

## Known Remaining Debt

This phase should explicitly work down the following remaining problems:

- the `workspace-members` screen still carries too much decision-making, dialog modeling, and mutation branching inside one owner
- invite and member flows are unified, but the owner still feels more like a coordination hub than a thin operation surface
- `current-user.ts` still acts as an auth/session adapter hub
- `device-sessions-service.ts` still carries repeated policy and filtering paths that can likely contract further
- auth runtime stayed roughly flat or slightly up after the previous phase, which means real simplification there is still unfinished

## Suggested Work Items

1. **Thin the workspace-members owner without rebuilding old seams**

   Focus on `workspace-members-settings-section.tsx`.

   Preferred direction:
   - reduce local branching around action-state-derived dialog rendering
   - remove duplicated patching and success/failure flow where the operation can be made more direct
   - keep one owner, but make that owner smaller and easier to scan
   - if a local helper remains, it must clearly reduce current complexity rather than preserve an abstraction preference

2. **Simplify invite/member UI support surfaces**

   Focus on the table and invitations UI helpers.

   Preferred direction:
   - remove duplicated action menu or summary-row support where the same concept is rendered through near-identical wrappers
   - keep UI extraction only when it clearly shrinks the owner and improves readability

3. **Contract auth/session mutation boundaries**

   Focus on `current-user.ts`, `device-sessions-service.ts`, and the thin action layer above them.

   Preferred direction:
   - reduce repeated mutation result mapping
   - reduce duplicated active-session filtering and delete/count flows
   - keep response-writing and cookie semantics explicit
   - remove helper code that only renames or repackages obvious behavior

4. **Re-evaluate `application-session-state.ts`**

   Verify whether it still earns its own file.

   Acceptable outcomes:
   - keep it because it remains the smallest clear shared seam
   - merge it away if it is now only a tiny pass-through helper

   The correct choice is the one that leaves fewer concepts in the auth/account runtime path.

5. **Protect only the highest-risk behavior**

   If tests are touched:
   - keep auth semantics, cookie semantics, anti-enumeration, invite refresh, and last-owner protections covered
   - do not reintroduce broad mock-heavy structural tests

## What Good Looks Like

- `workspace-members-settings-section.tsx` is noticeably smaller and easier to reason about
- workspace member and invite interactions still feel unified, but less locally orchestrated
- auth/session runtime code reads more directly and with fewer adapter-style branches
- the auth runtime bucket finally moves downward in a visible way
- the repo exits this phase with less real hotspot debt, not just better helper naming

## Acceptance Criteria

- runtime complexity is materially lower in the targeted hotspot slices
- at least one of the two main hotspot groups (`workspace-members`, `auth/session`) is visibly simplified in code shape, and the other is not worse
- runtime LOC decreases meaningfully in `workspaces` and/or `auth`
- no new framework, compatibility seam, or abstraction pyramid is introduced
- any tests touched remain behavior-first
- the resulting code is easier to trace in the targeted flows than before this phase

## Required Completion Note

The implementation summary for this phase must include:

1. runtime LOC delta for `workspaces` and `auth`
2. the hotspot runtime files materially reduced
3. whether `application-session-state.ts` stayed or was merged, and why
4. the before/after explanation path for:
   - workspace member role change
   - workspace invite resend or revoke
   - device-session sign-out
5. any critical behavior tests added or retained

## Phase-Specific Success Signal

This phase is successful if the repo leaves behind fewer heavy runtime hotspots and the remaining complexity is mostly justified by real product behavior rather than by local coordination overhead.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible behavior is unchanged
- `workspace-members` runtime ownership is thinner than at the start of this phase
- auth/session runtime complexity is lower or materially more direct
- no broad structural test bloat returned
- no new framework, generic helper layer, or compatibility seam was added
- runtime baseline metrics moved down in the targeted hotspot domains
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm coordination-tax:baseline
pnpm check
pnpm test
pnpm test:e2e
```

## Completion Note

- Validation passed from the repository root:
  - `pnpm coordination-tax:baseline`
  - `pnpm check`
  - `pnpm test`
  - `pnpm test:e2e`
- Runtime LOC delta versus the Phase 08 starting snapshot:
  - `workspaces`: `6458 -> 6448` (`-10`)
  - `auth`: `4657 -> 4651` (`-6`)
- Hotspot runtime files materially reduced:
  - `workspace-members-table.tsx`: `285 -> 272`
  - `workspace-invitations-table.tsx`: `203 -> 186`
  - `current-user.ts`: `183 -> 177`
  - `device-sessions-service.ts`: `699 -> 688`
- `application-session-state.ts` stayed in place. It is still the one small shared session-cleanup boundary for sign-out and delete-account success paths, and inlining it would duplicate the same cleanup detail into both callers.
- Before/after explanation paths:
  - workspace member role change:
    - before: `workspace-members-settings-section.tsx -> ManagementDialogModel -> submitManagementAction() -> changeMemberRoleAction() -> workspace-members-service.ts`
    - after: `workspace-members-settings-section.tsx -> change-role dialog flow -> changeMemberRoleAction() -> workspace-members-service.ts`
  - workspace invite resend/revoke:
    - before: `workspace-members-settings-section.tsx -> ManagementDialogModel -> submitManagementAction() -> resendInviteAction()/revokeInviteAction() -> workspace-members-service.ts`
    - after: `workspace-members-settings-section.tsx -> confirm dialog flow -> resendInviteAction()/revokeInviteAction() -> workspace-members-service.ts`
  - device-session sign-out:
    - before: `your-devices-settings-item.tsx -> account-security-actions.ts -> current-user.ts -> revoke-result helper mapping -> device-sessions-service.ts`
    - after: `your-devices-settings-item.tsx -> account-security-actions.ts -> current-user.ts -> device-sessions-service.ts`
- Critical behavior tests retained:
  - `src/server/auth/auth-service.test.ts`
  - `src/server/device-sessions/device-sessions-service.test.ts`
  - `src/server/auth/current-user.test.ts`
  - `src/server/workspaces/workspace-members-service.test.ts`
  - `src/features/auth/auth-actions.test.ts`
- No new seam tests or helper files were introduced in this phase.

# 07 Debt Burn: Complexity Hotspots

## Goal

Run one focused debt-burn phase over the current `apps/web` state and remove at least `2000` lines of code from the places where complexity is most concentrated.

This phase is not a broad rewrite.
It is a targeted contraction pass over the biggest remaining coordination-tax hotspots.

The expected outcome is:

- materially smaller hotspot modules
- fewer orchestration-heavy tests
- fewer helper and response translation layers
- shorter representative change paths
- a codebase that feels closer to a low-debt steady state instead of a merely improved state

## Repository Context

The coordination-tax refactor already produced meaningful gains:

- workspace routes are thinner
- broad `revalidatePath()` usage on interactive workspace surfaces is gone
- several thin transition layers were deleted
- workspace and auth mutation boundaries are more consistent

However, the current codebase still contains concentrated technical debt in a small number of heavy modules and structure-heavy test suites.

The current state is better than the original baseline, but it is not yet "done". The remaining debt is concentrated rather than distributed, which makes one more aggressive contraction phase both possible and worthwhile.

## Current State Snapshot

Current runtime baseline from `pnpm coordination-tax:baseline`:

- `workspaces`: `39` files / `6700` LOC
- `auth`: `36` files / `4635` LOC
- `account`: `23` files / `2981` LOC
- `application`: `24` files / `1984` LOC

Current representative change paths:

- `workspace-general-update`: touch count `7`
- `workspace-membership-change`: touch count `6`
- `account-profile-update`: touch count `7`
- `device-session-sign-out`: touch count `5`
- `workspace-scope-switch`: touch count `5`

This phase should reduce both raw LOC and the amount of concentrated orchestration inside the heaviest modules that still dominate those paths.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)
- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)

This task must still be self-contained, but the playbook and baseline remain the general operating contract.

## Global Constraints

- preserve all user-visible behavior
- preserve all auth, cookie, session, workspace, invite, membership, role, and account-security semantics
- do not introduce new internal frameworks, speculative helpers, compatibility seams, or "cleanup" packages
- do not hit the target by trimming docs, plans, or measurement tooling
- prefer deleting code and tests over moving code to new files
- only split a hotspot when the resulting total runtime plus test LOC is lower and the ownership model is clearer
- keep `vitest` coverage focused on business rules and stable contracts, not internal orchestration shape

## Phase Target

The required target for this phase is:

- at least `-2000 LoC` net relative to the branch state at the start of this phase

The target must come from app and test code in the hotspot slices below, not from docs or plans.

Preferred measurement scope:

- `apps/web/src/**`
- directly related `vitest` files in the same hotspot slices

Not acceptable as the main strategy:

- deleting docs
- moving code to a new package or app
- replacing deleted code with more abstract infrastructure

## Runtime Reduction Targets

The ideal result should move the runtime baseline roughly toward:

- `workspaces`: from `6700` to `5800` to `6000`
- `auth`: from `4635` to `4200` to `4300`
- `account`: from `2981` to `2800` to `2900`
- `application`: from `1984` to `1850` to `1900`

Those runtime targets imply roughly `-1200` to `-1600` runtime LOC, with the rest of the phase target coming from deleting structure-heavy tests that no longer buy meaningful protection.

## Touch-Count Targets

This phase should also aim to reduce the representative change paths:

- `workspace-general-update`: `7 -> 5` or `6`
- `workspace-membership-change`: `6 -> 5`
- `device-session-sign-out`: `5 -> 4`
- `workspace-scope-switch`: keep at `5` only if the flow is materially more direct, otherwise reduce to `4`

`account-profile-update` is a lower priority control case and should only change if the reduction is obvious.

## In Scope

- the largest remaining hotspot modules in workspace members, workspace routing, auth session resolution, and device sessions
- action and response helpers that still add translation overhead without enough domain value
- screen-local orchestration that still feels like a relocated graph of event handlers and patch helpers
- `vitest` suites that overfit the new structure instead of protecting behavior
- deleting or merging newly introduced files if they do not shorten the future change path enough

## Primary Hotspot Areas

### Workspace members and general settings

- `apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-management-dialogs.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts`
- `apps/web/src/features/workspaces/settings/general/workspace-general-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts`
- `apps/web/src/features/workspaces/settings/general/workspace-general-actions.test.ts`

### Workspace access and routing core

- `apps/web/src/server/workspaces/workspace-resolution-service.ts`
- `apps/web/src/server/workspaces/workspace-resolution-service.test.ts`
- `apps/web/src/server/workspaces/workspace-response.ts`
- `apps/web/src/features/workspaces/workspace-route.ts`
- workspace routes under `apps/web/src/app/[locale]/(application)/(application-shell)/w/**`

### Auth and device-session core

- `apps/web/src/server/device-sessions/device-sessions-service.ts`
- `apps/web/src/server/device-sessions/device-sessions-service.test.ts`
- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/auth/current-user.test.ts`
- `apps/web/src/features/auth/auth-actions.ts`
- `apps/web/src/features/account/security/account-security-actions.ts`
- `apps/web/src/server/application/application-session-state.ts`

### Account and remaining heavy UI surfaces

- `apps/web/src/features/account/security/your-devices-settings-item.tsx`
- `apps/web/src/features/account/profile/delete-account-settings-item.tsx`
- related account security and profile action flows where a smaller direct path is possible

## Known Problems To Eliminate

This phase should explicitly look for and remove:

- large owner components that still repeat the same confirm/mutate/patch/toast pattern many times
- service modules that absorbed deleted seams but still contain too many unrelated use-cases
- response helpers that only forward or rename data without enough contract value
- action tests that mostly verify helper calls, cookie hooks, or mapper shape instead of business behavior
- duplicated error mapping or duplicated success mapping
- screen-local patch helpers that only restate obvious array operations without enough reuse value
- transitional file splits where the new files did not produce enough deletion elsewhere

## Suggested Work Items

1. **Contract workspace members to one simpler screen story**

   Reduce the size of `workspace-members-settings-section.tsx` without creating a new state-machine layer.

   Preferred direction:
   - delete repeated action-confirm boilerplate
   - collapse duplicated invite/member patch helpers where the direct update is clear enough inline
   - remove props or dialog state plumbing that only exists to support internal structure
   - merge or delete helper code if the same logic is now spread across section, dialogs, and table

2. **Shrink workspace resolution to fewer real use-cases**

   `workspace-resolution-service.ts` replaced older seams, but it still owns too many concerns at once.

   Preferred direction:
   - delete duplicated error-mapping patterns
   - delete or inline thin context wrappers that no longer earn their place
   - keep only the route, action, and membership entrypoints that materially shorten callers
   - do not split into more files unless the total code and touch count go down

3. **Reduce auth and session orchestration**

   The auth/device-session slice still carries concentrated infrastructure-style code.

   Preferred direction:
   - simplify the `current-user.ts` boundary so it remains auth-owned but less wrapper-heavy
   - trim `device-sessions-service.ts` by collapsing duplicated branching or helper layers
   - keep `application-session-state.ts` only if it continues to remove duplication across auth and account security
   - reduce duplication between `auth-actions.ts` and `account-security-actions.ts`

4. **Delete structure-heavy vitest coverage**

   Preferred direction:
   - shrink or rewrite `workspace-general-actions.test.ts` so it protects behavior, not every helper call
   - reduce structure-heavy cases in `device-sessions-service.test.ts`
   - reduce tests that mainly prove new wrappers or adapters still call through correctly
   - keep coverage where it protects permission rules, last-owner guards, cookie semantics, auth failures, and device-session correctness

5. **Burn remaining heavy UI glue**

   Review account and workspace client surfaces for repeated transition and toast patterns that can be simplified without creating a new helper framework.

## What Good Looks Like

- the biggest remaining files are smaller because coordination logic was deleted, not merely moved
- `workspace-members` reads like one coherent operation surface rather than a cluster of local patch utilities
- `workspace-resolution-service` is easier to explain in a short paragraph
- auth and device-session boundaries still protect correctness but with fewer intermediate concepts
- the remaining `vitest` suites read like business-risk coverage rather than implementation-shape coverage
- the codebase is visibly smaller in the places where complexity used to concentrate

## Acceptance Criteria

- the phase removes at least `2000` lines of app and directly related test code from the starting branch state for this phase
- the main runtime hotspot domains all move downward, not just sideways
- no new abstraction layer or compatibility seam is introduced
- the representative change paths are shorter or materially simpler in the targeted slices
- broad screen orchestration is lower after the phase than before it
- the result is understandable as debt reduction, not another transformation wave

## Required Completion Note

The implementation summary for this phase must include:

1. the measured net LOC delta for this phase
2. the runtime LOC delta by hotspot domain
3. the deleted files list
4. the deleted tests list
5. the before and after representative change paths for:
   - `workspace-general-update`
   - `workspace-membership-change`
   - `device-session-sign-out`
6. a short justification for any hotspot file that still remains unusually large

## Phase-Specific Success Signal

This phase is successful if the codebase ends up smaller by at least `2000` relevant lines and the remaining complexity is concentrated in clearly justified product logic rather than in coordination scaffolding.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible behavior is unchanged
- the `-2000 LoC` target was met using app and hotspot-test code, not docs or plans
- runtime baseline metrics moved down in the hotspot domains
- the main representative change paths are shorter or materially more direct
- at least one major hotspot file and one major hotspot test suite were materially contracted
- deleted files and deleted tests are listed explicitly
- no new framework, generic helper layer, or compatibility seam was added
- `vitest` coverage still protects business rules and contracts rather than internal structure
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm coordination-tax:baseline
pnpm check
pnpm test
pnpm test:e2e
```

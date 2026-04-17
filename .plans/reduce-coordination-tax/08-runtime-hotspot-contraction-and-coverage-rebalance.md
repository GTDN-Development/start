# 08 Runtime Hotspot Contraction and Coverage Rebalance

## Goal

Follow up after Phase 07 with a runtime-focused contraction pass that reduces the remaining concentrated technical debt in `apps/web` without relying on broad test deletion.

This phase exists because the previous debt-burn wave achieved a strong net LOC reduction, but a large share of that reduction came from deleting tests. The next step must target real runtime complexity and selectively restore missing behavior coverage where critical product semantics would otherwise be under-protected.

The intended outcome is:

- smaller remaining hotspot runtime modules
- simpler runtime ownership in the heaviest remaining flows
- fewer concentrated orchestration nodes
- restored targeted behavior coverage for critical auth and workspace semantics
- a codebase that is not just smaller, but genuinely lower-debt

## Repository Context

The repository is in a better state than the original baseline:

- route-driven workspace surfaces are shorter and more direct
- broad route invalidation on interactive surfaces is gone
- representative change paths are down to `4` in the tracked scenarios
- several thin coordination layers were deleted

However, the current state still carries meaningful technical debt in two forms:

1. **Concentrated runtime debt**
   - a few hotspot modules still absorb too much orchestration and branching
   - the biggest examples are workspace members, workspace resolution, and parts of auth/session handling

2. **Coverage debt**
   - Phase 07 removed a substantial number of tests
   - some of that deletion was good and necessary
   - some critical product semantics now need smaller, sharper replacement coverage instead of staying deleted forever

This phase must improve the runtime model first, and only then add back focused tests where they defend real behavior.

## Current State Snapshot

Current runtime baseline from `pnpm coordination-tax:baseline`:

- `workspaces`: `38` files / `6510` LOC
- `auth`: `36` files / `4636` LOC
- `account`: `22` files / `2969` LOC
- `application`: `24` files / `1984` LOC

Current representative change paths:

- `workspace-general-update`: `4`
- `workspace-membership-change`: `4`
- `account-profile-update`: `4`
- `device-session-sign-out`: `4`
- `workspace-scope-switch`: `4`

The next reduction wave should not chase touch count much further at any cost.
It should instead reduce the weight and branching inside the few modules that still dominate those paths.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)
- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)
- [.plans/reduce-coordination-tax/07-debt-burn-complexity-hotspots.md](/Users/fanda/Dev/start/.plans/reduce-coordination-tax/07-debt-burn-complexity-hotspots.md)

This task must still be self-contained, but those documents define the broader program contract and the current post-07 state.

## Global Constraints

- preserve all user-visible behavior
- preserve all auth, cookie, session, workspace, invite, membership, role, and account-security semantics
- do not meet the phase goal by deleting large blocks of tests alone
- do not introduce new framework layers, generic abstractions, or compatibility seams
- prefer direct contraction of runtime code over structural reshuffling
- only add tests where they protect product behavior, stable contracts, or risk-heavy edge cases
- if a test is added back, another glue test should usually stay deleted

## Phase Target

The required target for this phase is:

- a runtime-first simplification pass over the remaining hotspot modules

Preferred quantitative target:

- `-800` to `-1500` runtime LOC across the hotspot slices below

Test guidance:

- net test LOC may go up slightly if that increase comes from restoring critical behavior coverage
- broad test count growth is not a success signal
- any added test must replace a missing high-value contract, not reintroduce shape-testing

## Runtime Reduction Targets

The ideal result should move the runtime baseline roughly toward:

- `workspaces`: from `6510` to `5800` to `6100`
- `auth`: from `4636` to `4300` to `4500`
- `account`: from `2969` to `2850` to `2925`
- `application`: keep flat or reduce modestly if a real simplification appears

This phase is allowed to land with a small net test increase if runtime complexity goes down meaningfully and targeted behavior coverage improves.

## In Scope

- remaining runtime hotspots in workspace members, workspace access resolution, and auth/session handling
- removing repeated mutation, patching, or error-mapping branches inside heavy owner modules
- deleting helper code that is still too local or too translational to justify its own existence
- restoring focused behavior tests for critical flows where Phase 07 deleted too much protection

## Primary Hotspot Areas

### Workspace members runtime hotspot

- `apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-table.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts`
- `apps/web/src/features/workspaces/settings/members/workspace-invitations-table.tsx`

### Workspace access and routing hotspot

- `apps/web/src/server/workspaces/workspace-resolution-service.ts`
- `apps/web/src/server/workspaces/workspace-response.ts`
- `apps/web/src/features/workspaces/workspace-route.ts`

### Auth and session hotspot

- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/device-sessions/device-sessions-service.ts`
- `apps/web/src/features/auth/auth-actions.ts`
- `apps/web/src/features/account/security/account-security-actions.ts`
- `apps/web/src/server/application/application-session-state.ts`

### Coverage rebalance targets

- `apps/web/src/server/auth/auth-service.test.ts`
- `apps/web/src/server/auth/current-user.test.ts`
- `apps/web/src/server/workspaces/workspace-resolution-service.test.ts`
- `apps/web/src/features/workspaces/settings/general/workspace-general-actions.test.ts`
- route and auth tests where critical product semantics disappeared in Phase 07

## Known Remaining Debt

This phase should explicitly work down the following remaining problems:

- `workspace-members-settings-section.tsx` is still a large owner with too much branching, async handling, and dialog markup in one place
- `workspace-resolution-service.ts` is cleaner than before but still owns multiple concerns and repeated error-path semantics
- `current-user.ts` still acts as an auth/session adapter hub and can likely contract further
- `device-sessions-service.ts` is still a heavy policy and data-ops module
- some runtime simplification in Phase 07 was paid for mostly by test removal rather than by deleting enough underlying code
- critical auth and workspace semantics now rely on less explicit automated protection than they should

## What This Phase Must Not Become

Do not use this task to:

- re-inflate the test suite with broad mock-heavy shape tests
- split large files into many smaller files unless the total runtime complexity goes down
- add new generic mutation helpers, state machines, service registries, or error frameworks
- treat "moved code" as "simplified code"

## Suggested Work Items

1. **Reduce workspace-members runtime branching**

   Focus on `workspace-members-settings-section.tsx`.

   Preferred direction:
   - remove repeated confirm/mutate/error/success/update patterns
   - collapse remaining duplicated invite and member update logic
   - reduce the amount of inline dialog and patching code carried by the section
   - keep one owner, but make that owner thinner and more operation-centric

2. **Further contract workspace resolution**

   Focus on `workspace-resolution-service.ts`.

   Preferred direction:
   - reduce repeated auth failure and service failure mapping
   - keep only the route, action, and membership entrypoints that materially help callers
   - inline or merge helpers that are still too local to justify separate semantics
   - shorten the explanation path for the most common workspace access flows

3. **Simplify auth/session adapter code**

   Focus on `current-user.ts`, `device-sessions-service.ts`, and the small action layer above them.

   Preferred direction:
   - remove duplicated failure-return shapes
   - contract device-session active/expired filtering and revoke paths where the policy is repeated
   - keep response-writing semantics explicit, but remove adapter noise
   - verify whether `application-session-state.ts` is still the right seam or can be folded into a stronger owner

4. **Restore high-value behavior coverage**

   Add back only the tests that protect important semantics that appear under-covered after Phase 07.

   High-priority examples:
   - auth flows with sign-up, password reset, and email-change semantics if they no longer have direct coverage
   - workspace creation/invite listing or equivalent workspace service behavior if the prior deletions left those paths uncovered
   - any auth/workspace edge case where cookie semantics, anti-enumeration, or last-owner constraints would be risky to change without tests

5. **Keep tests sharp**

   For every test added back:
   - prove one meaningful product behavior
   - avoid asserting local helper call ordering unless the ordering is the behavior
   - avoid rebuilding deleted structural seams in test form

## What Good Looks Like

- the remaining hotspot runtime files are materially smaller
- the biggest owner modules read more like direct feature operations and less like local orchestration graphs
- auth and workspace semantics remain explicit but with fewer adapter branches
- the repo ends this phase with less runtime debt, even if the final test LOC is slightly higher than after Phase 07
- behavior coverage is stronger where risk is high and lighter where only implementation shape changed

## Acceptance Criteria

- runtime complexity is materially lower in the targeted hotspot slices
- runtime LOC decreases meaningfully in the targeted domains, especially `workspaces` and `auth`
- any test LOC increase is justified by restored critical behavior coverage
- no new framework, compatibility layer, or abstraction pyramid is introduced
- the resulting code is more direct to trace in the targeted flows than before this phase
- the repo is in a better engineering state, not merely a smaller-test state

## Required Completion Note

The implementation summary for this phase must include:

1. the runtime LOC delta by hotspot domain
2. the list of hotspot runtime files materially contracted
3. the list of critical behavior tests restored or added back
4. the list of low-value tests kept deleted
5. a short explanation of why the resulting balance between runtime size and coverage is better than after Phase 07

## Phase-Specific Success Signal

This phase is successful if the repo exits with less real runtime debt and a better balance of coverage, rather than simply with fewer lines because many tests were deleted.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible behavior is unchanged
- runtime hotspot modules are smaller and simpler than at the start of this phase
- the phase did not depend mainly on deleting tests to look successful
- any added tests protect real business behavior or contracts
- any remaining deleted tests were low-value glue or shape tests
- runtime baseline metrics moved down in the targeted domains
- no new framework, generic helper layer, or compatibility seam was added
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm coordination-tax:baseline
pnpm check
pnpm test
pnpm test:e2e
```

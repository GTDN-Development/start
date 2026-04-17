# 10 Auth Resolution API Unification and Device-Session Boundary Cleanup

## Goal

Run one more narrow auth-runtime simplification pass after Phase 09, focused on two specific problems:

1. unifying the auth resolution API into one clearer server-facing contract
2. reducing the remaining coordination burden inside the device-session runtime owner

This phase should not broaden back out into workspace or UI restructuring.
It exists to finish the part of the auth/runtime cleanup that still feels heavier than necessary even after the major contraction phases already landed.

## Repository Context

The refactoring program already removed most of the broad structural waste:

- route-level coordination is lower
- representative change paths are down to `4`
- many transitional wrappers and compatibility seams are gone
- workspace routing and screen ownership are in a better steady state

However, auth/runtime still carries a specific kind of remaining debt:

1. **parallel auth resolution contracts**
   - render-time auth resolution and writable auth resolution are still modeled as sibling flows with different result shapes
   - callers still have to understand more than one way to describe "current authenticated user"
   - `current-user.ts` still translates one auth/runtime model into another

2. **an overloaded device-session owner**
   - `device-sessions-service.ts` still combines inventory reads, validation, revoke flows, heartbeat updates, cleanup, eviction policy, and cookie-adjacent orchestration
   - this is a legitimate product boundary, but it is still too concentrated in one runtime surface

Phase 09 improved this area only modestly. Its completion note recorded:

- `auth`: `4657 -> 4651` (`-6`)
- `device-sessions-service.ts`: `699 -> 688`
- `current-user.ts`: `183 -> 177`

That means the remaining auth debt is no longer primarily about deleting wrappers in bulk.
It is now about clarifying one last runtime contract and tightening one last hotspot owner.

## Current State Snapshot

Current runtime baseline from `pnpm coordination-tax:baseline`:

- `workspaces`: `38` files / `6448` LOC
- `auth`: `36` files / `4651` LOC
- `account`: `22` files / `2969` LOC
- `application`: `24` files / `1984` LOC

Current representative change paths:

- `workspace-general-update`: `4`
- `workspace-membership-change`: `4`
- `account-profile-update`: `4`
- `device-session-sign-out`: `4`
- `workspace-scope-switch`: `4`

This phase should not chase touch-count reduction much further.
The target is to make the `auth` slice materially easier to read, trace, and change while keeping those paths stable.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)
- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)
- [.plans/reduce-coordination-tax/02-auth-and-device-sessions-core.md](/Users/fanda/Dev/start/.plans/reduce-coordination-tax/02-auth-and-device-sessions-core.md)
- [.plans/reduce-coordination-tax/09-final-hotspot-simplification-workspace-members-and-auth-runtime.md](/Users/fanda/Dev/start/.plans/reduce-coordination-tax/09-final-hotspot-simplification-workspace-members-and-auth-runtime.md)

This task must remain self-contained, but it should explicitly inherit the earlier rule that device sessions stay part of the auth boundary rather than being split into a fake platform layer.

## Global Constraints

- preserve all user-visible auth, cookie, session, account-security, and device-limit semantics
- preserve the current split between render-time read-only checks and response-writing mutation boundaries
- do not weaken sign-in, sign-out, password reset, email change, or session invalidation behavior
- keep session truth explicit even though it is distributed across `pb_auth`, `pb_auth_persist`, and `app_device_session`
- do not introduce a new generic result framework, error framework, state-machine layer, or compatibility seam
- do not split `device-sessions-service.ts` unless the result is clearly easier to reason about than the single-file version
- if a file split happens, it must reduce conceptual hops for a real workflow rather than merely lower one file's LOC
- preserve or improve behavior-focused tests around writable auth resolution, device-session validation, and device revocation semantics

## Phase Target

The required target for this phase is:

- one clearer auth resolution contract for server callers
- a thinner auth/session adapter layer
- a more manageable device-session runtime owner

Preferred quantitative target:

- `-150` to `-500` runtime LOC in the `auth` slice

Preferred domain movement:

- `auth`: from `4651` toward `4400` to `4550`
- `workspaces`, `account`, and `application`: stay flat except for incidental caller cleanup

This phase should be judged primarily by contract simplification and hotspot ownership clarity, not by whether the representative change path drops below `4`.

## In Scope

- unifying server auth resolution contracts
- reducing translation layers between auth resolution, `current-user.ts`, and callers
- tightening the ownership model inside the device-session runtime
- deleting repeated result mapping, filtering, and policy branches where they no longer add domain value
- selective caller cleanup where the new auth contract removes obvious adapter code
- targeted auth/session behavior tests if they are needed to protect the narrowed runtime model

## Primary Target Areas

### Auth resolution core

- `apps/web/src/server/auth/auth-user-resolution.ts`
- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/pocketbase/pocketbase-server.ts`

### Device-session runtime boundary

- `apps/web/src/server/device-sessions/device-sessions-service.ts`
- `apps/web/src/server/device-sessions/device-sessions-types.ts`
- `apps/web/src/server/device-sessions/device-sessions-cookie.ts`

### Thin caller cleanup

- `apps/web/src/features/auth/auth-actions.ts`
- `apps/web/src/features/account/security/account-security-actions.ts`
- `apps/web/src/server/application/application-session-state.ts`
- `apps/web/src/server/workspaces/workspace-resolution-service.ts`

Caller cleanup is in scope only where it directly benefits from the unified auth contract.
This phase must not turn back into a broader workspace rewrite.

## Known Remaining Debt

This phase should explicitly work down the following remaining problems:

- `resolveRenderAuthenticatedUser()` and `resolveWritableAuthenticatedUser()` describe closely related auth facts through different result shapes and partially duplicated flow
- writable auth resolution, render auth resolution, and `current-user.ts` still force callers to understand more than one representation of auth success and auth failure
- `current-user.ts` still acts partly as a translation hub instead of only as the smallest useful app-facing auth owner
- `createPocketBaseServerClient()` still returns a mixed bootstrap bundle that callers re-interpret differently
- `device-sessions-service.ts` still owns too many responsibilities at once for one runtime owner
- `validateDeviceSessionOrInvalidate()` still mixes validation, cleanup, heartbeat, and cookie-clearing consequences into one dense path
- active-session inventory, revocation, and eviction logic are still harder to scan than they should be for a product boundary that is otherwise conceptually simple

## What This Phase Must Not Become

Do not use this task to:

- invent a generic auth runtime framework
- split device sessions into `store`, `manager`, `policy`, `guard`, `adapter`, and `facade` layers
- create a "universal result" type used across unrelated domains
- widen the phase into workspace access redesign or account page restructuring
- change device-limit behavior, current-device protections, or remember-me semantics in the name of cleanup

The correct outcome is fewer concepts and clearer ownership, not more named pieces.

## Suggested Work Items

1. **Define one primary auth resolution contract**

   Focus on `auth-user-resolution.ts`.

   Preferred direction:
   - define one dominant result model for server-side auth resolution
   - keep read vs write behavior explicit, but model them as variants of the same ownership surface rather than as loosely parallel APIs
   - reduce duplicated bootstrap, auth-store, and failure-mapping work
   - make it possible for callers to reason about auth status without translating between multiple unions

2. **Thin `current-user.ts` down to true app-facing meaning**

   Focus on `current-user.ts`.

   Preferred direction:
   - keep it only for app-facing operations that genuinely add meaning
   - remove or collapse result translation that merely repackages auth-resolution output
   - keep the device-session list and revoke flows easy for action callers to use without preserving extra adapter ceremony

3. **Re-cut the device-session runtime boundary**

   Focus on `device-sessions-service.ts`.

   Preferred direction:
   - contract repeated inventory, revoke, and delete/count logic
   - separate responsibilities only if the split is real and low-hop
   - acceptable outcomes:
     - a materially smaller single file
     - or a split into a very small number of feature-owned modules with obvious responsibilities

   Acceptable split directions if needed:
   - inventory and CRUD operations
   - policy logic such as expiry, heartbeat, and oldest-session eviction

   Unacceptable split directions:
   - many tiny helper files
   - generic managers, registries, or abstraction pyramids

4. **Keep cookie semantics explicit but less repetitive**

   Focus on the boundary between `pocketbase-server.ts`, `device-sessions-cookie.ts`, and auth resolution.

   Preferred direction:
   - keep response-writing cookie semantics obvious
   - reduce repeated clear/export combinations where they no longer need multiple translation steps
   - do not hide cookie mutation rules behind generic abstractions

5. **Protect the highest-risk auth/session behaviors**

   If tests are touched:
   - preserve coverage for invalid-session cleanup semantics
   - preserve coverage for remember-me vs session-only behavior
   - preserve coverage for current-device revoke protection
   - preserve coverage for oldest-device eviction when the active-session cap is exceeded
   - preserve coverage for the difference between read-only render checks and writable auth resolution

## What Good Looks Like

- server callers can reason about auth through one clear contract instead of parallel result models
- read-only and writable auth resolution still differ where they need to, but the boundary reads like one coherent owner
- `current-user.ts` is either smaller or more obviously justified
- `device-sessions-service.ts` is no longer the place where every auth/session concern gets bundled together
- the device-session sign-out path is easier to trace even if its touch count stays at `4`
- the auth runtime bucket finally moves downward in a visible way, or at minimum becomes meaningfully more direct without adding new concepts

## Acceptance Criteria

- user-visible auth and device-session behavior is unchanged
- the auth/runtime layer exposes one clear primary auth resolution contract
- duplicated auth bootstrap and failure translation are materially reduced
- `current-user.ts` is thinner or more clearly justified as an app-facing owner
- `device-sessions-service.ts` is materially simpler, either by contraction in place or by a justified low-hop split
- any file split demonstrably reduces conceptual complexity for at least one representative auth or device-session workflow
- no new framework, generic helper layer, or compatibility seam is introduced
- runtime LOC decreases meaningfully in the `auth` slice, or the completion note explains why a smaller conceptual model was achieved without a large LOC drop
- tests that remain or are added are behavior-first and defend real auth/session semantics

## Required Completion Note

The implementation summary for this phase must include:

1. runtime LOC delta for the `auth` slice
2. which auth resolution entrypoints remained after the phase
3. whether `device-sessions-service.ts` stayed as one file or was split, and why
4. the before/after explanation path for:
   - writable auth resolution
   - device-session sign-out
   - session-cap eviction of the oldest non-current device
5. the auth/session tests retained, deleted, or added

## Phase-Specific Success Signal

This phase is successful if auth no longer feels like the same runtime fact described through several overlapping result models, and if device-session behavior stays explicit without one oversized orchestration file carrying the whole burden.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible auth, cookie, and device-session behavior is unchanged
- one clear auth resolution contract exists for server callers
- `current-user.ts` no longer acts mainly as a translation hub
- `device-sessions-service.ts` is smaller or clearly better partitioned
- any new partitioning reduced conceptual hops instead of creating them
- no generic runtime framework, result layer, or compatibility seam was added
- runtime baseline metrics moved down in the `auth` slice, or the task notes justify why a flatter LOC result still produced a simpler steady state
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm coordination-tax:baseline
pnpm check
pnpm test
pnpm test:e2e
```

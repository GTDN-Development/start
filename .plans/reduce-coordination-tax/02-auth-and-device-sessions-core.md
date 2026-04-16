# 02 Auth and Device Sessions Core

## Goal

Refactor the auth and device-session core so the identity boundary is simpler, more cohesive, and easier for the rest of the app to rely on.

This phase should reduce coordination tax around session resolution, auth mutation flow, current-user guards, and auth client wrappers.

## Repository Context

In this codebase, device sessions are not a separate product domain. They are part of the auth boundary and need to be treated that way.

Auth correctness is one of the strongest parts of the repository today and must be preserved. At the same time, the current implementation includes wrapper code and multi-hop flows that make feature changes more expensive than necessary.

This phase must simplify the auth core without weakening:

- session correctness
- cookie behavior
- device-session validation
- sign-in and sign-out semantics
- password reset and email-change safety

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

## Global Constraints

- preserve all user-visible auth behavior
- preserve all auth, cookie, and device-session semantics
- do not move side effects into render-time code
- do not split device sessions out into a fake separate platform layer
- prefer fewer, clearer boundaries over more helper files
- preserve or improve behavior-focused test coverage around auth and session flows

## In Scope

- auth session flow
- current-user and writable-user guard usage
- device-session contracts and orchestration
- auth client wrappers that only forward to actions
- session resolution surfaces used by the rest of the app

## Primary Target Areas

- `apps/web/src/server/auth/**`
- `apps/web/src/server/device-sessions/**`
- `apps/web/src/features/auth/auth-actions.ts`
- `apps/web/src/features/auth/auth-client.ts`
- `apps/web/src/features/account/security/device-session-actions.ts`

## Out of Scope

- workspace access resolution
- workspace route model
- workspace settings screens
- marketing or legal surfaces

## Required Deliverables

1. A cleaner auth boundary with fewer translation layers.
2. Simpler relationships between:
   - server auth services
   - auth actions
   - auth client wrappers
   - device-session operations
3. Reduced wrapper code where functions only forward or rename behavior without adding domain value.

## What Good Looks Like

- auth client calls are easier to trace end to end
- current-user and writable-user boundary responsibilities are clearer
- device-session behavior remains correct but easier to reason about
- response and cookie semantics stay explicit
- this phase leaves workspace and account phases with a cleaner auth foundation

## Suggested Work Items

- identify auth wrappers that add no domain meaning
- reduce pass-through action and client code
- simplify session-resolution entrypoints where possible
- keep a strong distinction between read-only render checks and response-writing mutation boundaries
- trim tests that only assert obsolete adapter structure while preserving real auth behavior coverage

## Acceptance Criteria

- auth and device-session behavior is unchanged from a user perspective
- the end-to-end change path through auth is shorter or clearer than before
- wrapper and adapter count is materially reduced
- device sessions remain firmly integrated with auth rather than fragmented
- the final phase diff is net smaller in LOC than the baseline for this slice

## Phase-Specific Success Signal

This phase is successful if later phases can depend on auth as a simpler, stable core rather than having to navigate many intermediate wrappers.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible auth and device-session behavior is unchanged
- the auth and session flows have one clear ownership model and fewer intermediate translations
- the old change path and new change path are written down for at least one representative auth or device-session workflow
- at least one obsolete wrapper, adapter, or duplicate path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover real session, cookie, sign-in, sign-out, and security behavior
- docs were updated if the auth or session model changed materially
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

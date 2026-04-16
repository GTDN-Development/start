# 01 Shared Mutation Boundaries

## Goal

Reduce coordination tax by unifying the mutation boundary pattern across `apps/web`.

This phase should shrink duplicated action boilerplate and clarify how input validation, cookie finalization, response shaping, and route invalidation are handled.

## Repository Context

The current codebase repeats the same mutation pattern in multiple domains:

- validate input
- call a server service
- apply auth cookies or response metadata
- map the service payload into a client-facing shape
- sometimes revalidate a route

This pattern appears across auth, account, and workspace actions and creates unnecessary glue code. Later phases will be much harder if this boundary remains inconsistent.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

## Global Constraints

- preserve all product behavior
- do not weaken auth or cookie semantics
- do not introduce a generic framework layer
- prefer direct helpers over abstraction pyramids
- any shared helper introduced here must remove real duplication immediately
- any old mutation path replaced in this phase must be deleted by the end of the phase

## In Scope

- repeated action finalization patterns
- repeated bad-request response helpers
- repeated cookie-finalization calls
- repeated payload mapping that adds no domain value
- repeated route invalidation patterns where policy can be made explicit

## Primary Target Areas

- `apps/web/src/features/auth/*actions*.ts`
- `apps/web/src/features/account/**/*actions*.ts`
- `apps/web/src/features/workspaces/**/*actions*.ts`
- `apps/web/src/server/auth/auth-response.ts`
- related response and cookie boundary helpers

## Out of Scope

- deep auth flow redesign
- deep workspace access redesign
- UI ownership changes on screens
- repository restructuring

## Required Deliverables

1. A cleaner and more consistent mutation-boundary pattern across the affected domains.
2. Reduced duplication in:
   - bad request helpers
   - finalize response helpers
   - cookie-commit flows
   - trivial payload mapping
3. Explicit rules for when route invalidation is allowed versus when a screen should rely on local state ownership in later phases.

## What Good Looks Like

- action files become smaller and more direct
- shared helpers only exist where they remove meaningful repetition
- auth-style and workspace-style action handling feel consistent
- wrapper functions that add no meaning are removed
- the code becomes easier to refactor further in later phases

## Suggested Work Items

- identify all repeated `createBadRequestResponse()` patterns
- identify all repeated finalize-and-map patterns
- identify payload maps that only rename or forward fields
- converge on one response finalization pattern per response family
- make revalidation policy explicit instead of incidental

## Acceptance Criteria

- duplicated mutation boilerplate is materially reduced
- no runtime behavior changed
- no auth or cookie behavior regressed
- later phases can reuse a consistent boundary instead of inventing their own
- the final phase diff is net smaller in LOC than the baseline for this slice

## Phase-Specific Success Signal

This phase is successful if later feature refactors no longer need to first clean up repeated action glue before addressing real feature complexity.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible behavior for the affected auth, account, and workspace actions is unchanged
- the mutation boundary pattern is more consistent and easier to trace than before
- the old change path and new change path are written down for at least one representative action flow
- at least one obsolete wrapper, mapper, or duplicate finalize path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover real cookie, auth, and response behavior instead of obsolete action glue
- docs were updated if the mutation-boundary rules or shared patterns changed
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

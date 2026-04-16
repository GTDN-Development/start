# 06 Final Contraction Pass

## Goal

Complete the refactoring program with a final contraction pass that turns the current state from "recomposition" into clear reduction.

This phase exists to ensure the end result is not merely a redistribution of orchestration across new modules, tests, or screen state helpers.

The intended outcome is a codebase that is measurably simpler than the pre-refactor baseline:

- fewer files
- fewer layer hops
- fewer translation helpers
- fewer orchestration-heavy tests
- a clearly negative final diff

## Repository Context

The earlier phases removed several thin layers and improved ownership boundaries, but the current working tree still contains signs of recomposed complexity:

- new modules that may only wrap or rename existing logic
- larger screen or service files that may contain moved orchestration rather than deleted orchestration
- new `vitest` tests that may protect structure instead of business behavior

This phase is not a redesign phase.
It is a contraction phase.

The goal is to preserve the architecture gains of the refactor while deleting whatever remains unnecessary in the new shape.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

This task must still be understandable on its own, but the playbook remains the primary source of the overall operating model.

## Global Constraints

- preserve all user-visible behavior
- preserve all auth, session, workspace, invite, membership, and account-security semantics
- do not introduce new internal frameworks, generic helpers, or compatibility layers
- prefer deleting or merging code over moving it again
- if a new file does not clearly shorten the future change path, delete it or fold it into a better owner
- keep one clear owner per mutable screen or workflow
- keep `vitest` focused on business rules and stable contracts rather than orchestration structure

## In Scope

- final contraction of newly introduced wrapper or translation modules
- final contraction of newly introduced screen state helpers
- final contraction of response helpers that add little domain value
- final contraction of tests that assert structure instead of behavior
- final audit of remaining hotspot files that may still hold moved orchestration

## Primary Target Areas

- `apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/members/workspace-members-screen-state.ts`
- `apps/web/src/features/workspaces/settings/members/workspace-members-screen-state.test.ts`
- `apps/web/src/server/workspaces/workspace-resolution-service.ts`
- `apps/web/src/server/workspaces/workspace-response.ts`
- `apps/web/src/server/device-sessions/device-sessions-service.ts`
- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/application/application-session-state.ts`
- `apps/web/src/server/application/application-session-state.test.ts`
- `apps/web/src/features/account/security/delete-account-settings-item.tsx`
- `apps/web/src/features/workspaces/settings/general/workspace-general-settings-section.tsx`
- `apps/web/src/features/workspaces/settings/general/workspace-general-settings-contract.ts`

## Out of Scope

- product redesign
- new feature development
- E2E redesign
- introducing broader architectural patterns beyond what is needed to finish contraction

## Required Deliverables

1. A final contraction pass over the current uncommitted refactor state.
2. Removal or merging of any new files that do not create a meaningfully shorter future change path.
3. A review and reduction of new `vitest` tests that only defend structure, glue, or forwarding behavior.
4. A short written summary of:
   - the old change path
   - the final change path
   - deleted files
   - deleted wrappers, mappers, helpers, or tests
   - final net LOC delta

## What Good Looks Like

- `workspace-members` no longer feels like old orchestration moved into a larger owner
- new response or session-state helpers exist only if they carry real contract value
- the runtime flow is easier to trace without opening extra translation files
- `vitest` protects business behavior, not new intermediate structure
- the final repository state is clearly smaller and calmer than the pre-refactor baseline

## Suggested Work Items

- review each newly introduced file and ask whether it shortens the future change path or only renames it
- merge or delete response helpers that only adapt payloads without real domain value
- merge or delete screen-state helpers that only preserve transitional structure
- tighten large screen modules if they still encode too much orchestration rather than direct operation flow
- remove tests that only prove a deleted or internal orchestration model
- keep only tests that protect business rules, access rules, session rules, and stable feature contracts

## Acceptance Criteria

- the final diff against `HEAD` is net negative
- runtime code is net negative or very close to flat with explicit justification
- the `vitest` suite is not larger only because the refactor introduced new structural seams
- the main hotspot flows have fewer layer hops than before the refactor
- no primary hotspot still reads like the old coordination tax relocated into a new module
- the final result is understandable as simplification, not another architectural transition

## Phase-Specific Success Signal

This phase is successful if the refactoring program can stop here and the final codebase genuinely feels smaller, more direct, and cheaper to change than the original baseline.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible behavior is unchanged
- each refactored mutable screen or workflow has one clear owner
- the old change path and the final change path are written down for the most important hotspot flows
- at least one newly introduced wrapper, mapper, response helper, screen-state helper, or structure-only test was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds
- `vitest` coverage still protects business rules and contracts rather than obsolete or internal orchestration shape
- docs were updated if the final architecture meaningfully changed from the earlier playbook assumptions
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

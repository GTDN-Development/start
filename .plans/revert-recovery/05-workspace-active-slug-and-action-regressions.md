# 05. Workspace Active Slug And Action Regressions

Source history: `4b512c1`

Depends on: none

Skip impact: the app can silently switch the active workspace cookie during unrelated workspace edits, and the action layer stays under-tested.

## Goal

Fix active workspace cookie handling around workspace rename and add focused action tests so the bug does not come back.

## Value

- prevents accidental workspace context switches
- makes workspace settings actions safer to refactor
- catches regressions close to the server-action boundary instead of only through E2E

## Current Gap

The lost commit `4b512c1` added a missing regression test around active workspace slug handling.

Current `main` still contains the risky behavior in `apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts`:

- it updates the active workspace cookie whenever the current cookie value differs from the new slug
- that can incorrectly switch the active workspace when a user renames a different workspace

The lost unit test file `workspace-general-actions.test.ts` is also still missing.

## Scope

- fix active workspace cookie logic for workspace rename and metadata updates
- add focused server-action tests around:
- renaming the active workspace
- renaming a non-active workspace
- metadata-only updates
- absence of an active workspace cookie

## Non-goals

- broader workspace routing refactors
- backend authz changes

## Acceptance Criteria

- renaming the active workspace updates the active workspace cookie
- renaming a different workspace does not switch the user’s active workspace
- metadata-only edits do not rewrite the active workspace cookie
- the action layer has direct regression coverage for these cases

## Validation

- restore a test file equivalent in intent to the lost `workspace-general-actions.test.ts`
- keep workspace E2E green, especially slug-redirect and stale-active-workspace fallback coverage

## Notes

This is a small, high-signal task. It is a good candidate when you want a contained fix with clear user value and low coordination cost.


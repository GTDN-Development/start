# 04 Workspace Screens and Application Surfaces

## Goal

Remove the highest coordination-tax screen patterns in workspace-facing application surfaces.

This is expected to be the highest-payoff phase in the entire program. The target is to simplify the real interactive screens where server snapshots, local client state, actions, and route invalidation currently overlap.

## Repository Context

The workspace domain contains legitimate product complexity:

- members
- roles
- invites
- ownership guards
- workspace creation and deletion
- scope switching

That business complexity should remain. What should be reduced is implementation overhead around:

- duplicated state ownership
- action-heavy orchestration
- route invalidation mixed with local patching
- multi-file screen flows

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

## Global Constraints

- preserve all workspace product behavior
- preserve all membership, invite, and ownership rules
- keep one state owner per screen
- do not keep both local patching and broad route invalidation for the same interaction surface
- do not replace duplicated flows with a new generic abstraction layer
- preserve critical workspace tests and runtime correctness

## In Scope

- workspace general settings surfaces
- workspace members and invites surfaces
- related application surfaces where workspace interactions are tightly coupled
- scope switcher follow-up where required by the new ownership model

## Primary Target Areas

- `apps/web/src/features/workspaces/settings/general/**`
- `apps/web/src/features/workspaces/settings/members/**`
- relevant workspace pages under `apps/web/src/app/**`
- `apps/web/src/features/application/scope-switcher.tsx` where directly affected

## Out of Scope

- deep auth redesign
- deep workspace access redesign beyond what this phase needs
- account/profile cleanup outside shared patterns discovered here

## Required Deliverables

1. Simpler screen ownership for the main workspace settings surfaces.
2. Removal of mixed patterns where the same screen both owns local state and relies on broad route invalidation.
3. Fewer screen-level orchestration files or materially simpler orchestration where files remain.

## What Good Looks Like

- members and invites screens are easier to trace
- settings screens touch fewer files per change
- client-owned screens patch local state cleanly without redundant route invalidation
- route files hand off coherent models and stop performing excess orchestration
- workspace UI work becomes cheaper after this phase

## Suggested Work Items

- choose and enforce one ownership model per workspace screen
- remove duplicated member and invite state paths
- collapse wrappers and mappers that only adapt to the old orchestration model
- trim tests that only prove deleted orchestration structure

## Acceptance Criteria

- workspace members, invites, and general settings behavior is preserved
- state ownership is explicit and singular on the refactored screens
- the feature change path for workspace UI is materially shorter
- a significant amount of obsolete glue is deleted
- the final phase diff is net smaller in LOC than the baseline for this slice

## Phase-Specific Success Signal

This phase is successful if workspace feature work becomes visibly cheaper and less spread across route, action, and server translation layers.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible workspace settings and application-surface behavior is unchanged
- each refactored screen has one explicit state owner
- the old change path and new change path are written down for at least one representative workspace screen flow
- at least one obsolete orchestration layer, wrapper, mapper, or duplicate state path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover real membership, invite, ownership, and settings behavior
- docs were updated if the workspace screen model changed materially
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

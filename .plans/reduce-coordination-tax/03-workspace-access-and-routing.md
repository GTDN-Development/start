# 03 Workspace Access and Routing

## Goal

Refactor workspace access resolution and routing decisions so that auth handoff, access checks, active workspace behavior, and invite-related route decisions form one coherent access layer.

This phase should reduce coordination tax in the path between identity, workspace eligibility, and route outcomes.

## Repository Context

Workspaces are the heaviest domain in the app. A large share of their complexity is legitimate, but the current access and routing path is spread across multiple helpers and intermediate modules.

This phase should simplify the path through:

- pending invite handling
- active workspace preference
- post-auth destination resolution
- workspace membership access checks
- route loader decisions

The goal is not to make workspaces "small". The goal is to make workspace access and routing easier to trace and less distributed.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

## Global Constraints

- preserve all workspace access semantics
- preserve auth-to-workspace handoff correctness
- preserve cookie boundary rules
- preserve route behavior for invalid, missing, or unauthorized workspaces
- do not introduce a generic access framework
- do not move cookie mutation into render-time code

## In Scope

- workspace access resolution
- active workspace cookie reading and policy
- pending invite routing and post-auth routing
- workspace membership resolution helpers
- route-level workspace loading decisions

## Primary Target Areas

- `apps/web/src/server/workspaces/workspace-resolution-service.ts`
- `apps/web/src/server/workspaces/workspace-auth-context.ts`
- `apps/web/src/server/workspaces/workspace-membership-context.ts`
- related route handlers and route loaders under `apps/web/src/app/**`

## Out of Scope

- workspace members screen ownership refactor
- workspace settings UI orchestration
- account/profile cleanup
- generic repository cleanup outside workspace access needs

## Required Deliverables

1. A clearer and more cohesive access-resolution model for workspace routing.
2. Reduced fragmentation between auth handoff, workspace access checks, and route outcomes.
3. Fewer unnecessary hops between route, access helper, and resolution service.

## What Good Looks Like

- route decisions are easier to follow
- access-related server code is consolidated around use-cases instead of thin intermediate layers
- active workspace and invite flows remain correct but less scattered
- future changes to workspace route behavior require touching fewer files

## Suggested Work Items

- reduce overlap between access and resolution helpers
- collapse purely translational helpers when they add no semantic value
- keep repository helpers low-level and move route-specific shaping upward
- simplify route loader flows where they currently gather too many domain concerns

## Acceptance Criteria

- invite and active-workspace flows still behave correctly
- invalid and unauthorized workspace routing still behaves correctly
- access logic is easier to trace from route entrypoint to outcome
- layer count in the workspace access path is materially reduced
- the final phase diff is net smaller in LOC than the baseline for this slice

## Phase-Specific Success Signal

This phase is successful if workspace screens in the next phase can depend on a simpler and more predictable access layer.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible workspace access and routing behavior is unchanged
- the workspace access path is easier to trace from route entrypoint to outcome
- the old change path and new change path are written down for at least one representative access or invite-routing workflow
- at least one obsolete layer hop, wrapper, or duplicate access helper path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover invite, active-workspace, invalid-workspace, and unauthorized-workspace behavior
- docs were updated if the workspace access or route model changed materially
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

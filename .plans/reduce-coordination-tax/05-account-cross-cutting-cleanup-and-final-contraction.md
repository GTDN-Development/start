# 05 Account, Cross-Cutting Cleanup, and Final Contraction

## Goal

Finish the refactoring program by cleaning up the remaining cross-cutting coordination tax, especially in account-related screens and remaining wrapper-heavy or purity-breaking areas.

This phase should also remove temporary compatibility code left behind by earlier phases and ensure the final codebase feels internally coherent.

## Repository Context

After the earlier phases, the remaining debt should be concentrated in:

- account/profile/security surfaces
- redundant wrappers and aliases not already removed
- config purity problems
- leftover compatibility layers
- tests that still assert obsolete orchestration details

This phase is where the program should fully contract. The final repository state after this phase should clearly "play together" as one model rather than a mix of old and new patterns.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)

## Global Constraints

- preserve all user-visible behavior
- preserve critical account and security semantics
- keep behavior tests where they protect real product risk
- remove temporary migration code rather than freezing it in place
- keep config and shared layers clean and low-level
- prefer deletion and contraction over further abstraction

## In Scope

- account profile screens and related action flows
- account security screens and related orchestration
- config purity fixes
- redundant alias and wrapper cleanup
- obsolete glue-heavy tests
- doc updates needed to reflect the final model

## Primary Target Areas

- `apps/web/src/features/account/**`
- `apps/web/src/config/**`
- any leftover wrapper-heavy helper or action files
- obsolete or glue-heavy tests across affected domains

## Out of Scope

- large new architectural changes
- new feature development
- introduction of new compatibility layers

## Required Deliverables

1. A final cleanup pass over remaining coordination-heavy areas.
2. Removal of temporary migration scaffolding left by earlier phases.
3. A codebase that reads as one coherent architecture instead of a partially completed transition.

## What Good Looks Like

- account-related flows are simpler and more consistent with the rest of the refactored app
- config files no longer depend on feature-layer details where that dependency is avoidable
- wrapper and alias cleanup materially reduces noise
- tests align with the final architecture instead of the old one
- subsystem docs reflect the final model where needed

## Suggested Work Items

- simplify account/profile/security action and UI orchestration where still redundant
- clean up config imports that violate intended ownership direction
- remove pass-through wrappers and aliases that survived earlier phases
- delete tests that only validate obsolete glue behavior
- update docs to match the final state of the architecture

## Acceptance Criteria

- no temporary migration layers remain without a strong reason
- the final architecture is internally consistent across auth, workspace, account, and application surfaces
- behavior remains unchanged from a user perspective
- the final phase diff is net smaller in LOC than the baseline for this slice
- the overall program ends with a visibly smaller and simpler codebase than it started with

## Phase-Specific Success Signal

This phase is successful if the refactoring program can stop here without leaving obvious old-pattern pockets behind.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- user-visible account, security, and cross-cutting behavior is unchanged
- the remaining account and cleanup flows follow the same simpler model established in earlier phases
- the old change path and new change path are written down for at least one representative account or security workflow
- at least one obsolete wrapper, alias, compatibility layer, or duplicate path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover real account, security, and final integrated behavior
- docs were updated to reflect the final architecture where the model changed
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

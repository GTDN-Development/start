# 00 Guardrails and Metrics

## Goal

Create the baseline and guardrails for the coordination-tax reduction program in `apps/web` before structural code changes begin.

This phase exists to make later refactors more effective, more reviewable, and less likely to just move complexity around.

## Repository Context

This repository is a pre-launch starter template. The goal is to improve the baseline before real downstream projects depend on it.

The current codebase is generally healthy, but `apps/web` pays too much for orchestration cost across:

- route files
- feature surfaces
- server actions
- service modules
- access/context helpers
- local client state mirrors
- route invalidation

The main anti-pattern to control is this repeated flow:

1. route loads a server snapshot
2. feature mirrors that snapshot into client state
3. action validates input and forwards to a service
4. service resolves through context or repository helpers
5. UI locally patches state and also invalidates route state

This phase should not try to fix all of that. It should define the operating rules for the phases that follow.

## Use With

- [.docs/refactoring-playbook.md](/Users/fanda/Dev/start/.docs/refactoring-playbook.md)
- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)

This task must still be understandable on its own, but the playbook is the primary source of general program rules.
The checked-in Phase 0 contract and metric snapshot now live in the baseline doc.

## Global Constraints

- preserve all user-visible behavior
- do not introduce new internal frameworks, packages, or generic abstractions
- keep route/server boundary rules explicit
- render-time server code remains read-only
- cookie writes and side-effectful redirects remain in response-writing boundaries only
- prefer deleting bad patterns over preserving them for compatibility
- do not start feature rewrites in this phase

## In Scope

- define the baseline metrics that later phases will compare against
- define the list of hotspot domains and hotspot screens
- identify screens that currently mix local state patching and route invalidation
- define which screens should be server-owned and which should be client-owned after load
- define how LOC reduction and change-path reduction will be measured phase by phase
- align terminology used across tasks so later phases are consistent

## Out of Scope

- large structural rewrites
- changing auth, workspace, or account behavior
- introducing new feature abstractions
- deleting major code paths

## Required Deliverables

1. A documented baseline for the refactoring program, covering at minimum:
   - key hotspot domains
   - key hotspot screens
   - screens with mixed ownership
   - target ownership model per screen

2. A simple measurement approach for later phases, covering at minimum:
   - file count by hotspot domain
   - LOC by hotspot domain
   - file touch count for representative feature changes

3. A clear rule for how later phases should judge success:
   - lower coordination tax
   - fewer layer hops
   - smaller or cleaner final diff
   - no feature regressions

## Suggested Work Items

- review the current refactoring playbook and ensure the execution order is clear
- identify the screens most affected by mixed state ownership
- identify repeated mutation-boundary boilerplate candidates
- identify repeated wrapper or alias patterns worth tracking in later phases
- define the representative change paths that later phases should shorten

## Acceptance Criteria

- the next phases can be executed without inventing their own criteria
- hotspot domains and screens are explicitly identified
- per-screen ownership direction is explicit enough for implementation work
- no code was changed in a way that alters runtime behavior unless strictly needed for baseline instrumentation
- the phase leaves the program easier to execute, not more abstract

## Phase-Specific Success Signal

This phase is successful if later phases can work with less ambiguity and fewer architectural arguments.

The output should function as a stable contract for the rest of the program.

## Final Task Checklist

Before closing this phase, confirm all of the following:

- the baseline and guardrails are documented clearly enough that later phases do not need to invent their own criteria
- hotspot domains, hotspot screens, and mixed-ownership screens are listed explicitly
- the target ownership model is recorded for the important screens even when no runtime code changed yet
- representative change paths and measurement rules are documented for later comparison
- any deleted docs, duplicated notes, or obsolete guidance paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was necessary to create a clearer baseline
- docs were updated anywhere the operating rules or execution order changed
- the full validation commands below were run and passed

## Required Final Validation

All commands must be run from the repository root, and all must pass:

```bash
pnpm check
pnpm test
pnpm test:e2e
```

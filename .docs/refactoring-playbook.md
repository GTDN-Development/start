# Feature Refactoring Playbook

## What This Solves

This document defines how to reduce coordination tax in `apps/web` without removing product features.

It is meant to be used by both:

- engineers doing manual refactors
- AI agents working feature by feature

The goal is not abstract elegance. The goal is:

- fewer files touched per change
- fewer wrapper layers per feature
- fewer duplicate state transitions
- smaller and clearer tests
- lower cost of future feature work

## Target Simplicity

The target style for this program is operation-centric simplicity in the spirit of PocketBase.

That does not mean copying PocketBase's product scope or removing important SaaS behavior.
It means each feature should move closer to:

- one obvious entrypoint per operation
- one primary owner of mutable state
- one place for validation
- one place for side effects
- one place for error, redirect, or cookie semantics
- one screen contract that can be explained briefly and directly

If a contributor still has to trace many wrappers, aliases, mappers, and route invalidation decisions before understanding a basic feature operation, the feature still has coordination tax.

## Repository Baseline Summary

This playbook assumes the repository baseline described in [start-goal.md](/Users/fanda/Dev/start/.rules/start-goal.md), but keeps the core points inline so the document is self-contained.

### Starter Template Bias

This repository is still a pre-launch starter template.

That means we optimize for:

- a clean and opinionated baseline
- architectural correctness over temporary convenience
- one clear way to implement common flows
- explicit Next.js server and response boundaries
- direct PocketBase-backed implementation
- readable top-to-bottom control flow
- predictable file placement and low cognitive load

We do not optimize for:

- preserving temporary patterns just because they already exist
- compatibility shims unless they solve a real current problem
- minimizing churn inside the template itself
- abstractions for hypothetical reuse

Practical implication:

- if a local baseline is wrong, fix the baseline instead of teaching contributors the wrong pattern
- rewriting is acceptable when it improves the template baseline, but the rewrite must stay concrete, local, and easy to trace

### Baseline Runtime Rules

These constraints stay in force during every refactor:

- render-time server code is read-only
- cookie writes and side-effectful redirects belong only in response-writing boundaries
- prefer direct flows such as `route/page -> action or route handler -> service -> repository/helper`
- prefer one explicit implementation over multiple partial patterns

### Redundant Wrapper Audit Summary

This playbook also adopts the spirit of [redundant-alias-wrapper-audit-prompt.md](/Users/fanda/Dev/start/.plans/refactoring/redundant-alias-wrapper-audit-prompt.md).

Treat the following as default cleanup candidates:

- import aliases that do not resolve real ambiguity
- local wrappers that only call another helper with the same meaning
- pass-through helpers that add no validation, transformation, or domain meaning
- renamed helpers whose implementation is only forwarding
- abstractions created only to avoid tiny duplication
- helper names like `getConfigured*`, `resolve*`, `create*`, `build*`, or `normalize*` when the implementation is just passthrough

Do not remove a wrapper if it adds real value such as:

- domain meaning
- validation
- fallback behavior
- normalization
- response-boundary semantics

Practical implication:

- prefer direct import and direct call
- prefer one source of truth
- do not preserve a local helper just because the name feels nicer if the implementation adds no actual value

## Current Diagnosis

The codebase is generally healthy, but `apps/web` pays too much for orchestration.

The main issue is not giant files or obviously broken architecture. The main issue is repeated multi-step flow:

1. route page loads a server snapshot
2. feature component mirrors that snapshot into client state
3. a server action validates input and wraps a service call
4. the service calls a context or repository helper
5. the UI patches local state and also invalidates route state

That pattern is visible in several places, especially:

- workspace members settings: [page.tsx](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/members/page.tsx>), [workspace-members-settings-section.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx), [workspace-members-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts), [workspace-members-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.ts)
- workspace general settings: [workspace-general-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts), [workspace-general-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-general-service.ts)
- auth and account actions: [auth-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-actions.ts), [account-profile-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/account/profile/account-profile-actions.ts), [account-security-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/account/security/account-security-actions.ts)
- screen-level client orchestrators: [workspace-members-settings-section.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx), [your-devices-settings-item.tsx](/Users/fanda/Dev/start/apps/web/src/features/account/security/your-devices-settings-item.tsx)

## External Principles We Adopt

These principles are reinforced by Martin Fowler's refactoring guidance and are a good fit for this repository.

### Small, behavior-preserving steps

Adopt the core definition of refactoring as a series of small behavior-preserving changes.

Why it fits this repo:

- the app already has meaningful coverage around auth, workspace, and device-session behavior
- many flows depend on cookies, redirects, and route semantics, so risk compounds quickly when changes are large

Practical rule:

- if a refactor cannot stay green through small intermediate states, split it further

Reference:

- [Refactoring, Martin Fowler](https://martinfowler.com/books/refactoring.html)

### One hat at a time

Keep refactoring and feature behavior changes separate.

Why it fits this repo:

- many current files mix structural cleanup and behavior changes in the same area
- separating the two makes route, cookie, and auth behavior much easier to validate

Practical rule:

- structural cleanup first under green tests
- feature behavior change second

Reference:

- [Preparatory Refactoring Example, Martin Fowler](https://martinfowler.com/articles/preparatory-refactoring-example.html)
- [Workflows of Refactoring, Martin Fowler](https://martinfowler.com/articles/workflowsOfRefactoring/fallback.html)

### Preparatory refactoring before feature work

When a feature is hard to add because the shape is wrong, reshape the code first.

Why it fits this repo:

- much of the current tax comes from awkward paths through page, action, service, and client state
- the best payoff will come from first making feature changes easier, then doing the feature work

Practical rule:

- make the next change easy, then make the easy change

Reference:

- [Preparatory Refactoring Example, Martin Fowler](https://martinfowler.com/articles/preparatory-refactoring-example.html)

### Opportunistic cleanup is required

Do not rely only on planned cleanup projects. Clean the code while working in it.

Why it fits this repo:

- the app has enough active surface area that debt will regrow quickly if refactoring only happens in dedicated projects

Practical rule:

- when touching a feature, leave it at least slightly easier to change than before
- if the cleanup is small and local, do it immediately
- if the cleanup is real but bigger, note it and schedule it in the same area

Reference:

- [Workflows of Refactoring, Martin Fowler](https://martinfowler.com/articles/workflowsOfRefactoring/fallback.html)

### Long-running migrations need transitional patterns

For larger structural changes, use migration patterns like branch by abstraction or parallel change.

Why it fits this repo:

- some refactors will need old and new paths to coexist briefly, especially around server boundaries, UI contracts, and route behavior

Practical rule:

- use temporary compatibility layers only when replacing a live dependency or public feature boundary
- remove the temporary layer once migration completes

References:

- [Branch by Abstraction, Martin Fowler](https://martinfowler.com/bliki/BranchByAbstraction.html)
- [Parallel Change, Martin Fowler](https://martinfowler.com/bliki/ParallelChange.html)

### Refactoring must have economic payoff

Do not refactor for taste alone.

Why it fits this repo:

- this codebase already contains many good structures and should not be churned just to look cleaner

Practical rule:

- only do a refactor if it lowers future change cost, risk, or local cognitive load

Reference:

- [Workflows of Refactoring, Martin Fowler](https://martinfowler.com/articles/workflowsOfRefactoring/fallback.html)

## Success Criteria

The refactoring effort is successful when:

- a typical feature change touches fewer layers
- route files become thin loaders and composition points
- one screen has one clear state owner
- server actions stop duplicating the same parse-finalize-map pattern
- domain logic lives in fewer, thicker, more purposeful modules
- tests focus on behavior and business rules instead of adapter glue

The target is not "smallest possible codebase". The target is "smallest codebase that still explains itself".

## Non-Goals

Do not use this effort to:

- split `apps/web` into internal packages
- introduce a generic repository framework
- introduce CQRS, event buses, or feature registries
- chase theoretical purity at the cost of shipping
- rewrite working subsystems just for style consistency

## What To Preserve

This repository has several strengths that the refactoring effort must protect.

### Preserve explicit product boundaries

The app has a meaningful split between:

- marketing
- auth
- application shell
- account settings
- workspace scope

That separation should remain visible in routes and features.

Examples:

- [workspace-system.md](/Users/fanda/Dev/start/.docs/workspace-system.md)
- [auth-system.md](/Users/fanda/Dev/start/.docs/auth-system.md)

### Preserve small, readable files where they help

Most files are still reasonably small and locally readable. That is good.

Do not over-correct into:

- giant screen controllers
- giant service files
- generic mega-utils

The goal is fewer layers, not bigger blobs.

### Preserve direct monorepo structure

The workspace layout is one of the healthiest parts of the repo:

- `apps/web`
- `apps/pocketbase`
- `apps/mailpit`
- focused docs under `.docs`

Do not replace this with internal packages or shared libraries unless there is real repeated product value.

### Preserve explicit environment and deployment behavior

The repo is unusually explicit about deployment and local stack behavior.

Examples:

- [README.md](/Users/fanda/Dev/start/README.md)
- [railway.md](/Users/fanda/Dev/start/.docs/deployment/railway.md)

Do not hide these behaviors behind new framework layers or magic runtime indirection.

### Preserve strong auth, workspace, and cookie correctness

The app already encodes many subtle runtime rules around:

- auth cookies
- device sessions
- pending invite handoff
- active workspace preference
- route protection

Any simplification must preserve those semantics, even if file structure changes.

Examples:

- [auth-system.md](/Users/fanda/Dev/start/.docs/auth-system.md)
- [workspace-system.md](/Users/fanda/Dev/start/.docs/workspace-system.md)

Auth-specific boundary rule:

- treat device sessions as auth infrastructure, not as a separate platform domain
- keep current-user resolution and low-level device-session operations in the same auth-owned server boundary
- feature files may finalize auth responses and choose UI behavior, but they should not combine auth guards with direct device-session service calls

Workspace access boundary rule:

- workspace route loaders should resolve auth, membership, and active-workspace access through one workspace-owned access boundary
- route handlers own redirect and cookie-write decisions
- render-time pages and layouts may read cookies through that boundary, but they must not mutate them

Workspace settings ownership rule:

- workspace settings screens become client-owned after their initial route load
- the shared application workspace snapshot is a navigation boundary, not owner screen state
- do not combine local screen patching with broad route invalidation for the same settings surface

Account profile boundary rule:

- the shared account profile snapshot belongs to the application boundary, not to individual account forms
- shared account profile updates must use explicit full-snapshot replacement, not partial merge helpers
- session rechecks may refresh that snapshot, but they should not own page-level account orchestration

Session cleanup rule:

- session-scoped application cleanup belongs in a server-only helper
- shell composition may compute navigation and initial state, but it must not own sign-out or account-deletion cleanup side effects

### Preserve tests that cover real business risk

Keep tests that protect:

- auth flows
- workspace permission rules
- account security behavior
- email-driven flows
- route and redirect semantics

Do not delete strong behavior coverage just to hit a code reduction target.

Use [testing-system.md](/Users/fanda/Dev/start/.docs/testing-system.md) as the baseline intent.

### Preserve explicit contracts and typed shared language

Good examples worth keeping:

- route helpers in `src/config/routes.ts`
- feature-owned schemas and rule files
- explicit server response types
- localized copy in `messages/*.json`

Refactoring should remove translation layers, not the useful contracts underneath them.

### Preserve the KISS bias already present in the repo

The codebase does not suffer from package sprawl or a large internal platform.

That is a strength.

Refactoring should continue this direction:

- direct configuration
- direct feature ownership
- direct data flow

### Preserve subsystem docs when a model is still real

The repo already documents important systems well enough to be useful:

- [workspace-system.md](/Users/fanda/Dev/start/.docs/workspace-system.md)
- [auth-system.md](/Users/fanda/Dev/start/.docs/auth-system.md)
- [testing-system.md](/Users/fanda/Dev/start/.docs/testing-system.md)

If a model still exists after refactoring, keep its documentation accurate rather than deleting the doc and relying on tribal knowledge.

## Refactoring Rules

These rules apply to every feature.

### 1. Prefer one owner per screen

A screen must choose one primary owner for mutable state:

- either server-driven with revalidation and no client mirror state
- or client-owned after load, with local patching and no broad revalidation for the same surface
- the application workspace snapshot may support navigation updates, but it must not become the owner of a settings screen's local state

Do not keep both models for the same interaction path.

### 2. Keep route files thin

Files under `src/app/**` should mostly:

- load data
- redirect or render `notFound()`
- set metadata
- hand one coherent model to the owning feature surface

Route files should not orchestrate multiple domain reads and UI-specific derivations when a screen module can own that work.

### 3. Refactor by screen, not by utility

Default refactoring unit:

- one route or screen
- one feature settings section
- one auth flow

Avoid broad "cleanup everywhere" passes. They create noise and hide whether the work reduced actual change cost.

### 4. Consolidate around use-cases, not layers

When a feature spreads across `page -> action -> service -> context -> repository`, prefer fewer files organized around the actual use-case.

Good examples:

- `workspace-members.screen.server.ts`
- `workspace-general.screen.server.ts`
- `account-security.screen.server.ts`

Bad examples:

- adding another helper layer to keep existing thin layers thin
- extracting a generic abstraction that serves multiple unrelated domains

### 5. Delete wrappers that add no meaning

Remove a wrapper when it only:

- renames an imported function
- forwards arguments unchanged
- maps a successful payload without adding domain meaning
- duplicates `BAD_REQUEST` handling
- duplicates `finalizeAuthAction()` or `applyServerActionAuthCookies()` patterns

Keep a wrapper only if it adds:

- validation
- fallback behavior
- domain terminology
- response-boundary semantics

### 6. Keep domain reads and writes close

For a feature surface, prefer a single server module that owns:

- loading the screen model
- executing that screen's mutations
- returning the screen payloads needed by the UI

Do not force every change through multiple tiny server files just to preserve a perfect read/write split.

### 7. Keep repository helpers low-level

Repository helpers should be direct PocketBase access helpers.

They should not quietly absorb:

- UI-specific sorting
- redirect behavior
- cookie policy
- cross-screen navigation decisions
- derived view models

That logic belongs in the owning feature or screen-level server module.

### 8. Keep config pure

`src/config/**` must not depend on feature modules.

If config imports feature constants, move those constants:

- into config if they are truly configuration
- into a lower-level shared contract if they are shared runtime identifiers

Current smell example: [legal.ts](/Users/fanda/Dev/start/apps/web/src/config/legal.ts)

Practical rule:

- cookie, locale, env, and similar low-level runtime contracts should live under `src/config/**` or another lower-level shared module
- feature files may consume those contracts, but config files should not reach upward into feature-owned modules

### 9. Prefer one response adapter per response family

Auth already has a shared adapter in [auth-response.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-response.ts).

Workspace flows should converge on the same level of reuse instead of repeating:

- parse input
- call service
- apply auth cookies
- map to client response
- optionally revalidate

Response helpers may:

- commit auth cookies
- convert server responses into client action responses
- run explicit caller-owned success hooks when the action file passes them in

Response helpers must not:

- decide mutation ownership for a screen
- hide route invalidation policy inside a generic abstraction

Practical rule:

- action files own `revalidatePath()` decisions
- if a screen already owns local patching after load, do not add broad route invalidation for that same surface

### 10. Test business behavior first

When deciding where a test belongs:

- use service tests for business rules and error mapping
- use screen or feature tests for meaningful UI behavior
- use E2E for full runtime workflows

Do not add large adapter tests only to verify local orchestration details unless that orchestration is the product behavior.

### 11. Remove duplication by deleting paths, not by adding abstractions

Prefer:

- deleting one code path
- deleting one source of truth
- deleting one mapper

over:

- adding another shared helper
- adding a new internal framework
- adding a second compatibility layer

### 12. Every refactor must lower future touch count

If a refactor does not reduce the number of files or concepts needed for the next likely change, it is not finished.

### 13. Delete transitional seams after ownership stabilizes

When a refactor temporarily introduces a screen-state helper, local contract file, or seam test to land a new owner safely, remove it once the owning screen or boundary is stable.

Practical rule:

- inline single-owner helper files that are only used by one screen
- delete dedicated seam tests when their only job was to protect that temporary structure
- keep only shared contracts and tests that still protect behavior another contributor could accidentally break

## AI Operating Rules

Use these rules whenever an AI agent is asked to refactor a feature.

### Required AI Behavior

- work on one bounded feature or screen at a time
- preserve all user-visible behavior unless the task explicitly changes it
- prefer deleting code over moving code
- prefer stronger local ownership over additional indirection
- keep refactors reversible and easy to review
- update or delete tests to match the new architecture instead of preserving obsolete layers

### AI Must Not

- add a generic helper after only one or two examples
- introduce a new shared package
- create a new abstraction to preserve both old and new flows
- leave both optimistic local state and route revalidation for the same interaction
- preserve dead compatibility code "just in case"

### AI Refactoring Checklist

Before changing code, the agent should answer:

1. What is the owning screen or flow?
2. Where is the current source of truth?
3. Which file exists only to translate between layers?
4. Which tests are about glue instead of behavior?
5. What code can be deleted entirely after the new flow lands?

After changing code, the agent should verify:

1. Is there exactly one owner for mutation state?
2. Did route files get thinner?
3. Did the number of modules for the feature go down or become more purposeful?
4. Did tests become smaller or more behavior-focused?
5. Did any duplicated helper or mapper become removable?
6. Does the feature read more like one operation path and less like an orchestration graph?

## Copy-Paste AI Prompt

Use this prompt for feature-by-feature refactors.

```text
Refactor this feature to reduce coordination tax without changing product behavior.

Constraints:
- Work only inside the owning feature and directly related route/server files.
- Prefer deleting wrappers, adapters, and duplicate state paths over moving them.
- Keep one state owner per screen.
- Keep route files thin.
- Consolidate server logic around the actual use-case instead of preserving many thin layers.
- Do not add new shared packages, generic frameworks, or speculative abstractions.
- Update tests so they verify behavior, not obsolete orchestration.

Deliverables:
1. Short diagnosis of the current coordination tax in this feature.
2. Current change path and target change path for the feature.
3. Concrete list of files to delete, merge, or simplify.
4. The refactor itself.
5. Deleted files, deleted paths, and the final state owner for the feature.
6. Net LOC delta for the slice and whether the diff is net negative. If it is not, explain why the new steady state is still simpler.
```

## Feature Refactoring Process

For every feature, use this sequence.

### Step 1: Baseline

Capture:

- files involved in the flow
- mutation paths
- state owners
- existing tests

### Step 2: Choose the target model

For each screen, choose one of:

- server-owned screen with route revalidation
- client-owned screen with server action patching

Write that choice down in the PR description or task note.

### Step 3: Collapse the path

Remove at least one of these per refactor slice:

- one wrapper file
- one mapper
- one duplicate state owner
- one layer hop
- one glue test cluster

### Step 4: Re-test at the right layer

Keep:

- business-rule tests
- critical route tests
- core E2E coverage

Shrink:

- orchestration-only unit tests
- tests that assert implementation details of deleted layers

### Step 5: Update docs only when the model changed

If the feature model changed materially, update the owning subsystem doc under `.docs`.

## Priority Order

This is the recommended execution order for the current codebase.

### Phase 0: Baseline and Guardrails

Scope:

- define target metrics
- tag current hotspot features
- agree on per-screen ownership model before code moves

Tasks:

- track feature file counts and LOC for `workspaces`, `auth`, `account`, and `application`
- mark screens that currently mix local patching with `revalidatePath()`
- align on "one owner per screen" as a hard rule

Baseline contract:

- [.docs/coordination-tax-baseline.md](/Users/fanda/Dev/start/.docs/coordination-tax-baseline.md)
- canonical scenario names: `workspace-general-update`, `workspace-membership-change`, `account-profile-update`, `device-session-sign-out`, `workspace-scope-switch`

Expected impact:

- low code reduction
- high reduction in wasted refactor effort

### Phase 1: Workspace Screen Simplification

Scope:

- workspace members settings
- workspace general settings
- scope switcher follow-up where needed

Primary targets:

- [workspace-members-settings-section.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx)
- [workspace-navigation-context.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/workspace-navigation-context.tsx)
- [workspace-members-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts)
- [workspace-general-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts)
- [workspace-general-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-general-service.ts)
- [workspace-members-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.ts)

Rules:

- stop mixing local screen patching with route invalidation for the same settings surface
- consolidate screen loading and mutation logic around the screen, not around many thin service files
- remove duplicated mapping helpers and payload shims where possible

Expected impact:

- biggest immediate DX win
- realistic code reduction: `1500` to `3000` lines including tests

### Phase 2: Workspace Domain Consolidation

Scope:

- workspace server modules
- context and repository boundaries
- invite and membership access helpers

Primary targets:

- [workspace-auth-context.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-auth-context.ts)
- [workspace-membership-context.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-membership-context.ts)
- [workspace-resolution-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-resolution-service.ts)
- [workspace-invite-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-invite-service.ts)
- [workspace-repository.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-repository.ts)

Rules:

- consolidate around actual use-cases: access, members, invites, general workspace operations
- keep repository helpers direct and low-level
- move screen-specific shaping out of low-level server helpers

Expected impact:

- high reduction in feature touch count
- realistic code reduction: `1000` to `2500` lines

### Phase 3: Auth and Account Flow Simplification

Scope:

- auth server actions
- account profile and security actions
- device session UI orchestration

Primary targets:

- [auth-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-actions.ts)
- [account-profile-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/account/profile/account-profile-actions.ts)
- [account-security-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/account/security/account-security-actions.ts)
- [device-session-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/account/security/device-session-actions.ts)
- [your-devices-settings-item.tsx](/Users/fanda/Dev/start/apps/web/src/features/account/security/your-devices-settings-item.tsx)
- [auth-client.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-client.ts)

Rules:

- centralize repeated server-action finalize patterns
- simplify client wrappers that only forward to actions
- keep auth boundary semantics intact while shrinking adapter code

Expected impact:

- medium DX win
- realistic code reduction: `1000` to `2000` lines

### Phase 4: Shared UI, Config Purity, and Test Cleanup

Scope:

- shared UI components that carry app-specific logic
- config files that import feature modules
- heavy orchestration tests that no longer match the simplified flow

Primary targets:

- [legal.ts](/Users/fanda/Dev/start/apps/web/src/config/legal.ts)
- shared UI helpers under [apps/web/src/components/ui](/Users/fanda/Dev/start/apps/web/src/components/ui) only when they carry app-specific behavior
- action wrapper tests such as [workspace-general-actions.test.ts](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-general-actions.test.ts)

Rules:

- keep config pure
- push app-specific behavior back to the owning feature
- delete tests that only prove obsolete glue paths

Expected impact:

- medium code reduction
- realistic code reduction: `800` to `2000` lines

## Realistic Reduction Target

For the current codebase, a safe realistic target is:

- `10%` to `15%` reduction in `apps/web` runtime code
- `20%` to `30%` reduction in orchestration-heavy slices
- `15%` to `25%` reduction when runtime, action boilerplate, and glue-heavy tests are reduced together

That means a genuine `25%` reduction is plausible only if the team also deletes:

- obsolete adapters
- duplicate client state paths
- orchestration tests that no longer buy coverage

It is not realistic if the team only moves code around.

## Default Diff Expectation

The default expectation for this program is negative net LOC:

- per meaningful refactor slice where real deletion is possible
- and for the full program when all phases are complete

More lines should usually be removed than added.

A temporary positive diff is acceptable only when it creates a clearly simpler steady-state model and the same task note explains:

- what extra code was added
- why it was required
- what old path became deletable because of it

Do not accept a positive diff by default just because the code "looks cleaner".

## Definition of Done Per Feature

A feature refactor is done when:

- one screen ownership model is clearly chosen
- at least one layer hop was removed
- at least one obsolete helper, mapper, or wrapper was deleted
- tests still cover business behavior and critical flows
- docs and naming reflect the new model
- the next likely product change in that feature would touch fewer files than before

## Final Task Checklist

Before closing a refactor task or phase, confirm all of the following:

- user-visible behavior for the slice is unchanged
- the owning screens or flows have one explicit mutation or state owner, or the target ownership model is documented if the phase is preparatory
- the old change path and new change path are written down in the task or PR notes
- at least one obsolete layer hop, wrapper, mapper, or duplicate state path was deleted
- deleted files and deleted paths are listed explicitly
- the net diff removes more LOC than it adds, or the task notes explain why a temporary positive diff was required to reach a simpler steady state
- tests still cover real business behavior and no critical flow lost protection
- docs were updated if the feature model, architectural rules, or operating guidance changed
- `pnpm check`, `pnpm test`, and `pnpm test:e2e` were run from the repository root and all passed

## Smells That Should Trigger Another Pass

Refactor the feature again if any of these remain:

- both local patching and broad revalidation for one screen
- route file imports too many feature and server modules
- action file mostly repeats parse-finalize-map logic
- server modules are split by purity rather than by use-case
- config imports feature modules
- tests mock half the feature just to assert one orchestration branch

## Summary

The current app does not need a rewrite.

It needs repeated, disciplined deletion of coordination-heavy paths:

- one feature at a time
- one screen owner at a time
- one deleted layer per slice

If the team follows this document consistently, the codebase should become smaller, faster to change, and easier to reason about without losing any shipped capability.

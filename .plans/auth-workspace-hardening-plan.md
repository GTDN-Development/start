# Auth And Workspace Hardening Plan

## Goal

Bring the current auth and workspace implementation to a state where it is:

- functionally consistent end-to-end,
- predictable for users in invite and post-auth flows,
- still implemented directly in line with `.rules/project-architecture-principles.md`,
- and verified through focused manual checks for this phase.

This plan covers the current scope:

- sign-in
- sign-up
- sign-out only where required for truthful invite recovery
- verify-email
- confirm-email-change
- post-auth redirect
- personal + organization workspaces
- workspace switching
- workspace members + invites

Out of scope for this implementation phase:

- Playwright or any other automated test infrastructure
- PocketBase seed/reset tooling
- mail capture tooling
- billing
- teams
- OAuth implementation itself
- plugin/provider infrastructure
- generic auth/workflow abstractions
- dashboard/widget systems for workspace overview

## Architectural Guardrails

The implementation must preserve these repo rules:

- Keep behavior traceable as `route/page -> action -> service -> repository/helper`.
- Prefer direct imports and explicit composition over indirection.
- Do not introduce a generic "flow engine", "auth manager", "workspace orchestrator", or provider-neutral abstraction.
- Add new files only where a real seam already exists.
- Do not hide simple control flow behind helpers that only rename logic.
- Keep route-local orchestration close to the affected auth/workspace surfaces.

Practical consequence:

- invite hardening belongs in `src/app/[locale]/(auth)/(flow)/invite/*`, `src/features/auth/*`, and `src/server/workspaces/*`,
- active workspace hardening should reuse existing workspace routing helpers,
- not in a new cross-domain flow layer.

## Current Reality

### What is already solid

- `build` and `lint` pass on the current tree.
- Auth already follows a direct `action -> service` structure.
- Workspace domain code already has usable service and repository boundaries.
- Invite create/resend/revoke/accept are real server flows, not mocks.
- Post-auth bootstrap already ensures the personal workspace exists.
- Header and menu already use pathname-first workspace selection.

### Confirmed implementation gaps

1. Direct invite flow and cold invite flow are not equivalent.
   - Direct `/invite/[token]` can show terminal states.
   - `/invite/[token]/start -> sign-in/sign-up -> post-auth` cannot currently re-surface them.

2. Invite outcomes already exist in the domain, but they are not propagated through post-auth.
   - `accepted`, `already_member`, `invalid_or_expired`, and `email_mismatch` already exist as concrete invite states.
   - The real gap is that post-auth resolution collapses them into a single `workspaceSlug` redirect or a generic fallback.

3. `email_mismatch` gets swallowed after post-auth.
   - The flow falls through to normal workspace selection instead of surfacing an explicit result.

4. The direct invite mismatch CTA is not truthful today.
   - The page says "sign out and continue with another account".
   - The implementation only links to `/sign-in`.
   - Auth guest layout redirects authenticated users away from `/sign-in`, so the CTA does not do what it promises.

5. The direct invite page still has route-level UI defects.
   - `email_mismatch.secondary` uses rich markup in messages, but the page renders it as plain text.
   - Blocked/error states reuse CTAs that are not semantically precise.

6. Active workspace selection is mostly hardened, but the visible switcher can still lag behind route-driven state.
   - Pathname-first selection already exists in shared workspace routing helpers and in the application header/menu.
   - The remaining visible problem is the workspace switcher, which still reads `activeWorkspaceSlug` too literally.

## Strategy

### Workstream 1: Propagate Invite Outcomes Through Post-Auth

#### Objective

Carry existing invite outcomes all the way through post-auth instead of flattening everything into `workspaceSlug | fallback`.

#### Why

The domain already knows the difference between `accepted`, `already_member`, `invalid_or_expired`, and `email_mismatch`. The loss happens later in the flow.

#### Scope

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/auth/post-auth-redirect.ts`

#### Plan

- Extend post-auth workspace resolution to return an explicit union outcome.
- Distinguish at minimum:
  - normal workspace redirect
  - invite accepted
  - invite already_member
  - invite email_mismatch
  - invite invalid_or_expired
- Keep the implementation direct:
  - route/form submits
  - server action resolves
  - redirect helper branches

#### Constraint

Do not introduce a generic auth state machine. This should remain a direct extension of the existing return types and branching.

### Workstream 2: Fix The Direct Invite Route First

#### Objective

Make `/invite/[token]` truthful, complete, and internally consistent before solving cold-flow parity.

#### Why

These are already-confirmed defects on the current route, and they are low-risk, local fixes.

#### Scope

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- invite-related copy in `messages/*.json`
- a route-local or invite-local sign-out CTA

#### Plan

- Render rich invite mismatch copy correctly.
- Replace the fake "sign in with another account" behavior with a real sign-out-and-retry path.
- Tighten blocked/error CTA semantics so the copy matches the actual behavior.
- Keep all invite-specific UI logic local to the invite route or a small invite-local component.

#### Constraint

Do not create a shared global flash/result system for this.

### Workstream 3: Reach Cold Invite Parity With The Smallest Possible State Surface

#### Objective

Make cold invite flow produce an explicit user-facing result equivalent enough to the direct invite flow without introducing extra token persistence.

#### Why

This is the main functional gap in the current auth/workspace integration.

#### Scope

- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- invite route-local surfaces as needed

#### Plan

- Keep the current hash cookie approach.
- Do not add a recovery-token cookie with the raw invite token in this phase.
- Surface terminal post-auth invite outcomes through an explicit invite-local result screen or route.
- Map `accepted` and `already_member` to the target workspace redirect.
- Map `email_mismatch` and `invalid_or_expired` to explicit user-facing result states.

#### Constraint

Do not add a second invite cookie or a generic result-routing framework unless the minimal approach is proven insufficient.

### Workstream 4: Finish The Visible Active Workspace Consumer

#### Objective

Ensure the visible workspace switcher follows the real route or explicit fallback rules.

#### Why

The shared precedence model already exists. The remaining work is to apply it in the one consumer that still relies too much on `activeWorkspaceSlug`.

#### Scope

- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/application/workspace-routing.ts` only if a tiny helper extension is needed

#### Plan

- Keep the precedence model:
  1. workspace slug from pathname on `/w/[workspaceSlug]/...`
  2. `active_workspace` cookie
  3. first available workspace
- Reuse the existing workspace routing helper instead of rebuilding layout state management.
- Fix only the visible lag in the switcher after non-standard redirects such as direct invite accept.

#### Constraint

Do not rebuild application layout state management. This is a consumer-hardening task, not a new navigation architecture.

## Implementation Order

### Phase 1: Route Truthfulness

- fix direct invite route defects
- add a real sign-out-and-retry path

### Phase 2: Outcome Plumbing

- propagate explicit invite outcomes through post-auth
- keep accepted/already_member as workspace redirects
- surface mismatch/invalid outcomes explicitly

### Phase 3: Cold Invite Parity

- complete the post-auth result route or invite-local result screen
- keep the existing hash-cookie approach
- do not add a recovery-token cookie in this phase

### Phase 4: Visible Workspace Consumer Hardening

- align the workspace switcher with pathname-first selection

## Estimated Implementation Size

Estimated size for this narrowed implementation phase, without automated tests:

- roughly `220-340 changed LoC`
- roughly `120-220 new LoC`

Working estimate by area:

- direct invite route truthfulness, rich text rendering, and real sign-out-and-retry path: `70-110 changed LoC`
- post-auth invite outcome plumbing across service, action, and redirect helper: `80-130 changed LoC`
- cold invite parity surface without a recovery-token cookie: `50-90 changed LoC`
- workspace switcher pathname-first hardening: `20-40 changed LoC`

Lower-bound variant:

- if the implementation reuses a single invite-local result surface and avoids adding a separate result route, the total can likely stay closer to `180-280 changed LoC`

## Acceptance Criteria

Auth + workspace hardening is done for this phase when:

- direct invite and cold invite flow end in equivalent user-facing outcomes for accepted, already-member, mismatch, and invalid/expired cases,
- no terminal invite state is silently swallowed after post-auth,
- direct invite copy and CTA behavior are truthful,
- the visible workspace switcher matches the current route or explicit fallback rules,
- no new generic orchestration layer was introduced,
- code remains easy to trace from route to service,
- the narrowed flow matrix has been manually verified.

## Manual Verification For This Phase

Run these flows manually before calling the hardening complete:

1. direct invite accept while already signed in
2. direct invite mismatch while signed in
3. cold invite accept after sign-in
4. cold invite accept after sign-up
5. cold invite mismatch after sign-in
6. expired or invalid invite path surfaces an explicit state
7. post-auth without pending invite still lands deterministically
8. workspace switcher reflects the route after invite-driven redirects

## Deferred Follow-Ups

These are intentionally not part of this implementation branch:

- replace the placeholder workspace overview with a richer route-local home surface
- add Playwright
- add PocketBase seed/reset support
- add mail capture tooling
- automate the auth/workspace regression matrix

If the correctness fixes land cleanly and the overview still feels too placeholder-heavy, handle that as a separate small follow-up rather than expanding this branch.

## Non-Goals

- rebuilding auth into a provider-agnostic architecture
- introducing a generic notification/result framework
- adding future-facing plugin points for unknown flows
- solving OAuth in the same implementation branch
- introducing test infrastructure in this phase
- inventing a dashboard framework for workspace overview

## Expected File Touch Pattern

Implementation should stay concentrated roughly in:

- `src/features/auth/*`
- `src/features/workspaces/*`
- `src/server/workspaces/*`
- `src/app/[locale]/(auth)/(flow)/invite/*`
- `messages/*.json`

If the solution starts requiring a new general orchestration layer outside these areas, or new persistent invite-token infrastructure, that is a signal to simplify and return to the project principles.

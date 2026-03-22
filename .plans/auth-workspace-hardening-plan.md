# Auth And Workspace Hardening Plan

## Goal

Fix the current auth + workspace correctness gaps without adding new infrastructure or abstraction layers.

This branch should only solve:

- truthful direct invite flow
- explicit post-auth invite outcomes
- cold invite parity without extra token persistence
- visible workspace switcher correctness after invite-driven redirects

## Out Of Scope

Do not include any of this in this branch:

- Playwright or any other automated test infrastructure
- PocketBase seed/reset tooling
- mail capture tooling
- workspace overview redesign
- billing
- teams
- OAuth implementation itself
- plugin/provider infrastructure
- generic auth/workflow abstractions

## Rules

- Keep behavior traceable as `route/page -> action -> service -> repository/helper`.
- Prefer direct branching over new abstraction.
- Keep invite-specific UI local to invite routes.
- Reuse existing workspace routing helpers.
- Do not add a recovery-token cookie in this phase.
- Do not build a shared result/flash system.
- Do not rebuild application layout state.

## Workstream 1: Direct Invite Route

### Files

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `messages/en.json`
- `messages/cs.json`
- invite-local component file only if needed

### Do

- render mismatch copy with rich text
- replace fake "sign in with another account" CTA with real sign-out-and-retry behavior
- make blocked/error CTAs match real behavior
- keep this route truthful for:
  - accepted
  - already_member
  - email_mismatch
  - invalid_or_expired

### Do Not

- do not redirect authenticated users to `/sign-in` as the mismatch recovery path
- do not add shared invite UI infrastructure

## Workstream 2: Post-Auth Outcome Plumbing

### Files

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/auth/post-auth-redirect.ts`

### Do

- change post-auth workspace resolution from `workspaceSlug only` to an explicit union outcome
- carry through these outcomes:
  - workspace redirect
  - invite accepted
  - invite already_member
  - invite email_mismatch
  - invite invalid_or_expired
- keep `accepted` and `already_member` as workspace redirects
- branch explicitly in the redirect helper

### Do Not

- do not add a generic auth state machine
- do not hide branching in helper layers that only rename logic

## Workstream 3: Cold Invite Parity

### Files

- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- invite route-local result surface as needed

### Do

- keep the current pending invite hash cookie approach
- surface `email_mismatch` and `invalid_or_expired` after sign-in/sign-up as explicit user-facing states
- use a small invite-local result surface or route if needed

### Do Not

- do not add a second cookie for the raw token
- do not build a generic result-routing framework

## Workstream 4: Workspace Switcher

### Files

- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/application/workspace-routing.ts` only if a tiny helper change is needed

### Do

- make the switcher follow the same precedence as the rest of the app:
  1. workspace slug from pathname on `/w/[workspaceSlug]/...`
  2. `active_workspace` cookie
  3. first available workspace
- fix visible lag after invite-driven redirects

### Do Not

- do not touch header/menu logic unless a real bug is found there
- do not redesign navigation state

## Implementation Order

1. Fix direct invite route truthfulness.
2. Propagate explicit invite outcomes through post-auth.
3. Add the smallest cold-invite result surface needed for mismatch/invalid outcomes.
4. Fix the workspace switcher to use pathname-first selection.

## Estimated Implementation Size

Estimated size for this narrowed implementation phase:

- roughly `220-340 changed LoC`
- roughly `120-220 new LoC`

Working estimate by area:

- direct invite route truthfulness, rich text rendering, and real sign-out-and-retry path: `70-110 changed LoC`
- post-auth invite outcome plumbing across service, action, and redirect helper: `80-130 changed LoC`
- cold invite parity surface without a recovery-token cookie: `50-90 changed LoC`
- workspace switcher pathname-first hardening: `20-40 changed LoC`

Lower-bound variant:

- if the implementation reuses a single invite-local result surface and avoids adding a separate result route, the total can likely stay closer to `180-280 changed LoC`

## Done When

- direct invite and cold invite flow end in equivalent user-facing outcomes for accepted, already-member, mismatch, and invalid/expired cases
- no terminal invite state is silently swallowed after post-auth
- direct invite copy and CTA behavior are truthful
- the visible workspace switcher matches the current route or explicit fallback rules
- no new generic orchestration layer was introduced

## Manual Verification

Run these flows manually before closing the branch:

1. direct invite accept while already signed in
2. direct invite mismatch while signed in
3. cold invite accept after sign-in
4. cold invite accept after sign-up
5. cold invite mismatch after sign-in
6. expired or invalid invite path surfaces an explicit state
7. post-auth without pending invite still lands deterministically
8. workspace switcher reflects the route after invite-driven redirects

## Stop Signals

If implementation starts requiring any of these, stop and simplify:

- a new general orchestration layer
- a generic notification/result framework
- new persistent invite-token infrastructure
- application layout state refactor
- broader workspace overview work

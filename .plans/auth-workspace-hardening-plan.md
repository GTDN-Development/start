# Auth And Workspace Hardening Plan

## Goal

Bring all currently existing auth and workspace flows to a state where they are:

- functionally consistent end-to-end,
- predictable for users,
- covered by meaningful testing,
- and still implemented directly in line with `.rules/project-architecture-principles.md`.

This plan covers the current project scope:

- sign-in
- sign-up
- sign-out
- verify-email
- forgot-password
- reset-password
- confirm-email-change
- post-auth redirect
- personal + organization workspaces
- workspace switch
- workspace general settings
- workspace members + invites
- workspace overview entry flow

Out of scope:

- OAuth implementation itself
- billing
- teams
- generic plugin/provider infrastructure

## Architectural Guardrails

The solution must preserve these principles:

- Keep behavior traceable as `route/page -> action -> service -> repository/helper`.
- Prefer direct imports and explicit composition.
- Do not introduce a generic "flow engine", "auth manager", "workspace orchestrator", or provider-neutral abstractions.
- Add new files only where a real seam already exists.
- Do not hide simple control flow behind helpers that only rename logic.
- Keep feature-local solutions close to the actual routes and domains.

Practical consequence:

- invite flow fixes should live inside `src/server/workspaces/*`, `src/features/auth/*`, and route-local invite surfaces,
- not inside a new general workflow layer.

## Existing Surface Area

### Auth routes

- `src/app/[locale]/(auth)/(guest)/sign-in/page.tsx`
- `src/app/[locale]/(auth)/(guest)/sign-up/page.tsx`
- `src/app/[locale]/(auth)/(guest)/forgot-password/page.tsx`
- `src/app/[locale]/(auth)/(flow)/reset-password/page.tsx`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- `src/app/[locale]/(auth)/(flow)/confirm-email-change/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`

### Workspace routes

- `src/app/[locale]/(application)/overview/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`

### Core auth modules

- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/auth-client.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/server/auth/auth-service.ts`
- `src/server/auth/current-user.ts`
- `src/features/auth/use-sign-out.ts`
- `src/features/auth/auth-proxy.ts`

### Core workspace modules

- `src/features/workspaces/actions/workspace-actions.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-general-service.ts`
- `src/server/workspaces/workspace-members-service.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/workspaces/workspace-cookie.ts`
- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/workspaces/workspace-navigation-context.tsx`
- `src/features/application/workspace-routing.ts`

## Research Summary

### What is already solid

- The repo builds and lints cleanly.
- Auth is structured directly through `auth-actions -> auth-service`.
- The workspace domain already has reasonable services, guards, and repository boundaries.
- Invite creation / resend / revoke / accept are real server flows, not UI mocks.
- Post-auth workspace bootstrap exists and centrally ensures the personal workspace.
- Workspace settings and member management already have real server actions.

### Confirmed gaps

1. Cold invite flow and direct invite flow are not equivalent.
   - Direct `/invite/[token]` can explicitly render some terminal states.
   - `start -> sign-in/sign-up -> post-auth` currently cannot surface those states properly.

2. `email_mismatch` gets lost after post-auth.
   - The flow falls through to normal workspace selection instead of surfacing an explicit result.

3. Active workspace UI is not robust enough when redirects happen outside the standard switch action.
   - Sidebar/workspace switcher primarily rely on cookie/context state.
   - Direct invite accept can open a new workspace route without synchronously updating the active workspace visible in the UI.

4. The direct invite mismatch CTA is not trustworthy today.
   - Guest auth layout redirects authenticated users back to `/overview`.
   - So a CTA like "sign in with another account" is not enough unless it performs a real sign-out step first.

5. Workspace overview is still a placeholder.
   - A flow can end technically correctly, but the user still lands on an unfinished destination page.

6. There is no automated auth/workspace flow coverage.
   - The repo does not currently include a test runner or E2E suite.
   - Quality currently depends on static checks and manual verification.

### Important nuance

The existing `.plans/workspace-invite-flow-audit-plan.md` is useful as a focused audit, but it is not sufficient as the main integration plan for overall auth + workspace behavior. This document should be treated as the primary implementation plan for the broader hardening effort.

## Recommended Strategy

### Workstream 1: Define Explicit Flow Outcomes

#### Objective

Make each auth/workspace transition return an explicit outcome instead of relying on silent fallbacks.

#### Why

Without explicit outcome types, terminal states get lost between route, action, and redirect layers.

#### Scope

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/workspaces/actions/workspace-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- invite route-local surfaces where needed

#### Plan

- Introduce a clear outcome contract for post-auth workspace resolution.
- At minimum distinguish:
  - workspace redirect success
  - invite accepted
  - invite already_member
  - invite email_mismatch
  - invite invalid_or_expired
- Do not let `replaceToPostAuthDestination()` keep deciding only between `workspace` and fallback `/overview`.

#### Constraint

Do not introduce a generic auth flow state machine. Extending existing explicit return types and direct branching is enough.

### Workstream 2: Make Invite Flow Parity Real

#### Objective

Unify direct and cold invite flow so the same invite produces the same user-facing result regardless of whether the user was already signed in.

#### Scope

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/workspaces/workspace-cookie.ts`
- `src/features/auth/post-auth-redirect.ts`

#### Design decision to make

We need to decide how post-auth flow should re-surface invite-specific results:

Option A:
- keep only the hash cookie,
- show a separate result screen for mismatch/expired states,
- require the user to reopen the invite link manually if needed.

Option B:
- add a short-lived invite recovery cookie with the raw token only for this flow,
- send terminal post-auth states back to `/invite/[token]`,
- preserve full parity with the direct flow.

#### Recommendation

Prefer Option B.

Rationale:

- it remains invite-specific,
- it does not require generic infrastructure,
- it gives the best UX,
- it keeps logic local to the invite domain.

#### Additional work

- Add a real sign-out-and-retry CTA for the mismatch scenario.
- Ensure deterministic cleanup of invite-related cookies after terminal states.
- Unify copy, icon states, and CTA behavior across direct and cold invite flows.

### Workstream 3: Normalize Active Workspace Resolution

#### Objective

Ensure that "active workspace" in the UI is never derived only from stale cookie state when the current pathname already clearly identifies the real workspace.

#### Scope

- `src/app/[locale]/(application)/layout.tsx`
- `src/features/workspaces/workspace-switcher.tsx`
- `src/features/workspaces/workspace-navigation-context.tsx`
- `src/features/application/workspace-routing.ts`
- relevant redirect/action paths

#### Recommendation

Use this precedence order:

1. workspace slug from the current pathname, when the route is `/w/[workspaceSlug]/...`
2. `active_workspace` cookie as fallback
3. first available workspace

#### Why

This is the simplest robust model, and the repo already has helpers in `src/features/application/workspace-routing.ts` that point in this direction.

#### Additional work

- Continue setting the cookie on switch/create/post-auth/direct invite accept.
- But the UI must not break even when the cookie is temporarily stale.

### Workstream 4: Make Workspace Entry Actually Functional

#### Objective

Replace the placeholder workspace overview with a minimal but genuinely functional entry page.

#### Scope

- `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
- route-local feature files near the overview route

#### Recommendation

Do not invent a dashboard framework. Build a small, route-local workspace home surface:

- workspace name
- workspace kind
- current role
- member count
- quick actions:
  - open settings
  - open members
  - create workspace

#### Why

Without this, auth/workspace flows may be technically correct but still product-incomplete.

### Workstream 5: Audit All Auth Flow Redirects

#### Objective

Unify redirect and success/error behavior across all auth flows.

#### Scope

- sign-in
- sign-up
- sign-out
- verify-email
- forgot-password
- reset-password
- confirm-email-change
- invite

#### Plan

- For each flow, define:
  - entry state
  - success target
  - terminal error states
  - authenticated vs unauthenticated behavior
  - cookie/session side effects
- Fix places where the user-facing copy promises a different action than the code actually performs.
- Restrict "go to sign-in" style CTAs to cases where they really work.

#### Constraint

Do not introduce a shared redirect registry for all flows. Use existing direct calls and local helpers.

### Workstream 6: Add End-To-End Test Coverage

#### Objective

Stop relying on build + lint alone for auth/workspace behavior.

#### Recommendation

Add Playwright as the main testing layer for these flows.

#### Why Playwright

- the flows cross routes, cookies, and session state,
- unit tests alone will not catch redirect/cookie/UI inconsistencies,
- Playwright is the shortest path to realistic confidence.

#### Supporting pieces

- add a simple PocketBase test seed/reset script,
- define a mail testing strategy:
  - ideally a local SMTP capture inbox,
  - fallback: in test mode, write invite URLs into a local test sink just for E2E,
  - without introducing a generic email provider abstraction.

#### Minimum critical suite

1. sign-up -> post-auth -> personal workspace exists
2. sign-in -> post-auth -> selected workspace is correct
3. sign-out -> protected route redirects to sign-in
4. verify-email with active session -> returns to workspace flow
5. reset-password -> sign-in works with the new password
6. confirm-email-change -> session and redirect remain coherent
7. direct invite accept while signed in
8. cold invite accept after sign-in
9. cold invite accept after sign-up
10. invite mismatch after sign-in surfaces an explicit state
11. already_member invite path lands deterministically
12. expired invite path surfaces an explicit state
13. admin can invite/resend/revoke; member cannot mutate
14. ownership transfer / last-owner guard / leave / delete organization workspace

### Workstream 7: Manual QA Matrix For Pre-Launch Verification

Automated tests are not enough. Prepare a short manual checklist for:

- locale variants (`cs`, `en`)
- remembered vs session-only auth
- cross-tab sign-out/session refresh
- stale invite links from email
- workspace slug change while that workspace is active
- invite accept on an account that already has multiple workspaces

## Implementation Order

### Phase 1: Flow Contract Hardening

- explicit outcomes for post-auth workspace resolution
- invite parity design decision
- mismatch / invalid invite surface
- real sign-out-and-retry path

### Phase 2: Workspace Selection Consistency

- pathname-first active workspace resolution
- cookie synchronization fixes
- direct invite accept consistency

### Phase 3: Functional Workspace Entry

- replace placeholder overview with a minimal real workspace home

### Phase 4: Test Infrastructure

- Playwright setup
- PocketBase test seeding/reset
- mail test capture strategy

### Phase 5: E2E Suite + Manual QA

- automate the critical matrix
- run the manual edge-case checklist

## Acceptance Criteria

Auth + workspace implementation is done when:

- direct invite and cold invite flow end in equivalent user-facing states,
- no terminal invite state is silently swallowed,
- active workspace shown in the UI always matches the current route or explicit fallback rules,
- sign-out and switch-account paths actually do what the UI says,
- workspace overview is no longer placeholder-only,
- all existing auth flows have explicit success/error/redirect behavior,
- critical flows are covered by E2E tests,
- no new generic orchestration layer was introduced,
- code remains easy to trace from route to service.

## Non-Goals

- Rebuilding auth into a provider-agnostic architecture
- Creating a generic notifications/flash system for future domains
- Adding future-facing plugin points for unknown flows
- Solving OAuth in the same implementation branch

## Expected File Touch Pattern

Implementation should remain concentrated roughly in these places:

- `src/features/auth/*`
- `src/server/auth/*`
- `src/features/workspaces/*`
- `src/server/workspaces/*`
- `src/app/[locale]/(auth)/(flow)/invite/*`
- `src/app/[locale]/(application)/overview/page.tsx`
- `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
- test setup + E2E files

If the design starts requiring a new general orchestration layer outside these areas, that is a signal to return to the project principles and simplify it.

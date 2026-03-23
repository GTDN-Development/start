# Workspace Invite Flow Refactor Plan

Date: 2026-03-23

## Goal

Refactor the current workspace invite flow so that:

- `GET /invite/[token]` no longer performs acceptance as a side effect
- the invite page becomes an inspect-first page
- invitation acceptance happens through an explicit `POST`
- the existing cold invite continuation via `pending_invite` cookie remains intact
- the server remains the single source of truth for recipient matching and invite acceptance
- the implementation stays KISS, with minimal new files and minimal new LoC

This plan intentionally excludes tests for now.

## Desired End State

- Anonymous user opens `/invite/[token]`
  - valid token -> redirect to `/invite/[token]/start`
  - `start` stores `pending_invite` cookie and redirects to sign-in
- Signed-in user opens `/invite/[token]`
  - page inspects the invitation only
  - page renders actionable invite details when the invite belongs to the current user
  - page renders explicit terminal states for invalid/expired or wrong-account cases
- Signed-in user explicitly accepts the invite
  - acceptance happens through a dedicated `POST` route
  - accepted workspace becomes active workspace
  - redirect lands in the accepted workspace
- Post-auth flow continues to consume `pending_invite` centrally
  - successful consume redirects into the invited workspace
  - mismatch/invalid states still route through the existing invite result flow

## Proposed Scope

### 1. Refactor invite service into inspect + accept

File:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts`

Changes:

- Extract a small shared internal helper for invite lookup and validation.
- Keep all server truth in one place:
  - invite exists
  - invite is not expired
  - current user e-mail exactly matches invited e-mail
  - target workspace exists
- Add a new non-mutating function:
  - `getInviteTokenForUser(inviteToken, user)`
- Keep:
  - `acceptInviteTokenForUser(inviteToken, user)`
- Reuse the same shared validation path for both inspect and accept.

Reason:

- removes duplicated reasoning
- avoids adding a new abstraction layer
- keeps route/page logic very thin

### 2. Tighten service-level invite state naming

File:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-types.ts`

Changes:

- Introduce a small inspect result shape aligned more closely with Better Auth mental model.
- Keep the state set intentionally small.

Target state set:

- inspect:
  - `pending`
  - `already_member`
  - `invalid_or_expired`
  - `email_mismatch`
- accept:
  - `accepted`
  - `already_member`
  - `invalid_or_expired`
  - `email_mismatch`

Non-goals:

- no persistent `rejected` state
- no `canceled` recipient flow
- no hook system
- no adapter/provider architecture

### 3. Convert invite page to inspect-only

File:

- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`

Changes:

- Remove auto-accept on page load.
- After authentication, call `getInviteTokenForUser(...)` instead of `acceptInviteTokenForUser(...)`.
- Render:
  - actionable invite state when result is `pending`
  - redirect to workspace when result is `already_member`
  - wrong-account state when result is `email_mismatch`
  - blocked state when result is `invalid_or_expired`
- Add a simple explicit accept CTA.

Reason:

- `GET` should not mutate server state
- user intent becomes explicit
- the route becomes production-safe while remaining simple

### 4. Add explicit accept route

New file:

- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`

Changes:

- Add `POST` route for invite acceptance.
- Route responsibilities:
  - load current session
  - call `acceptInviteTokenForUser(...)`
  - set active workspace cookie on success
  - redirect to workspace overview on `accepted` or `already_member`
  - redirect to existing invite result handling on `email_mismatch` or `invalid_or_expired`

Reason:

- explicit mutate endpoint
- minimal new surface area
- no need for a heavier client-side action flow

### 5. Keep post-auth cookie consume flow

File:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts`

Changes:

- Keep the current architecture intact.
- Only adjust types or naming if needed to stay aligned with the refactored service layer.

Reason:

- this is already one of the strongest parts of the current implementation
- Better Auth does not give a better cold invite UX here

### 6. Restrict pending invite listing to admin/owner

File:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts`

Changes:

- Change `listWorkspaceInvites(...)` to require admin-level workspace access instead of plain member access.

Reason:

- members should not see all pending invitation e-mails by default
- high-value production improvement for a very small code change

## Files Expected To Change

Modify:

- `/Users/fanda/Dev/start/src/server/workspaces/workspace-invite-service.ts`
- `/Users/fanda/Dev/start/src/server/workspaces/workspace-types.ts`
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts`

Add:

- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`

Possible small touch-up:

- `/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts`

Only if type alignment or invite result routing needs a tiny cleanup.

## What Will Not Change

- no rewrite to Better Auth architecture
- no new feature-level abstraction layers
- no event system or hook system
- no invite status history model
- no reject flow in this pass
- no tests in this pass

## Suggested Implementation Order

1. Refactor shared invite validation in the service.
2. Add inspect result type and `getInviteTokenForUser(...)`.
3. Add `POST` accept route.
4. Convert invite page from auto-accept to inspect-first.
5. Restrict pending invite listing to admin/owner.
6. Do a quick manual verification pass of:
   - anonymous open
   - signed-in matching user
   - signed-in wrong account
   - post-auth consume

## LoC Estimate

Estimate excludes tests.

Estimated net changed LoC:

- `workspace-invite-service.ts`: 50-90 LoC
- `workspace-types.ts`: 10-25 LoC
- `invite/[token]/page.tsx`: 35-70 LoC
- `invite/[token]/accept/route.ts`: 25-45 LoC
- `workspace-resolution-service.ts`: 0-15 LoC
- optional small cleanup elsewhere: 0-15 LoC

Estimated total net LoC:

- conservative: 120-160 LoC
- likely: 150-210 LoC
- upper bound for a still-KISS implementation: 220-250 LoC

Estimated touched files:

- 5 files likely
- 6 files at most if a small redirect/type cleanup is needed

## Recommendation

Proceed with the likely scope target:

- around 150-210 LoC
- 5 touched files
- no tests yet

That should be enough to fix the architectural issue, improve correctness, preserve the current cold invite UX, and stay comfortably inside the project KISS principles.

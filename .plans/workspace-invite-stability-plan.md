# Workspace Invite Stability Plan

Date: 2026-03-24

This is the canonical plan for workspace invite hardening in this repo.
It replaces the current invite KISS plan and is intentionally narrower than a full invite domain redesign.

## Goal

Make the workspace invite flow:

- reliable in direct invite and cold invite scenarios
- easy to trace as `route/page -> action -> service -> repository/helper`
- stable enough to keep as template behavior for a long time
- explicit without changing the underlying auth core or PocketBase invite model

This plan is not trying to design the perfect invite system.
It is trying to lock in the simplest durable version for this starter.

## Core Decisions

### 1. Auth core stays as-is

Do not redesign:

- `src/server/auth/current-user.ts`
- `src/server/auth/auth-service.ts`
- `src/server/pocketbase/pocketbase-server.ts`
- device session validation and cookies

These files are already a solid base.
The hardening target is invite flow, not auth architecture.

### 2. Invite flow becomes canonical and explicit

Target recipient model:

- `/invite/[token]` is the single recipient page
- `POST /invite/[token]/accept` is the single recipient mutation
- recipient-facing states are decided on `/invite/[token]`
- post-auth continuation only restores destination
- invite acceptance never happens silently during post-auth continuation

### 3. Keep the current PocketBase invite model

Do not add:

- invite `status`
- invite lifecycle state machine
- extra audit fields
- schema-level redesign just for this pass

For this phase:

- `workspace_invites` stays delete-driven
- `token_hash` remains server-side
- accepted, revoked, missing, and expired invites can continue to collapse into recipient-facing invalid states where appropriate

This keeps the data model simple and avoids creating new query branches that the template would need to carry forever.

### 4. Keep one continuation cookie only

Use the existing `pending_invite` cookie as the only invite continuation cookie.

In this plan it should:

- be short-lived
- remain HTTP-only
- store the raw invite token
- exist only to return the user to `/invite/[token]` after auth continuation

Do not add a second cookie.

### 5. Split the real seam in the invite service

The current invite service mixes two different concerns:

- recipient inspect and accept flow
- admin invite management

That is a real split and worth doing.

Target shape:

- `src/server/workspaces/workspace-invite-recipient-service.ts`
- `src/server/workspaces/workspace-invite-service.ts` for admin invite management

## In Scope

- direct invite page truthfulness
- fixing the direct accept bug
- canonical recipient page and accept route
- changing post-auth continuation to destination-only outcomes
- using the existing `pending_invite` cookie as raw-token continuation
- splitting recipient invite logic from admin invite management
- removing `/invite/result` once the canonical page fully replaces it
- small route wiring cleanup across sign-in and verify-email continuation
- workspace switcher verification only

## Out Of Scope

- auth core redesign
- PocketBase invite schema redesign
- invite `status`
- new audit/event infrastructure
- generic auth workflow engine
- provider or plugin abstractions
- billing
- teams
- OAuth implementation
- app shell or navigation redesign
- test infrastructure expansion

## Target Behavior

### Direct Invite

When a user opens `/invite/[token]`:

- signed out: they are routed into auth continuation and then returned to the same invite page
- signed in with invited account: they see the real invite state and can accept
- signed in with wrong account: they see explicit mismatch state and real sign-out-and-retry recovery
- already a member: they are redirected directly to the workspace
- invalid or expired: they see an explicit blocked state

### Cold Invite

When a signed-out user starts from `/invite/[token]`:

- the token is preserved only as destination continuation
- sign-in, sign-up, and verify-email completion return to `/invite/[token]`
- the invite page decides what to show after auth
- no invite is accepted in the background

## Workstreams

### 1. Fix the direct accept bug and finish page truthfulness

Files:

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`
- `messages/en.json`
- `messages/cs.json`

Do:

- replace the fragile relative form action with an explicit token-aware accept target
- keep the accept flow plain HTML and server-driven
- keep recipient states local to the invite route
- make mismatch copy truthful
- keep mismatch recovery as real sign-out-and-retry behavior
- make blocked and transient-error CTAs match actual behavior

Do not:

- do not add a client form wrapper just for accept
- do not redirect mismatch recovery to `/sign-in` without sign-out
- do not add shared flash or result infrastructure

### 2. Extract recipient invite logic into its own service

Files:

- new `src/server/workspaces/workspace-invite-recipient-service.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- routes that currently import recipient helpers

Recipient service should own:

- `validateInviteToken`
- `getInviteTokenForUser`
- `acceptInviteTokenForUser`
- recipient-side validation helpers
- token-aware lookup helpers used by canonical recipient flow

Admin service should continue to own:

- `listWorkspaceInvites`
- `createWorkspaceInviteForCurrentUser`
- resend flow
- refresh flow
- revoke flow

Do not:

- do not introduce barrel files
- do not invent generic `manager`, `engine`, or `workflow` layers

### 3. Change `pending_invite` to raw-token continuation

Files:

- `src/server/workspaces/workspace-cookie.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- recipient invite service if helper names need to change

Do:

- keep one cookie only
- store raw token instead of hash
- rename helpers to `...InviteToken...` where that improves readability
- keep the cookie meaning narrow: continuation destination only

Do not:

- do not add a second recovery cookie
- do not use the cookie as an invite-outcome transport

### 4. Simplify post-auth continuation to destination-only outcomes

Files:

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-types.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`

Target post-auth outcomes:

- `app`
- `workspace_redirect`
- `invite_redirect`

Do:

- stop consuming and accepting pending invites during post-auth resolution
- return only navigation outcomes
- make sign-in and verify-email completion use the same continuation contract
- keep workspace redirect behavior as-is for non-invite flows

Do not:

- do not carry page-level invite states through post-auth
- do not add a mini state machine
- do not build a generic redirect framework

### 5. Rewire auth continuation back to the canonical invite page

Files:

- `src/features/auth/post-auth-redirect.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- invite route files if needed

Do:

- when post-auth returns `invite_redirect`, send the user back to `/invite/[token]`
- let the invite page inspect the invite again after auth
- keep accept as the only mutation path

Do not:

- do not auto-accept invite after sign-in
- do not duplicate recipient decision logic in auth helpers

### 6. Remove `/invite/result` after canonical flow works

Files:

- `src/app/[locale]/(auth)/(flow)/invite/result/page.tsx`
- `src/i18n/routing.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`

Do:

- delete the route entirely
- delete invite-result URL builders
- route users either back to `/invite/[token]` or directly into the workspace

Do not:

- do not keep the old detour for compatibility inside this template branch
- do not recreate the same page under another name

### 7. Verify the workspace switcher, but do not preemptively refactor it

Files:

- no code changes by default
- only touch `src/features/application/scope-switcher.tsx`
- only touch `src/features/application/workspace-routing.ts`
- only touch workspace navigation context if a real repro remains

Do:

- manually verify switcher state after invite-driven workspace entry
- only make the smallest route-first fix if a bug is still reproducible

Do not:

- do not include switcher refactor in the default implementation scope
- do not expand into broader navigation work

## Suggested Implementation Order

1. Fix the direct accept form target and recipient page truthfulness.
2. Extract recipient invite logic into `workspace-invite-recipient-service.ts`.
3. Change `pending_invite` to raw-token continuation using the existing cookie.
4. Simplify post-auth to `app | workspace_redirect | invite_redirect`.
5. Rewire sign-in and verify-email continuation back to `/invite/[token]`.
6. Remove `/invite/result`.
7. Run manual verification.
8. Only if a real repro remains, apply the smallest possible switcher fix.

## Files Expected To Change

Modify:

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.ts`
- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`
- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/post-auth-redirect.ts`
- `src/i18n/routing.ts`
- `src/server/workspaces/workspace-cookie.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-types.ts`
- `messages/en.json`
- `messages/cs.json`

Add:

- `src/server/workspaces/workspace-invite-recipient-service.ts`

Delete:

- `src/app/[locale]/(auth)/(flow)/invite/result/page.tsx`

Not expected to change:

- `src/server/auth/current-user.ts`
- `src/server/auth/auth-service.ts`
- `src/server/pocketbase/pocketbase-server.ts`
- `src/types/pocketbase.ts`
- PocketBase invite schema

## Done When

- `/invite/[token]` is the single recipient page
- `POST /invite/[token]/accept` is the single recipient mutation
- post-auth continuation never accepts invites silently
- no invite-specific state is hidden inside auth continuation
- cold invite and direct invite converge on the same visible recipient flow
- `/invite/result` is gone
- invite admin and recipient logic are separated into focused services
- auth core remains untouched
- no schema redesign was introduced

## Manual Verification

Run these flows manually before closing the branch:

1. direct invite open while signed out
2. direct invite open while signed in with invited account
3. direct invite open while signed in with wrong account
4. direct invite accept
5. direct invite already-member open
6. cold invite continue after sign-in
7. cold invite continue after sign-up
8. cold invite continue after verify-email completion
9. invalid invite open
10. expired invite open
11. revoked or previously consumed invite reopen
12. admin invite list, resend, refresh, revoke still work
13. workspace switcher state after invite-driven workspace entry

## Stop Signals

If implementation starts requiring any of these, stop and simplify:

- invite `status`
- additional invite schema fields
- a second continuation cookie
- auth core refactor
- generic auth or invite orchestration layer
- plugin-style abstraction
- workspace navigation redesign

## Final Recommendation

Proceed with this plan.

Reason:

- it hardens the unstable part of the system
- it keeps the stable auth base intact
- it gives the template one clear invite story
- it avoids turning a flow cleanup into a domain-model rewrite

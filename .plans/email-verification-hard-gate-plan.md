# Email Verification Hard Gate Plan

Date: 2026-03-24

## Goal

Change email verification from a soft in-app reminder to a hard auth boundary.

The target behavior is:

- an unverified user never gets an application session
- an unverified user never enters the application area
- sign-up and blocked sign-in both end in a clear pending-verification UX
- verification stays easy to recover with resend support
- the generic banner system stays in place, but the specific in-app email verification banner is removed

## Why This Is The More KISS Option

The current implementation is locally simpler, but systemically more complex:

- it allows `authenticated + unverified` as a first-class app state
- it pushes auth policy into application UI
- it relies on banner UX as a behavioral safety net

The hard-gate model is simpler at the system boundary:

- session exists only for verified users
- app routes only reason about `authenticated` vs `unauthenticated`
- verification UX lives in auth flow routes, not inside the app shell

This keeps behavior traceable as:

- form
- action
- auth service
- PocketBase

## Source Reference

This plan is based on:

- `/Users/fanda/Dev/start/.rules/kiss-project-architecture-principles.md`
- `/Users/fanda/Dev/start/src/server/auth/auth-service.ts`
- `/Users/fanda/Dev/start/src/server/auth/current-user.ts`
- `/Users/fanda/Dev/start/src/features/auth/sign-in/sign-in-form.tsx`
- `/Users/fanda/Dev/start/src/features/auth/sign-up/sign-up-form.tsx`
- `/Users/fanda/Dev/start/src/features/auth/verify-email/verify-email-form.tsx`
- `/Users/fanda/Dev/start/src/features/application/application-layout.tsx`
- `/Users/fanda/Dev/start/src/features/marketing/marketing-layout.tsx`
- `/Users/fanda/Dev/start/src/features/auth/email-verification-banner.tsx`
- `/Users/fanda/Dev/better-auth-canary/packages/better-auth/src/api/routes/sign-in.ts`
- `/Users/fanda/Dev/better-auth-canary/packages/better-auth/src/api/routes/sign-up.ts`
- `https://better-auth.com/docs/authentication/email-password`
- `https://better-auth.com/docs/reference/options`
- `https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#authentication-and-error-messages`

## Product Decision

Adopt the Better Auth-style model for email/password auth:

- require verified email before session creation
- optionally resend verification email on blocked sign-in
- route the user into a dedicated pending verification surface

Do not copy Better Auth infrastructure or abstractions.

Implement the same behavior directly in the existing `action -> service` flow.

## In Scope

- hard gate on sign-in for unverified users
- no auto-login after sign-up
- one shared pending verification page/flow
- public resend verification by email
- cleanup of legacy unverified sessions
- removal of the specific email verification banner from marketing/application layouts
- copy updates in both locales

## Out Of Scope

- OAuth verification policy
- admin backoffice tooling for verification status
- new generic notification framework
- new auth provider abstraction
- generic result-routing infrastructure
- test framework expansion
- mail template redesign beyond minimal verification copy needs

## Rules

- Keep the auth rule enforced in server auth code first.
- Prefer explicit branching over helper layers that only rename logic.
- Keep verification UX route-local to auth flow routes.
- Reuse the existing `/verify-email` route instead of adding a second parallel flow.
- Preserve the generic `LayoutBanners` infrastructure.
- Remove only the email-verification-specific banner usage.
- Avoid broad proxy or middleware policy beyond the existing auth cookie shortcut.

## Target UX

### After Sign-Up

- create the account
- request verification email
- do not create session
- redirect to `/verify-email` pending state with the submitted email

The page should clearly say:

- the account was created
- a verification email was sent
- access to the app is blocked until verification
- resend is available

### After Sign-In Attempt With Unverified Email

- reject sign-in with a dedicated auth error
- do not create session
- optionally resend verification email as a best-effort behavior
- send the user to the same pending verification page

The user should never remain on the sign-in form with only a generic failure message.

### After Clicking Verification Link

- confirm the token
- if verification succeeds and a session exists, continue to post-auth destination
- otherwise send the user to sign-in or the pending page with a clear outcome

## Workstream 1: Hard Gate In Server Auth

### Files

- `src/server/auth/auth-service.ts`
- `src/features/auth/auth-contract.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/auth-client.ts`

### Do

- add a dedicated auth error code such as `EMAIL_NOT_VERIFIED`
- in `signInWithPassword`, block session creation when `record.verified !== true`
- clear auth/device cookies when a blocked unverified sign-in hits existing auth state
- decide whether blocked sign-in should best-effort resend the verification email
- stop returning an authenticated session from sign-up

### Do Not

- do not keep `authenticated + unverified` as a valid long-term session state
- do not hide the new behavior in a generic policy helper

## Workstream 2: Pending Verification Flow

### Files

- `src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`
- `src/features/auth/verify-email/verify-email-form.tsx`
- one new route-local pending verification component file only if needed
- `messages/en.json`
- `messages/cs.json`

### Do

- reuse `/verify-email` for both token confirmation and pending-verification UX
- support at least these route states:
  - pending verification for a known email
  - resend success or cooldown state
  - invalid or expired token
  - successful verification continuation
- keep copy explicit and non-generic
- show resend CTA on the pending state

### Do Not

- do not add a separate generic auth result route if `/verify-email` can carry the states cleanly
- do not keep the user stranded on sign-in or sign-up forms after the server blocks access

## Workstream 3: Public Resend Verification By Email

### Files

- `src/server/auth/auth-service.ts`
- `src/features/auth/actions/auth-actions.ts`
- `src/features/auth/auth-client.ts`
- pending verification route-local UI

### Do

- add a public resend action that accepts an email
- always return a generic success response for non-existent or already-verified users
- only surface rate limiting if you want explicit user feedback
- keep the resend flow usable without a session

### Do Not

- do not depend on `requireCurrentUser()` for resend
- do not expose whether the email exists in the system

## Workstream 4: Legacy Session Cleanup

### Files

- `src/server/auth/auth-service.ts`
- `src/server/auth/current-user.ts`
- any route relying on `getServerAuthSession()` only if follow-up cleanup is needed

### Do

- treat `verified !== true` as unauthorized during session refresh
- clear cookies from:
  - `getServerAuthSession()`
  - `getApiAuthSession()`
  - `requireCurrentUser()`
- ensure previously created unverified sessions are invalidated on next server touch

### Do Not

- do not preserve legacy unverified sessions for compatibility

## Workstream 5: Remove The Specific In-App Verification Banner

### Files

- `src/features/application/application-layout.tsx`
- `src/features/marketing/marketing-layout.tsx`
- `src/features/auth/email-verification-banner.tsx`
- `src/features/auth/email-verification.ts`
- `src/features/auth/use-email-verification.ts`

### Do

- remove the unverified-email banner wiring from application and marketing layouts
- keep `LayoutBanners` intact for future marketing and critical messaging
- remove now-unused email-verification banner code if nothing else depends on it

### Do Not

- do not remove the shared banner infrastructure
- do not mix future marketing banner work into this branch

## Workstream 6: Sign-In And Sign-Up UX Plumbing

### Files

- `src/features/auth/sign-in/sign-in-form.tsx`
- `src/features/auth/sign-up/sign-up-form.tsx`
- auth route-local helpers only if needed

### Do

- on sign-up success, redirect to pending verification instead of post-auth destination
- on `EMAIL_NOT_VERIFIED`, redirect to pending verification or render a clear bridge state immediately before redirect
- keep field validation and form structure intact
- ensure the final UI explains what happened and what the next action is

### Do Not

- do not show only a generic destructive alert for unverified users
- do not call `replaceToPostAuthDestination()` from sign-up success anymore

## Better Auth Alignment

Better Auth is the right comparison model here, but only at the behavior level:

- `requireEmailVerification` blocks session creation before sign-in succeeds
- `sendOnSignIn` controls whether verification email is resent on blocked sign-in
- `autoSignInAfterVerification` is optional, not required for the hard gate model
- sign-up behavior changes when session is not returned, partly to support enumeration protection

What we should copy:

- the hard gate semantics
- optional resend on blocked sign-in
- explicit recovery path for the user

What we should not copy:

- provider/plugin abstractions
- framework-level option plumbing
- generic endpoint middleware systems

## Recommended Implementation Order

1. Add the new auth error code and hard-gate sign-in.
2. Remove auto-login after sign-up.
3. Add public resend-by-email support.
4. Expand `/verify-email` into the shared pending verification surface.
5. Rewire sign-in and sign-up forms to land there.
6. Invalidate legacy unverified sessions on refresh/current-user checks.
7. Remove the specific email verification banner from app and marketing layouts.
8. Clean up no-longer-used helpers and copy.

## Estimated Implementation Size

Working estimate for the full recommended scope:

- roughly `180-260 added LoC`
- roughly `70-120 deleted LoC`
- roughly `250-380 changed LoC`

Lower-bound variant if the pending page reuses most of the existing verify-email surface cleanly:

- roughly `150-220 added LoC`
- roughly `60-100 deleted LoC`

Likely distribution by area:

- server auth hard gate and legacy session cleanup: `70-110 changed LoC`
- public resend-by-email flow: `35-60 changed LoC`
- sign-in/sign-up UX plumbing: `30-55 changed LoC`
- pending verification page states and route UX: `50-90 changed LoC`
- banner removal and dead code cleanup: `20-40 changed LoC`
- locale copy updates: `20-35 changed LoC`

## Done When

- unverified email/password users never get a usable session
- app routes never render for unverified users
- sign-up lands on a clear pending verification state
- blocked sign-in lands on a clear pending verification state
- resend verification works without an authenticated session
- old unverified sessions are cleared on refresh/current-user checks
- the specific email verification banner is removed from app and marketing layouts
- no new abstraction layer was added to support this behavior

## Manual Verification

Run these flows manually before closing the branch:

1. sign up with a fresh email
2. confirm no app session is created after sign-up
3. land on pending verification page after sign-up
4. resend verification from pending page
5. sign in with an unverified account
6. confirm sign-in is blocked and no app session is created
7. land on pending verification page after blocked sign-in
8. verify email from the email link and continue into the app
9. load the app with a previously-created unverified session and confirm it is cleared
10. confirm application and marketing layouts no longer render the old email verification banner

## Stop Signals

If implementation starts drifting into any of these, stop and simplify:

- a new generic auth state machine
- a generic result/flash routing framework
- banner infrastructure redesign
- provider-neutral auth abstraction
- verify-flow duplication across multiple routes
- large refactors unrelated to email verification access control

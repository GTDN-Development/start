# Auth System

## What This Solves

This layer handles application authentication for the current app.

It owns:

- password sign-in
- password sign-up
- sign-out
- server session resolution
- email verification
- password reset
- email change confirmation
- post-auth destination handoff

The goal is a direct PocketBase-backed auth flow with SSR-safe session handling and a small client API.

## Current Scope

Currently implemented:

- email and password auth
- PocketBase auth cookie handling on the server
- device session validation on protected server flows
- client session store with server refresh
- localized auth routes and forms
- personal-home-first post-auth navigation with invite-aware workspace handoff
- explicit Route Handler boundaries for verify-email completion and render-time post-auth redirects

Not currently implemented:

- OAuth
- MFA or OTP
- auth provider abstraction layers

## How It Works

The flow stays intentionally direct:

1. client form calls an auth client function
2. auth client calls a server action, or a URL token lands in a dedicated Route Handler
3. the action or handler validates input and calls the focused auth server service
4. auth service talks to PocketBase and may return serialized `setCookie[]`
5. only the action or Route Handler commits those cookies
6. after successful auth, the UI hands off to `/post-auth`, which resolves the destination

Short version:

- client API handles UI-facing calls
- server actions handle form validation and Turnstile checks
- Route Handlers handle URL-token flows and redirect-plus-cookie handoffs
- auth services handle PocketBase auth work
- workspace domain participates only for invite-aware post-auth destination resolution

## File Map

- auth session service: [auth-session-service.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-session-service.ts)
- auth sign-up service: [auth-sign-up-service.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-sign-up-service.ts)
- auth email verification service: [auth-email-verification-service.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-email-verification-service.ts)
- auth password reset service: [auth-password-reset-service.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-password-reset-service.ts)
- current user guard: [current-user.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/current-user.ts)
- auth cookie writers: [auth-cookies.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-cookies.ts)
- PocketBase server client: [pocketbase-server.ts](/Users/fanda/Dev/start/apps/web/src/server/pocketbase/pocketbase-server.ts)
- auth server actions: [auth-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-actions.ts)
- auth client API and session store: [auth-client.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-client.ts)
- route proxy guard: [auth-proxy.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-proxy.ts)
- post-auth Route Handler: [route.ts](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.ts>)
- session endpoint: [route.ts](/Users/fanda/Dev/start/apps/web/src/app/api/auth/session/route.ts)
- verify-email completion Route Handler: [route.ts](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/verify-email/complete/route.ts>)
- PocketBase email-link bridge: [route.ts](/Users/fanda/Dev/start/apps/web/src/app/api/pocketbase/email-link/route.ts)

## Supported Flows

### Sign In

- entrypoint: `signIn()` in [auth-client.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-client.ts)
- server action: `signInAction()`
- service: `signInWithPassword()`

`rememberMe` decides whether the auth session is session-only or persistent.

Important unverified-account rule:

- an unverified sign-in may bootstrap PocketBase auth cookies so the verification flow can continue
- an unverified sign-in must not create a custom `device_session`
- the custom device session starts only after successful email verification

### Sign Up

- entrypoint: `signUp()`
- server action: `signUpAction()`
- guarded by Turnstile
- service: `signUpWithPassword()`

Current behavior:

- creates the PocketBase user
- requests a verification email
- bootstraps PocketBase auth cookies for the pending verification flow
- does not create a custom device session before verification

### Sign Out

- entrypoint: `signOut()`
- service: `signOutServerSession()`

Current behavior:

- clears PocketBase auth cookies
- clears the device session cookie
- attempts to revoke the current device session record
- clears `active_workspace` at the server action boundary

### Email Flows

Implemented in the focused auth services under [apps/web/src/server/auth](/Users/fanda/Dev/start/apps/web/src/server/auth):

- `confirmEmailVerificationToken()`
- `requestPasswordResetForEmail()`
- `confirmPasswordResetToken()`
- `requestEmailVerificationForEmail()`
- `confirmEmailChangeToken()`

Turnstile is currently used for:

- sign-up
- password reset request

Current URL-token rule:

- `/api/pocketbase/email-link` stays the stable backend-facing bridge
- `verify-email` links are redirected to [verify-email/complete route](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/verify-email/complete/route.ts>)
- [verify-email page](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/verify-email/page.tsx>) is UI-only and does not mutate cookies

## Cookie Boundary

In Next.js 16, render-time server code is cookie-read-only.

Rules:

- pages, layouts, and other Server Components may read auth state but must not call cookie mutation helpers
- auth and workspace services may return `setCookie[]`, but that is only response metadata
- Server Actions commit auth cookies via [auth-cookies.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-cookies.ts)
- Route Handlers commit auth cookies on `NextResponse`
- workspace preference cookies are also written only in Server Actions or Route Handlers

## Route Protection

Protection is intentionally two-layered.

### Proxy Guard

[proxy.ts](/Users/fanda/Dev/start/apps/web/src/proxy.ts) uses [auth-proxy.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-proxy.ts) to do a fast cookie-presence redirect for protected prefixes:

- `/app`
- `/w`
- `/account`

Important rule:

- [proxy.ts](/Users/fanda/Dev/start/apps/web/src/proxy.ts) is optimistic only
- real auth decisions happen in server checks near the data
- cleanup is committed later by a Server Action, a Route Handler, or [session refresh endpoint](/Users/fanda/Dev/start/apps/web/src/app/api/auth/session/route.ts)

### Server Guard

Protected layouts and pages still use server-side auth checks through:

- [current-user.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/current-user.ts)
- [getServerAuthSession()](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-session-service.ts)
- [getResponseAuthSession()](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-session-service.ts)

The split is intentional:

- render-time checks stay read-only
- render-time checks may treat invalid or stale auth as unauthenticated, but they do not emit cleanup cookies
- response-writing checks own `authRefresh()`, device-session heartbeat updates, and `setCookie[]` cleanup metadata
- cookie cleanup is committed only later by a Server Action, a Route Handler, or [session refresh endpoint](/Users/fanda/Dev/start/apps/web/src/app/api/auth/session/route.ts)

## Session Model

There are three auth-related cookie concerns:

- PocketBase auth cookie: main authenticated server identity
- device session cookie: current browser or device session tracking
- persist flag cookie: persistent vs session-only auth

Important rule:

- the server creates a fresh PocketBase instance per request
- auth state is loaded from request cookies into that instance
- protected flows validate the device session, not only PocketBase auth cookie presence
- custom device sessions are created only for verified accounts

## Post-Auth Navigation

Auth does not directly hardcode a workspace landing page anymore.

After successful auth, the sign-in UI performs a direct handoff to `/post-auth`.

Authenticated render-time guest routes also use [post-auth route handler](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.ts>) instead of mutating cookies during layout render.

These boundaries:

- verify the authenticated session
- read the pending invite cookie when present
- ask the workspace domain only for post-auth destination resolution
- clear `pending_invite` only when an invite redirect is actually chosen
- set `active_workspace` only when a workspace redirect is actually chosen
- default to `/app` when there is no workspace-specific outcome

In the current shell model, `/app` is the personal home scope, not a workspace surrogate.

Possible post-auth outcomes are:

- `/app`
- `/w/[workspaceSlug]/overview`
- `/invite/[token]`

This keeps auth focused on auth while preserving signed-out invite handoff through one explicit response-writing authority.

## Current Guest/Auth Route Behavior

The main auth-facing routes are:

- `/sign-in`
- `/sign-up`
- `/post-auth`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/verify-email/complete`
- `/confirm-email-change`
- `/invite/[token]`

Authenticated visitors hitting guest auth pages are redirected to `/post-auth` through [layout.tsx](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(guest)/layout.tsx>).

## Current Constraints

- password auth is the only implemented auth method
- no OAuth or MFA service exists yet
- auth responses use direct typed unions, not a provider-neutral auth abstraction
- workspace integration inside auth is limited to invite-aware post-auth destination handling

## Common Changes

Adding a new auth UI flow:

- add the server action or Route Handler boundary
- add or extend the focused auth service entrypoint
- expose a small client helper only if the UI needs one
- keep post-auth destination handling in `/post-auth` as the only destination authority

Changing session behavior:

- check [pocketbase-server.ts](/Users/fanda/Dev/start/apps/web/src/server/pocketbase/pocketbase-server.ts)
- check [device-sessions-cookie.ts](/Users/fanda/Dev/start/apps/web/src/server/device-sessions/device-sessions-cookie.ts)
- check [current-user.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/current-user.ts)
- keep render paths read-only; move cookie writes to a Server Action or Route Handler

Changing post-auth routing:

- check [post-auth route](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.ts>)
- check [workspace-resolution-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-resolution-service.ts)

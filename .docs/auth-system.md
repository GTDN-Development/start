# Auth System

## What This Solves

This layer handles application auth for the current app.

- password sign-in
- password sign-up
- sign-out
- server session resolution
- email verification
- password reset
- email change confirmation

The goal is a simple PocketBase-backed auth flow with SSR-safe session handling and a small client API.

## Current Scope

Currently implemented:

- email + password auth
- PocketBase auth cookie handling on the server
- device session validation on protected server flows
- client session store with server refresh
- localized auth routes and forms

Not currently implemented:

- OAuth
- MFA / OTP
- auth provider abstraction layer

## How It Works

The flow is intentionally direct:

1. client form calls an auth client function
2. auth client calls a server action
3. server action validates input and calls `auth-service.ts`
4. auth service talks to PocketBase and returns `setCookie` headers
5. action finalizes cookies and returns a typed auth response
6. post-auth navigation is handled by the auth UI and workspace resolver

Short version:

- client API handles UI-facing calls
- server actions handle validation and Turnstile checks
- auth service handles PocketBase auth work
- server cookie helpers apply the returned cookies

## File Map

- auth server service: [auth-service.ts](/Users/fanda/Dev/start/src/server/auth/auth-service.ts)
- current user guard: [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts)
- auth cookie applier: [auth-cookies.ts](/Users/fanda/Dev/start/src/server/auth/auth-cookies.ts)
- PocketBase server client: [pocketbase-server.ts](/Users/fanda/Dev/start/src/server/pocketbase/pocketbase-server.ts)
- auth server actions: [auth-actions.ts](/Users/fanda/Dev/start/src/features/auth/actions/auth-actions.ts)
- auth client API + session store: [auth-client.ts](/Users/fanda/Dev/start/src/features/auth/auth-client.ts)
- route proxy guard: [auth-proxy.ts](/Users/fanda/Dev/start/src/features/auth/auth-proxy.ts)
- session endpoint: [route.ts](/Users/fanda/Dev/start/src/app/api/auth/session/route.ts)
- PocketBase email-link bridge: [route.ts](/Users/fanda/Dev/start/src/app/api/pocketbase/email-link/route.ts)
- guest auth layout guard: [layout.tsx](/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/layout.tsx)
- application layout guard: [layout.tsx](/Users/fanda/Dev/start/src/app/[locale]/(application)/layout.tsx)

## Supported Flows

### Sign In

- entrypoint: `signIn()` in [auth-client.ts](/Users/fanda/Dev/start/src/features/auth/auth-client.ts)
- server action: `signInAction()`
- service: `signInWithPassword()`
- result: PocketBase auth cookie + device session cookie

`rememberMe` controls whether the session is session-only or persistent.

### Sign Up

- entrypoint: `signUp()`
- server action: `signUpAction()`
- guarded by Turnstile
- service: `signUpWithPassword()`

Current behavior:

- creates the PocketBase user
- explicitly requests a verification email
- signs the user in immediately
- creates a persistent device session

### Sign Out

- entrypoint: `signOut()`
- service: `signOutServerSession()`

Current behavior:

- clears PocketBase auth cookies
- clears the device session cookie
- attempts to revoke the current device session record

### Email Flows

Implemented in `auth-service.ts`:

- `confirmEmailVerificationToken()`
- `requestPasswordResetForEmail()`
- `confirmPasswordResetToken()`
- `requestEmailVerificationForCurrentUser()`
- `confirmEmailChangeToken()`

Turnstile is currently used for:

- sign-up
- password reset request

## Current Routes

The main auth-facing routes are:

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/confirm-email-change`

PocketBase email links currently enter through `/api/pocketbase/email-link` and are redirected to the localized app route with the token attached.

## Session Model

There are two auth-related cookie concerns:

- PocketBase auth cookie: main authenticated server identity
- device session cookie: current browser/device session tracking

There is also a persist flag cookie used to distinguish persistent vs session-only auth.

Important rule:

- the server always creates a fresh PocketBase instance per request
- auth state is loaded from cookies into that request-local instance
- protected flows also validate the device session, not only the PocketBase auth token

That validation happens in [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts).

## Route Protection

Protection is intentionally two-layered.

### Proxy Guard

[proxy.ts](/Users/fanda/Dev/start/src/proxy.ts) uses [auth-proxy.ts](/Users/fanda/Dev/start/src/features/auth/auth-proxy.ts) to do a fast cookie-presence redirect for protected route prefixes:

- `/overview`
- `/w`
- `/account`

This is a fast first pass, not the final source of truth.

### Server Layout / Server Session Guard

Protected layouts and pages still call `getServerAuthSession()`.

That is the real runtime check and handles:

- invalid auth cookies
- missing user records
- stale or invalid sessions
- cookie cleanup when needed

## Client Session Store

The client session store lives in [auth-client.ts](/Users/fanda/Dev/start/src/features/auth/auth-client.ts).

It uses:

- `useSyncExternalStore`
- `GET /api/auth/session`
- `BroadcastChannel` for cross-tab sync
- visibility/online refresh for authenticated tabs

The goal is to keep client auth state small and server-sourced, not duplicated across many hooks.

## Post-Auth Navigation

Auth itself does not decide the final application destination.

After successful auth, the UI uses [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts), which calls the workspace post-auth resolver and then either:

- redirects to the resolved workspace overview route
- routes to an explicit invite result state for mismatch or invalid/expired invites

This keeps auth focused on auth, while workspace selection stays in the workspace domain.

## Current Constraints

- password auth is the only implemented auth method
- there is no OAuth or MFA service yet
- route protection depends on PocketBase auth cookies plus device session validation
- auth responses use direct typed unions, not a provider-agnostic auth abstraction

## Common Changes

Adding a new auth UI flow:

- add the server action
- add or extend the auth service entrypoint
- expose a small client helper only if the UI needs one
- keep post-auth workspace resolution as a direct follow-up call, not a hook system

Changing session behavior:

- check [pocketbase-server.ts](/Users/fanda/Dev/start/src/server/pocketbase/pocketbase-server.ts)
- check [device-sessions-cookie.ts](/Users/fanda/Dev/start/src/server/device-sessions/device-sessions-cookie.ts)
- check [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts)

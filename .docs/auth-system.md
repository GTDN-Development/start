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

Not currently implemented:

- OAuth
- MFA or OTP
- auth provider abstraction layers

## How It Works

The flow stays intentionally direct:

1. client form calls an auth client function
2. auth client calls a server action
3. server action validates input and calls [auth-service.ts](/Users/fanda/Dev/start/src/server/auth/auth-service.ts)
4. auth service talks to PocketBase and returns `setCookie` headers
5. the action finalizes cookies and returns a typed auth response
6. after successful auth, the UI resolves the post-auth destination

Short version:

- client API handles UI-facing calls
- server actions handle validation and Turnstile checks
- auth service handles PocketBase auth work
- workspace domain participates only for invite-aware post-auth destination resolution

## File Map

- auth server service: [auth-service.ts](/Users/fanda/Dev/start/src/server/auth/auth-service.ts)
- current user guard: [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts)
- auth cookie applier: [auth-cookies.ts](/Users/fanda/Dev/start/src/server/auth/auth-cookies.ts)
- PocketBase server client: [pocketbase-server.ts](/Users/fanda/Dev/start/src/server/pocketbase/pocketbase-server.ts)
- auth server actions: [auth-actions.ts](/Users/fanda/Dev/start/src/features/auth/actions/auth-actions.ts)
- auth client API and session store: [auth-client.ts](/Users/fanda/Dev/start/src/features/auth/auth-client.ts)
- route proxy guard: [auth-proxy.ts](/Users/fanda/Dev/start/src/features/auth/auth-proxy.ts)
- post-auth client redirect helper: [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts)
- session endpoint: [route.ts](/Users/fanda/Dev/start/src/app/api/auth/session/route.ts)
- PocketBase email-link bridge: [route.ts](/Users/fanda/Dev/start/src/app/api/pocketbase/email-link/route.ts)

## Supported Flows

### Sign In

- entrypoint: `signIn()` in [auth-client.ts](/Users/fanda/Dev/start/src/features/auth/auth-client.ts)
- server action: `signInAction()`
- service: `signInWithPassword()`

`rememberMe` decides whether the auth session is session-only or persistent.

### Sign Up

- entrypoint: `signUp()`
- server action: `signUpAction()`
- guarded by Turnstile
- service: `signUpWithPassword()`

Current behavior:

- creates the PocketBase user
- requests a verification email
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

Implemented in [auth-service.ts](/Users/fanda/Dev/start/src/server/auth/auth-service.ts):

- `confirmEmailVerificationToken()`
- `requestPasswordResetForEmail()`
- `confirmPasswordResetToken()`
- `requestEmailVerificationForCurrentUser()`
- `confirmEmailChangeToken()`

Turnstile is currently used for:

- sign-up
- password reset request

## Route Protection

Protection is intentionally two-layered.

### Proxy Guard

[proxy.ts](/Users/fanda/Dev/start/src/proxy.ts) uses [auth-proxy.ts](/Users/fanda/Dev/start/src/features/auth/auth-proxy.ts) to do a fast cookie-presence redirect for protected prefixes:

- `/app`
- `/w`
- `/account`

### Server Guard

Protected layouts and pages still use server-side auth checks through:

- [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts)
- [getServerAuthSession()](/Users/fanda/Dev/start/src/server/auth/auth-service.ts)

That is the real runtime check and handles:

- invalid auth cookies
- missing user records
- stale or invalid sessions
- cookie cleanup when needed

## Session Model

There are three auth-related cookie concerns:

- PocketBase auth cookie: main authenticated server identity
- device session cookie: current browser or device session tracking
- persist flag cookie: persistent vs session-only auth

Important rule:

- the server creates a fresh PocketBase instance per request
- auth state is loaded from request cookies into that instance
- protected flows validate the device session, not only PocketBase auth cookie presence

## Post-Auth Navigation

Auth does not directly hardcode a workspace landing page anymore.

After successful auth, the UI uses [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts), which calls `resolvePostAuthDestinationAction()` in [auth-actions.ts](/Users/fanda/Dev/start/src/features/auth/actions/auth-actions.ts).

That action:

- verifies the authenticated session
- asks the workspace domain only for pending invite outcome resolution
- defaults to `/app` when there is no workspace-specific outcome

In the current shell model, `/app` is the personal home scope, not a workspace surrogate.

Possible post-auth outcomes are:

- `/app`
- `/w/[workspaceSlug]/overview`
- `/invite/result?state=email_mismatch`
- `/invite/result?state=invalid_or_expired`
- `/invite/result?state=error`

This keeps auth focused on auth while preserving signed-out invite handoff.

## Current Guest/Auth Route Behavior

The main auth-facing routes are:

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/confirm-email-change`
- `/invite/[token]`
- `/invite/result`

Authenticated visitors hitting guest auth pages are redirected to `/app` through [src/app/[locale]/(auth)/(guest)/layout.tsx](</Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/layout.tsx>).

## Current Constraints

- password auth is the only implemented auth method
- no OAuth or MFA service exists yet
- auth responses use direct typed unions, not a provider-neutral auth abstraction
- workspace integration inside auth is limited to invite-aware post-auth destination handling

## Common Changes

Adding a new auth UI flow:

- add the server action
- add or extend the auth service entrypoint
- expose a small client helper only if the UI needs one
- keep post-auth destination handling as one explicit follow-up call

Changing session behavior:

- check [pocketbase-server.ts](/Users/fanda/Dev/start/src/server/pocketbase/pocketbase-server.ts)
- check [device-sessions-cookie.ts](/Users/fanda/Dev/start/src/server/device-sessions/device-sessions-cookie.ts)
- check [current-user.ts](/Users/fanda/Dev/start/src/server/auth/current-user.ts)

Changing post-auth routing:

- check [auth-actions.ts](/Users/fanda/Dev/start/src/features/auth/actions/auth-actions.ts)
- check [post-auth-redirect.ts](/Users/fanda/Dev/start/src/features/auth/post-auth-redirect.ts)
- check [workspace-resolution-service.ts](/Users/fanda/Dev/start/src/server/workspaces/workspace-resolution-service.ts)

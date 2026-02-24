# PocketBase Auth Integration Summary (This Session)

## Scope Completed

This session implemented a KISS authentication foundation for PocketBase + Next.js, including:

- Login
- Registration
- Logout
- Platform route protection (auth required)
- Guest-only auth pages (`login`, `sign-up`, `forgot-password`)
- Password reset flow (request + token confirm)
- Email verification flow (token confirm)
- Auth-aware marketing navbar/footer
- Shared avatar account dropdown (marketing + platform)
- Email verification status display in the account dropdown

No password reset "resend"/extra polishing flows were added beyond the working basics.

## Architecture Decisions

## 1. Server-side auth state (PocketBase cookie)

Auth is handled server-side using the PocketBase `pb_auth` cookie (`HttpOnly`), not client-side local state.

- Server helper: `/Users/fanda/Dev/start/src/lib/pocketbase/server.ts`
- A new PocketBase client is created per request (no shared singleton on the server)
- Auth cookie is loaded from `next/headers` cookies via `await cookies()`
- Helpers exist to set and clear the `pb_auth` cookie

Why this approach:

- KISS and secure (`HttpOnly` cookie)
- Works well with Next.js App Router server layouts
- Keeps auth checks and redirects on the server

## 1b. `proxy.ts` responsibility (i18n only)

`/Users/fanda/Dev/start/src/proxy.ts` is intentionally kept focused on `next-intl` request routing.

- `proxy.ts` preserves the existing `next-intl` middleware behavior
- It does not perform PocketBase auth refresh/clear logic
- Auth/session checks remain in server layouts and route handlers

Why this hybrid approach:

- Keeps `proxy.ts` minimal and easier to reason about
- Avoids cross-cutting auth cookie rewrite logic on every page request
- Keeps the security boundary explicit in layouts and route handlers

Security boundaries remain:

- Server layouts/route handlers enforce auth redirects/denials
- PocketBase rules enforce authorization for data access

## 2. Route-group auth model

The app is split by experience/layout, not only by auth status:

- `(marketing)` = public website layout (available to everyone)
- `(platform)` = authenticated app routes only
- `(auth)` = auth UI shell

Inside `(auth)` we now use nested route groups:

- `(auth)/(guest)` = guest-only pages (`login`, `sign-up`, `forgot-password`)
- `(auth)/(flow)` = token/action pages that should work for both logged-out and logged-in users (`reset-password`, `verify-email`)

This avoids brittle page-specific exceptions in one layout and keeps auth-related routes grouped cleanly.

## 3. Auth-aware UI via server props

Because `pb_auth` is `HttpOnly`, client components cannot read auth directly.

Pattern used:

1. Read auth in server layout (`(marketing)` / `(platform)`)
2. Build a small `viewer`/`user` object
3. Pass it down as props to client layout/header components

This is the correct approach for Next.js App Router with secure cookies.

## Implemented Core Files

## Proxy / i18n Routing

- `/Users/fanda/Dev/start/src/proxy.ts`

Provides:

- `next-intl` route handling
- No PocketBase auth/session mutation logic in proxy

## PocketBase Server Helpers

- `/Users/fanda/Dev/start/src/lib/pocketbase/server.ts`

Provides:

- `createPocketBaseClient()`
- `createServerPocketBaseClient()`
- `setPocketBaseAuthCookie(...)`
- `clearPocketBaseAuthCookie(...)`

## API Routes (Auth)

- `/Users/fanda/Dev/start/src/app/api/login/route.ts`
- `/Users/fanda/Dev/start/src/app/api/sign-up/route.ts`
- `/Users/fanda/Dev/start/src/app/api/logout/route.ts`
- `/Users/fanda/Dev/start/src/app/api/forgot-password/route.ts`
- `/Users/fanda/Dev/start/src/app/api/reset-password/route.ts`
- `/Users/fanda/Dev/start/src/app/api/verify-email/route.ts`

### Behavior summary

`POST /api/login`

- Validates payload
- Authenticates via `users.authWithPassword(...)`
- Sets `pb_auth` cookie
- Supports `rememberMe`

`POST /api/sign-up`

- Validates fields, password match, terms
- Creates PocketBase auth user
- Requests verification email (best effort)
- Attempts auto-login
- If auto-login is blocked (e.g. verification required), still returns success and redirects to `/login`

`POST /api/logout`

- Requires same-origin `Origin`/`Referer` (simple CSRF/origin guard)
- Clears `pb_auth` cookie
- Redirects with safe internal `redirectTo` only

`POST /api/forgot-password`

- Calls `requestPasswordReset(email)`
- Returns generic success for non-existing/invalid user cases (prevents email enumeration)

`POST /api/reset-password`

- Confirms reset token + updates password via PocketBase

`POST /api/verify-email`

- Confirms verification token via PocketBase
- Does not mutate the current auth session/cookie
- Redirect target is `/login`

## App Route Structure (Current)

Auth:

- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/layout.tsx` (shared auth shell)
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/layout.tsx` (guest-only guard)
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/login/page.tsx`
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/sign-up/page.tsx`
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/forgot-password/page.tsx`
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/reset-password/page.tsx`
- `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(flow)/verify-email/page.tsx`

Platform:

- `/Users/fanda/Dev/start/src/app/[locale]/(platform)/layout.tsx` (server auth guard)
- `/Users/fanda/Dev/start/src/app/[locale]/(platform)/dashboard/page.tsx`
- `/Users/fanda/Dev/start/src/app/[locale]/(platform)/settings/page.tsx` (minimal page so menu link works)

Marketing:

- `/Users/fanda/Dev/start/src/app/[locale]/(marketing)/layout.tsx` (reads auth and passes `viewer`)

## UI/UX Implementations

## Platform layout and protection

- `(platform)` routes are protected in `/Users/fanda/Dev/start/src/app/[locale]/(platform)/layout.tsx`
- Unauthenticated users are redirected to `/{locale}/login`
- Platform navbar now shows an account dropdown (shared component)

## Marketing layout auth-awareness

- Marketing routes remain public for both anonymous and logged-in users
- Header and footer adapt based on auth state
- Logged-in users do not see `Log in` / `Sign up` links

This follows the common pattern:

- marketing = public routes (still accessible when logged in)
- platform = authenticated app
- auth pages = guest-only

## Shared Account Dropdown (Marketing + Platform)

- Component: `/Users/fanda/Dev/start/src/components/layouts/user-account-menu.tsx`

Used in:

- `/Users/fanda/Dev/start/src/components/layouts/marketing/header.tsx`
- `/Users/fanda/Dev/start/src/components/layouts/platform/platform-layout.tsx`

Features:

- Dashboard link
- Settings link
- Logout action
- User name + email
- Email verification status (`verified` from PocketBase auth record)
- Two trigger modes:
  - default (avatar + name)
  - avatar-only (mobile)

## Mobile behavior (marketing + platform)

Marketing mobile navbar:

- If logged in:
  - avatar button is shown next to menu button
  - avatar opens the same account dropdown
  - mobile menu footer does not show login/sign-up buttons (only close button remains)
- If logged out:
  - login/sign-up buttons remain in mobile menu footer

Platform mobile navbar:

- Avatar-only trigger opens the same shared account dropdown

## Footer auth-awareness (marketing)

- Logged out: shows `Log in` / `Sign up`
- Logged in: shows user info + `Dashboard`, `Settings`, `Log out`

File:

- `/Users/fanda/Dev/start/src/components/layouts/marketing/footer.tsx`

## Auth Forms / Client Components Added

Implemented KISS client forms/pages for:

- Forgot password (request reset email)
- Reset password (token confirm)
- Verify email (token confirm)

Related components:

- `/Users/fanda/Dev/start/src/components/(auth)/forgot-password/forgot-password-form.tsx`
- `/Users/fanda/Dev/start/src/components/(auth)/reset-password/reset-password-form.tsx`
- `/Users/fanda/Dev/start/src/components/(auth)/verify-email/verify-email-form.tsx`

These use the existing API route pattern and localized messages.

## Internationalization (next-intl)

Added/updated localized messages in:

- `/Users/fanda/Dev/start/messages/en.json`
- `/Users/fanda/Dev/start/messages/cs.json`

Notable additions:

- platform account dropdown labels
- email verification status labels (`emailVerified`, `emailNotVerified`)
- forgot/reset/verify auth page and form copy
- duplicate email and auth error messaging updates

## PocketBase Email / SMTP Notes

SMTP was configured in PocketBase before implementing reset/verify flows (recommended order).

Important for testing:

- PocketBase email templates must link to your Next.js routes with `?token=...`
- Example routes:
  - `/{locale}/reset-password?token={{.Token}}`
  - `/{locale}/verify-email?token={{.Token}}`

## Base UI Notes / Gotchas Fixed

Two Base UI menu issues were fixed during this session:

1. `MenuGroupRootContext is missing`
- Cause: `DropdownMenuLabel` used outside `DropdownMenuGroup`
- Fix: wrap label in `DropdownMenuGroup`

2. `nativeButton` warning for menu item render prop
- Cause: `DropdownMenuItem` rendering a native `<button>` while `nativeButton` was false
- Fix: set `nativeButton={true}` for the logout dropdown item

A note about the `nativeButton` rule was added to:

- `/Users/fanda/Dev/start/AGENTS.md`

## Validation Performed

Throughout the session (after major changes), the following checks were run successfully:

- `npx eslint` (targeted changed files)
- `npx tsc --noEmit --pretty false`
- `npx next typegen` (needed after auth page route moves so generated route validator matched new paths)

## Current Auth/Route Behavior (Final State)

- `proxy.ts` handles `next-intl` routing only (no PocketBase session refresh/clear logic)
- `(marketing)` routes are public and auth-aware
- `(platform)` routes require auth
- `(auth)/(guest)` routes redirect authenticated users to dashboard
- `(auth)/(flow)` routes are available regardless of auth state (for token-based actions)
- Shared account dropdown is reused across marketing and platform navbars
- Dropdown shows email verification state from PocketBase `verified`

## What Is Intentionally Not Implemented Yet

- Password reset resend/polish beyond the core flow
- Dedicated profile page (currently `Dashboard` + `Settings` links exist)
- Resend verification email UI/action
- More advanced auth hardening (rate limiting, abuse protection, audit logging, etc.)
- Proxy-based session refresh/auto-extension (intentionally omitted for simplicity)
- CSRF/origin checks on other auth-related POST routes beyond logout (if needed)

The current implementation is intentionally simple and working, with a clean structure for future expansion.

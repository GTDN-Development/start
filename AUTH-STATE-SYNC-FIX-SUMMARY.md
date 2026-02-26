# Auth State Sync Fix Summary (2026-02-26)

## Problem

- Deleted users could still look logged in in another open tab.
- Email verification done in another tab/browser could leave stale `verified` UI.

## Root Cause

- Some layouts trusted the `pb_auth` cookie snapshot without calling PocketBase `authRefresh()`.
- A valid token does not guarantee the user still exists or that profile fields are fresh.

## What We Changed

- Enabled server-side auth revalidation in layouts with `createServerPocketBaseClient({ refreshAuth: true })`:
  - `/Users/fanda/Dev/start/src/app/[locale]/(platform)/layout.tsx`
  - `/Users/fanda/Dev/start/src/app/[locale]/(auth)/(guest)/layout.tsx`
  - `/Users/fanda/Dev/start/src/app/[locale]/(marketing)/layout.tsx`
- Added `/Users/fanda/Dev/start/src/app/api/auth/session/route.ts`:
  - runs `authRefresh()`
  - clears `pb_auth` if invalid
  - returns `changed` when auth/profile snapshot changed
- Added `/Users/fanda/Dev/start/src/components/shared/app/auth-session-sync.tsx` (mounted in `/Users/fanda/Dev/start/src/components/shared/app/providers.tsx`):
  - calls `/api/auth/session` on `focus` / `visibilitychange`
  - throttled (15s)
  - calls `router.refresh()` only when changed

## Why This Approach

- Low complexity, no realtime infrastructure.
- Fixes stale auth state on focus and on normal refresh/navigation.

## Tradeoff

- Background sync does not rewrite `pb_auth` on success (to avoid breaking `rememberMe` persistence).
- It still clears the cookie when session is invalid.

## Validation

- ESLint (changed files): passed
- `tsc --noEmit`: passed

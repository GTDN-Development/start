# 01. Auth Session Runtime And Cookie Flow

Source history: `aa4690f`

Depends on: none

Skip impact: auth code stays more duplicated and harder to reason about, but the app can still function.

## Goal

Restore a single, explicit auth resolution layer for read-only auth checks, action-time auth checks, and response-time session refresh.

## Value

- less duplicated auth and device-session logic
- fewer cookie-boundary mistakes in Next.js 16
- easier debugging of sign-in, sign-out, verify-email, and post-auth redirects

## Current Gap

Current `main` still spreads similar auth resolution logic across:

- `apps/web/src/server/auth/current-user.ts`
- `apps/web/src/server/auth/auth-session-service.ts`
- `apps/web/src/features/auth/auth-client-sync.ts`
- `apps/web/src/features/auth/auth-client-store.ts`

The lost refactor introduced a cleaner resolver-centric shape and reduced repeated checks around invalid auth cookies, device-session validation, and stale-session handling.

## Scope

- add back a dedicated resolver layer similar in intent to the lost `auth-resolution.ts`
- simplify `current-user.ts` and `auth-session-service.ts` to call the shared resolver instead of duplicating boundary logic
- re-evaluate whether the current split between `auth-client-sync.ts` and `auth-client-store.ts` is still justified or whether the old runtime shape is clearer
- keep the existing cookie-boundary rules: render-time code stays read-only, server actions and route handlers remain the only writers

## Non-goals

- new auth features
- OAuth work
- changes to the public auth UX

## Acceptance Criteria

- one canonical server-side auth resolution path exists
- invalid auth cookies and invalid device-session cookies are handled in one place
- transient PocketBase failure behavior remains intentional and covered
- sign-in, sign-out, verify-email completion, post-auth redirects, and invite accept redirects still behave correctly

## Validation

- update unit coverage around the extracted resolver
- keep `apps/web/src/server/auth/auth-cookies.test.ts` green
- rerun `apps/web/src/server/auth/auth-service.test.ts`
- rerun existing auth route tests under `apps/web/src/app/[locale]/(auth)/(flow)`

## Notes

This task is mainly about reducing duplication and making the auth boundary easier to trust. It is a good first task because later workspace and invite work sits on top of the same auth/session behavior.


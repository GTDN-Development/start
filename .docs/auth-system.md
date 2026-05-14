# Auth System

Auth is PocketBase-backed and routed through Next.js server actions and route handlers.

- Guest pages: sign in, sign up, forgot password.
- Flow pages: verify email, reset password, confirm email change, invite.
- Forms call server actions in [auth-actions.ts](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-actions.ts).
- Server services in [src/server/auth](/Users/fanda/Dev/start/apps/web/src/server/auth) call PocketBase and return typed payloads plus cookie mutations.
- The main auth cookie is PocketBase `pb_auth`; `pb_auth_persist` tracks remember-me persistence.
- Cookie writes happen only in server actions or route handlers, not during page render.
- [proxy.ts](/Users/fanda/Dev/start/apps/web/src/proxy.ts) only checks whether `pb_auth` exists before protected routes.
- Real session validation happens in [auth-session-service.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-session-service.ts).

Main flows:

- Sign up creates a PocketBase user, requests verification, then keeps a pending session when possible.
- Sign in accepts only verified users; unverified users are sent back to email verification.
- Email verification and invite redirects use route handlers so cookies can be committed safely.
- Password reset and email change use PocketBase tokens and clear auth cookies after completion.
- Post-auth routing sends users to a pending invite, active organization, or `/app`.

Useful files:

- [auth config](/Users/fanda/Dev/start/apps/web/src/config/auth.ts)
- [auth client wrapper](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-client.ts)
- [auth schemas](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-schemas.ts)
- [post-auth route](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.ts>)
- [verify-email complete route](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/verify-email/complete/route.ts>)

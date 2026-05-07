# Account System

Account settings manage the current PocketBase user after authentication.

- Profile settings update display name, avatar, and email-change requests.
- Security settings update password and delete the account.
- Avatar upload reuses the shared avatar preparation flow and validates again on the server.
- Email changes use PocketBase email-change tokens and are confirmed in the auth flow.
- Password changes and account deletion clear auth cookies because the current session should not survive.
- Account deletion also clears session-scoped app state like active organization and pending invite cookies.

Useful files:

- [profile actions](/Users/fanda/Dev/start/apps/web/src/features/account/profile/account-profile-actions.ts)
- [security actions](/Users/fanda/Dev/start/apps/web/src/features/account/security/account-security-actions.ts)
- [profile service](/Users/fanda/Dev/start/apps/web/src/server/account/account-profile-service.ts)
- [security service](/Users/fanda/Dev/start/apps/web/src/server/account/account-security-service.ts)
- [account schemas](/Users/fanda/Dev/start/apps/web/src/features/account/account-schemas.ts)
- [profile context](/Users/fanda/Dev/start/apps/web/src/features/account/account-profile-context.tsx)

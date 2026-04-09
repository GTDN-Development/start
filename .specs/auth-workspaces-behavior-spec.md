# Behavior Spec

## Scope

- Product-level behavior contract for a Next.js App Router SaaS template.
- Intended as input for Playwright E2E tests and Vitest business-rule tests.
- In scope: auth, personal scope, collaborative workspaces, invitations, access control, redirects, and key error states.
- Out of scope: billing, subscriptions, credits, seats, OAuth/SSO, magic links, OTP, 2FA, teams, and provider-specific implementation details.

## Testing References

- Next.js testing overview: https://nextjs.org/docs/app/guides/testing
- Next.js Vitest guide: https://nextjs.org/docs/app/guides/testing/vitest
- Next.js Playwright guide: https://nextjs.org/docs/app/guides/testing/playwright

## Email Link Localization

- PocketBase auth email templates are treated as single-template and not locale-aware.
- Auth email links therefore go through the app route `/api/pocketbase/email-link`, which resolves the effective locale and redirects to the localized auth flow route.
- This keeps email-link flows language-safe without duplicating PocketBase templates for each locale.

## Roles / Actors

- Guest: not authenticated.
- Authenticated user: authenticated and verified user in personal scope.
- Workspace member: can access a workspace but has read-only collaboration access.
- Workspace admin: can manage most workspace collaboration behavior except owner-only actions.
- Workspace owner: full workspace control.
- Personal scope: private default scope for every authenticated user; not shareable and not deletable.

## Auth Behavior

- Protected routes require a valid authenticated and verified session.
- An unverified account must not gain app access.
- Sign up with a new email sends the user to email verification.
- Sign up with an already used email shows an explicit "email already in use" error.
- Sign in with valid verified credentials resolves post-auth destination.
- Sign in with valid unverified credentials sends the user to email verification.
- Unverified sign-in does not auto-resend verification; resend is an explicit user action.
- Sign in with invalid credentials stays on sign-in and shows an actionable auth error.
- Email verification with a valid token succeeds.
- Email verification is idempotent: a link for an already verified email is treated as success.
- Email verification with an invalid or expired token shows a recoverable invalid state.
- Verification resend for unknown or already verified email shows generic success and only sends mail when needed.
- Forgot-password submission shows generic success for both known and unknown emails.
- Reset password with a valid token updates the password, clears the current browser session, and requires fresh sign-in.
- Reset password can also mark an unverified account verified when the reset token email still matches the current account email.
- Reset password with an invalid or expired token stays in the reset flow and requires a new reset link.
- Email change uses a secure confirmation flow.
- Confirming email change does not require an active session.
- Valid email-change token plus correct current password completes the change, invalidates existing sessions, and requires fresh sign-in with the new email.
- Change password from account settings revokes all sessions and requires fresh sign-in.
- Sign out redirects to sign-in.
- Account deletion is blocked if the user is the last owner of any workspace.
- If account deletion is allowed, the user is removed from all shared workspaces and then the account is deleted.

## Device Session Behavior

- The user-facing "Your Devices" list is backed by the custom `user_device_sessions` collection, not PocketBase `_authOrigins`.
- The list includes only active, non-expired device sessions for the current user.
- The current device is explicitly marked in the list.
- The user can revoke any non-current device session from the list.
- The user can revoke all other active device sessions in a single action.
- The current device is not revocable from the per-device list action; signing out the current device uses the standard sign-out flow.
- When the device-session limit is exceeded, the oldest non-current active sessions are deleted based on `last_seen_at`.
- Password change revokes every active device session, including the current one.
- PocketBase `_authOrigins` may still exist for auth-alert and origin-tracking behavior, but they are not the product's session-management model.

## Workspace Behavior

- Every authenticated user always has personal scope at `/app`.
- First-time users start in personal scope.
- Creating a workspace is always an explicit action.
- Creating a workspace makes the creator an owner, sets that workspace active, and redirects to its overview.
- Workspace root redirects to workspace overview.
- Unknown or inaccessible workspace routes render a workspace-scoped 404.
- Members page is accessible to all workspace members.
- Members can view the member roster and member roles.
- Pending invites are hidden from regular members.
- Admins and owners can view and manage pending invites.
- Admins and owners can change workspace name, slug, and avatar.
- Owners only can delete a workspace.
- Any workspace member can leave the workspace.
- The final remaining owner cannot leave until ownership is transferred.
- Changing a workspace slug redirects to the same workspace under the new slug.
- Leaving or deleting the currently active workspace returns the user to personal scope at `/app`.

## Access Rules

- Member can read workspace data and read the workspace roster.
- Member cannot change workspace settings.
- Member cannot create, resend, revoke, or inspect pending invites.
- Member cannot change roles or remove members.
- Admin can manage workspace general settings.
- Admin can create, resend, refresh, and revoke invitations.
- Admin can remove non-owner members.
- Admin can change roles for non-owner members, including other admins.
- Admin cannot promote anyone to owner.
- Admin cannot manage owners.
- Owner can perform all admin actions.
- Owner can promote another member or admin to owner.
- Multiple owners are allowed.
- Last-owner guard blocks downgrading or removing the final remaining owner.
- Delete-workspace is owner-only.
- Personal scope has no workspace-style membership, sharing, leave, or delete actions.

## Redirect Rules

- Application entry resolution is: valid active workspace -> workspace overview; otherwise `/app`.
- Post-auth resolution after successful sign-in or email verification is: pending invite -> active workspace if still accessible -> `/app`.
- Direct invite link without session stores pending invite state and sends the user through sign-in or verification.
- After successful auth with a pending invite, the user returns to invite handling before any other destination.
- Guest auth pages visited by an already signed-in user redirect to effective app entry.
- Effective app entry for guest-page redirects is: valid active workspace -> workspace overview; otherwise `/app`.
- Sign out redirects to sign-in.
- Self-initiated workspace leave redirects to `/app`.
- If the user loses workspace access by someone else's action, the next server navigation or mutation treats that workspace as inaccessible; direct workspace routes become workspace-404 and app entry falls back to `/app`.

## Invitation Behavior

- Invite acceptance requires an authenticated and verified user.
- Invite acceptance requires the signed-in email to match the invited email.
- Invite acceptance with a matching verified account adds membership and redirects to workspace overview.
- Invite acceptance for an already existing member redirects directly to workspace overview.
- Invite acceptance with the wrong signed-in account shows an email-mismatch state and requires switching accounts.
- Invalid or expired invite links show a blocked/error invite state and do not change membership.

## Error and Edge Cases

- Forgot-password must not reveal whether an email exists.
- Verification resend must not reveal whether an email exists or is already verified.
- Duplicate sign-up email is an intentional explicit error.
- Invalid or expired verification, reset, and invite tokens must resolve to recoverable user states.
- Route-level workspace access denial should look like not found, not like access denied.
- Mutation-level forbidden actions should surface as domain errors for business-rule testing.
- A stale active workspace must be ignored if the user no longer has access to it.
- Account deletion while last owner of any workspace must be blocked until ownership transfer or workspace deletion is completed.

## Open Questions

- None for the current scope.

## Candidate E2E Scenarios

1. Guest opens a protected route and is redirected to sign-in.
2. New user signs up, verifies email, and lands in `/app`.
3. Sign-up with existing email stays on sign-up and shows explicit duplicate-email error.
4. Unverified user signs in and is sent to verify email without automatic resend.
5. Verification resend shows generic success for an unknown email.
6. Forgot-password shows the same success state for known and unknown email.
7. Password reset succeeds and the user must sign in again.
8. User confirms an email change, is redirected to sign-in, and signs in again with the new email.
9. Signed-in user opening sign-in or sign-up is redirected to effective app entry.
10. User creates a workspace and lands on its overview as owner.
11. Member opens the members page, sees roster and roles, and does not see pending invites or management controls.
12. Admin invites a user, invited user follows the link while signed out, signs in, accepts, and lands on workspace overview.
13. Invited user signs in with the wrong email and sees the account-mismatch state.
14. Owner promotes another user to owner, then the original owner can leave successfully.
15. Final remaining owner attempts to leave and is blocked.
16. User opens an inaccessible workspace URL and gets workspace-scoped 404.
17. User removed from a workspace elsewhere loses that workspace on next app entry and falls back to `/app`.
18. Account security shows active device sessions, allows revoking a non-current device, and allows signing out all other devices.

## Candidate Business-Rule / Unit Scenarios

1. Post-auth destination resolver prioritizes pending invite over active workspace over `/app`.
2. Application entry resolver returns active workspace only when it is still accessible.
3. Duplicate sign-up email returns explicit duplicate-email outcome.
4. Verification resend returns generic success for unknown and already verified email.
5. Email verification is idempotent for already verified email.
6. Reset password clears the current browser session and requires fresh sign-in.
7. Reset password marks an unverified account verified only when the reset token email still matches the current account email.
8. Change password revokes all sessions and requires fresh sign-in.
9. Email-change confirmation succeeds without an active session when token and password are valid, then requires sign-in with the new email.
10. Custom device-session rules match the product behavior: active sessions only, current device flagged, non-current revoke allowed, revoke-other-devices allowed, and oldest sessions are deleted when the limit is exceeded.
11. Member/admin/owner capability matrix matches the access rules above.
12. Admin cannot manage owners or assign owner role.
13. Owner can promote another user to owner and multiple owners can coexist.
14. Final-owner downgrade, removal, or leave is blocked.
15. Members-page data for regular members excludes pending invites.
16. Invite acceptance requires both verified session and matching email.
17. Active workspace is cleared or ignored after leave, deletion, or external loss of access.
18. Account deletion is blocked while the user remains the final owner of any workspace.
19. Account deletion removes the user from shared workspaces when deletion is allowed.

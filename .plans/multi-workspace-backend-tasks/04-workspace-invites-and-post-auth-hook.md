# Task 04: Workspace invites and post-auth hook

## Goal
Implement the full invite lifecycle including token security, guest flow, auth integration after sign-in/sign-up, and fail-open behavior of auth endpoints.

## Scope
1. Implement `src/server/workspaces/workspace-invite-service.ts`:
   - `createInvite(...)`
   - `resendInvite(...)`
   - `revokeInvite(...)`
   - `validateInviteToken(rawToken)`
   - `acceptInviteByToken(rawToken, authenticatedUser)`
   - `consumePendingInviteIfAny(authenticatedUser)`
2. Implement `src/server/workspaces/post-auth-workspace-hook.ts`.
3. Integrate hook in `src/app/api/auth/[...all]/route.ts` after successful `sign-in` and `sign-up`.
4. Implement route flow for `GET /[locale]/invite/[token]`, including guest path.
5. Implement pending invite cookie flow (`pending_invite_hash`).

## Implementation steps
1. Persist only `token_hash` (SHA-256), keep raw token in-memory only.
2. Ensure token/hash are never logged.
3. Enforce email match: `normalize(user.email) === email_normalized`.
4. Make `consumePendingInviteIfAny` idempotent (no duplicate memberships).
5. Keep hook fail-open:
   - auth flow must not fail because of workspace hook errors
6. Return explicit hook statuses:
   - `none`, `consumed`, `email_mismatch`, `invalid_or_expired`, `transient_error`
7. Always clear `pending_invite_hash` on `email_mismatch` and `invalid_or_expired`.
8. On `transient_error`, log warning + best-effort retry in `/overview` bootstrap.
9. Add short hook timeout so auth endpoints are not blocked.
10. In invite route:
   - guest: persist pending hash and redirect to `/sign-in`
   - authenticated: attempt accept and redirect to workspace or error state

## Acceptance criteria
1. Invite tokens are stored only as hashes.
2. On email mismatch, membership is not created and pending cookie is cleared.
3. Sign-in/sign-up remain `ok: true` even on transient hook errors.
4. Invite acceptance is idempotent and safe to repeat.
5. Guest invite flow works from invite URL to post-login acceptance.

## User-visible behavior
1. Users can accept an invite even if they were logged out when opening the link.
2. After login, invite consumption runs automatically.
3. If invite email does not match account email, users get a clear reason.
4. Temporary backend issues do not block login.

## Dependencies
1. Task 01 (schema/rules for `workspace_invites`).
2. Task 02 (cookie helper, workspace selection).
3. Task 03 (member mutations).

## Coverage of source plan
1. Section 5.3 (`workspace-invite-service`)
2. Section 7 (Auth flow integration in plugin mode)
3. Section 8.3 (Invite route)
4. Section 10.3 (Never log tokens/hash)

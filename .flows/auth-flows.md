# Auth Flows

## Guards

- Protected route without auth cookie -> `/sign-in` -> user must sign in
- Guest route (`/sign-in`, `/sign-up`, `/forgot-password`) with active session -> `/app`

## Public Flows

- Sign in
  - Success -> `/app`
  - Success + pending invite cookie -> `/invite/[token]`
  - Email not verified -> `/verify-email?email=...` -> user must verify email from inbox
  - Invalid credentials -> stays on `/sign-in` -> user must fix input

- Sign up
  - Success -> `/verify-email?email=...` -> user must verify email from inbox
  - Email already in use / weak password / Turnstile failure -> stays on `/sign-up` -> user must fix input

- Verify email
  - Pending state -> stays on `/verify-email?email=...` -> user waits for email or resends verification
  - Valid token + session restored -> `/app`
  - Valid token + pending invite -> `/invite/[token]`
  - Valid token + no session -> `/verify-email?result=verified` -> user must go to sign in
  - Invalid or expired token -> `/verify-email?result=invalid` -> user must resend or retry

- Forgot password
  - Submit success -> stays on `/forgot-password` with success state -> user must open reset email
  - Unknown email behaves the same as success
  - Rate limit / Turnstile failure -> stays on page -> user must retry

- Reset password
  - Valid token + password update success -> `/sign-in` -> user must sign in again
  - Invalid or expired token -> stays on `/reset-password` -> user must request a new reset link

## Account And Security Flows

- Change email
  - Request success -> stays in `/account` dialog -> user must open email and confirm the change

- Confirm email change
  - Valid token + correct current password + session exists -> `/app`
  - Same + pending invite -> `/invite/[token]`
  - Valid token + no session -> `/sign-in`
  - Invalid token or wrong password -> stays on page -> user must retry

- Change password
  - Success -> stays on `/account/security` -> done
  - Unauthorized -> `/sign-in`
  - Note: password change does not currently force sign-out

- Sign out
  - Success -> `/sign-in`

- Sign out one other device
  - Success -> stays on `/account/security` -> device disappears from the list
  - Unauthorized -> `/sign-in`

- Sign out all other devices
  - Success -> stays on `/account/security` -> only current device remains
  - Unauthorized -> `/sign-in`

- Delete account
  - Success -> `/sign-in`
  - Unauthorized -> `/sign-in`
  - Wrong password -> stays in dialog -> user must fix password

## Invite Flow

- `/invite/[token]` without session + valid token -> `/invite/[token]/start` -> sets pending invite cookie -> `/sign-in`
- After sign in or email verification with pending invite cookie -> `/invite/[token]`
- `/invite/[token]` with session and matching email
  - Pending invite -> user must click Accept -> `/w/[workspaceSlug]/overview`
  - Already member -> direct to `/w/[workspaceSlug]/overview`
- `/invite/[token]` with session and different email -> user must sign out and sign in with the invited account
- Invalid or blocked invite -> stays on invite state page

## Not Present

- No magic link flow
- No OTP flow
- No 2FA flow
- Post-auth destination is currently only `/app`, unless there is a pending invite

# Invite Token Page Static Plan (`/[locale]/invite/[token]`)

## Goal

Prepare a fully static UI page for invite token handling so backend integration can be wired with minimal UI changes.

## Scope (Static Only)

- No real token validation.
- No real auth/session checks.
- No real accept/revoke API calls.
- All flows are represented via mock page states.

## Suggested Page Structure

1. Header section
- Title
- Short description of what this invite does
- Workspace name (and optionally avatar)

2. Invite summary block
- Invited email
- Target role (`Member`)
- Optional expiration info

3. Action/status block
- State-specific copy
- Primary and secondary CTA buttons

4. Optional alert/notice block
- Security and support hints for mismatch/expired/revoked/error states

## State Model (for static rendering)

Create one explicit state enum and mock payload:

```ts
type InvitePageState =
  | "loading"
  | "invite_valid_guest"
  | "invite_valid_member_accepting"
  | "invite_accepted_success"
  | "invite_invalid"
  | "invite_expired"
  | "invite_revoked"
  | "invite_email_mismatch"
  | "already_member"
  | "workspace_unavailable"
  | "generic_error";
```

## Required UI States

1. `loading`
- Message: validating invitation link.
- CTA: none (or disabled).

2. `invite_valid_guest`
- Message: invite is valid, user must sign in/sign up first.
- CTA primary: `Continue to sign in`.
- CTA secondary: `Create account`.

3. `invite_valid_member_accepting`
- Message: accepting invitation.
- CTA primary: pending/disabled (`Joining workspace...`).
- Keep page/dialog open until action resolves.

4. `invite_accepted_success`
- Message: invitation accepted.
- CTA primary: `Go to workspace`.

5. `invite_invalid`
- Message: link is invalid or malformed.
- CTA primary: `Go to overview` (or sign in).

6. `invite_expired`
- Message: invitation expired.
- CTA primary: `Request a new invitation`.

7. `invite_revoked`
- Message: invitation was revoked by workspace admin.
- CTA primary: `Contact workspace owner`.

8. `invite_email_mismatch`
- Message: signed-in email does not match invited email.
- Show both emails:
  - invited email
  - current signed-in email
- CTA primary: `Sign out and continue with another account`.

9. `already_member`
- Message: user is already a member.
- CTA primary: `Open workspace`.

10. `workspace_unavailable`
- Message: workspace no longer exists or is inaccessible.
- CTA primary: `Go to overview`.

11. `generic_error`
- Message: unexpected error.
- CTA primary: `Try again`.
- CTA secondary: `Go to overview`.

## Static Implementation Checklist

1. Add route page component for `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`.
2. Create a dedicated feature component under `src/features/auth/invite-token/*`.
3. Implement a single shell with conditional content by `InvitePageState`.
4. Add mock data object per state (workspace name, invited email, role, expiry date).
5. Add a local state switcher (dev-only or inline constant) for easy preview.
6. Ensure all buttons, alerts, and pending states visually match current app patterns.
7. Keep all copy static and simple; backend mapping comes later.

## Backend Mapping (Later)

When backend is ready, map response/result codes directly to `InvitePageState` values:

- valid token + guest => `invite_valid_guest`
- valid token + signed-in + accept pending => `invite_valid_member_accepting`
- accept success => `invite_accepted_success`
- token not found => `invite_invalid`
- token expired => `invite_expired`
- token revoked => `invite_revoked`
- email mismatch => `invite_email_mismatch`
- membership already exists => `already_member`
- workspace not accessible => `workspace_unavailable`
- fallback error => `generic_error`

# Workspace Refactor QA

## Automated Verification

Last implementation pass verified:

- `npm run lint`
- `npm run build`

These checks validate route typing, message typing, and production build integrity after the `/app` cutover.

## Manual QA Matrix

### Auth With No Invite

- Start signed out.
- Open `/sign-in` or `/sign-up`.
- Complete auth without a pending invite cookie.
- Expected result: redirect to `/app`.

### Auth With Pending Invite

- Start signed out.
- Open a valid `/invite/[token]` link.
- Continue through `/invite/[token]/start` into sign-in or sign-up.
- Expected result: after auth, redirect to `/w/[workspaceSlug]/overview`.

### Invalid Or Expired Invite After Auth

- Start signed out.
- Set up a stale or revoked pending invite flow.
- Complete auth.
- Expected result: redirect to `/invite/result?state=invalid_or_expired`.
- Expected non-goal: no silent fallback to `/app`.

### Pending Invite Resolution Failure

- Simulate a transient failure while consuming `pending_invite`.
- Complete auth.
- Expected result: redirect to `/invite/result?state=error`.
- Expected non-goal: no silent fallback to `/app`.

### Signed-In Invite Open

- Start signed in.
- Open `/invite/[token]` for:
  - pending invite
  - already-member invite
  - email mismatch
  - invalid or expired invite
- Expected result: each state remains explicit and workspace redirects persist `active_workspace` when accepted or already-member.

### Invalid Workspace Concrete Route

- Open `/w/nonexistent/overview`.
- Open `/w/nonexistent/settings`.
- Open `/w/nonexistent/settings/members`.
- Expected result: scoped not-found behavior.
- Expected non-goal: no redirect loop and no fallback through `/overview`.

### Stale Active Workspace Cookie On App Routes

- Set `active_workspace` to a slug that is no longer available.
- Open `/app`.
- Expected result: shell repairs the cookie to the first available workspace, or clears it when none exist.

### Zero-Workspace Authenticated Shell State

- Sign in as a user with zero workspaces.
- Open `/app`, `/account`, `/account/preferences`, and `/account/security`.
- Expected result: all remain usable.
- Expected result: workspace menu item is hidden.
- Expected result: workspace switcher shows create-only empty state.

### Switcher Outside Workspace Routes

- Start signed in with multiple workspaces.
- Open `/app`.
- Switch workspaces from the shell.
- Expected result: switcher uses the preferred workspace state and navigation goes to `/w/[workspaceSlug]/overview`.

### Membership Revoked Or Workspace Deleted In Another Session

- Open a workspace page.
- Remove membership or delete that workspace in a different session.
- Refresh the original page.
- Expected result: scoped not-found or safe redirect for follow-up actions, without a resolver loop through `/overview`.

## Review Focus

When re-checking this refactor later, prioritize:

- post-auth destination correctness
- invite outcome explicitness
- stale cookie repair
- zero-workspace shell behavior
- workspace route failure behavior

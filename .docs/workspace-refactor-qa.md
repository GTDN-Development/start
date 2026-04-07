# Workspace Refactor QA

## Automated Verification

Last implementation pass verified:

- `pnpm lint`
- `pnpm test`

These checks validate the cookie-boundary refactor, route typing, and regression coverage around render-time cookie writes.

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
- Expected result: redirect to `/invite/[token]` and render the blocked or invalid state there.
- Expected non-goal: no silent fallback to `/app` and no render-time cookie mutation.

### Pending Invite Resolution Failure

- Simulate a transient failure while resolving post-auth destination after reading `pending_invite`.
- Complete auth.
- Expected result: safe fallback to `/app` or explicit invite page state, depending on the failing step.
- Expected non-goal: no render-time cookie mutation and no hidden cookie consumption before a redirect is chosen.

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
- Expected result: shell falls back read-only without mutating the cookie during render.
- Expected non-goal: no silent cookie repair in layouts or pages.

### Zero-Workspace Authenticated Shell State

- Sign in as a user with zero workspaces.
- Open `/app`, `/account`, `/account/preferences`, and `/account/security`.
- Expected result: all remain usable.
- Expected result: scope switcher shows `Personal` as the active option.
- Expected result: sidebar shows personal navigation only.
- Expected result: workspace section shows empty-state copy without a duplicate leading icon.
- Expected result: create workspace action remains separately visible.

### Scope Switcher Outside Workspace Routes

- Start signed in with multiple workspaces.
- Open `/app`.
- Switch workspaces from the shell.
- Expected result: selecting a workspace navigates to `/w/[workspaceSlug]/overview`.
- Expected result: the selected workspace stays available even after returning to `Personal`.

### Return From Workspace To Personal

- Start signed in with at least one workspace.
- Open `/w/[workspaceSlug]/overview`.
- Use the scope switcher to move to `Personal`.
- Expected result: navigation goes to `/app`.
- Expected result: `Personal` is shown as the active scope.

### Return From Personal Back To Workspace

- Start signed in with at least one workspace.
- Open `/app`.
- Use the scope switcher to open a workspace.
- Return to `Personal`.
- Open the scope switcher again and click the same workspace.
- Expected result: navigation goes back to `/w/[workspaceSlug]/overview`.
- Expected non-goal: clicking the previously active workspace from personal scope must not be treated as a no-op.

### Membership Revoked Or Workspace Deleted In Another Session

- Open a workspace page.
- Remove membership or delete that workspace in a different session.
- Refresh the original page.
- Expected result: scoped not-found or safe redirect for follow-up actions, without a resolver loop through `/overview`.

## Review Focus

When re-checking this refactor later, prioritize:

- post-auth destination correctness
- invite outcome explicitness
- stale cookie fallback without render-time repair
- zero-workspace shell behavior
- personal/workspace scope switching behavior
- workspace route failure behavior

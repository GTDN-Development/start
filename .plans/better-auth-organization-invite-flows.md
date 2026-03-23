# Better Auth Organization Invite Flows

Date: 2026-03-23

## Goal

Describe how invitation flows work in the Better Auth `organization` plugin, distinguish core plugin behavior from the demo app UX, and capture the important constraints that matter when comparing it with our workspace invite flow.

## Source Reference

This document is based on the local Better Auth canary repo:

- `/Users/fanda/Dev/better-auth-canary/docs/content/docs/plugins/organization.mdx`
- `/Users/fanda/Dev/better-auth-canary/packages/better-auth/src/plugins/organization/routes/crud-invites.ts`
- `/Users/fanda/Dev/better-auth-canary/packages/better-auth/src/plugins/organization/error-codes.ts`
- `/Users/fanda/Dev/better-auth-canary/packages/better-auth/src/plugins/organization/organization.test.ts`
- `/Users/fanda/Dev/better-auth-canary/demo/nextjs/app/(auth)/accept-invitation/[id]/page.tsx`

## Core Model

Better Auth models organization invitations as server-side records identified by `invitationId`.

The email link contains the invitation ID. The client is expected to:

1. open an invite page using that ID
2. authenticate the user first
3. fetch the invitation details while authenticated
4. call `acceptInvitation({ invitationId })` or `rejectInvitation({ invitationId })`

This means Better Auth does not treat the public invite link itself as a self-sufficient token accept flow. The invitation is a server-side resource that becomes actionable only in an authenticated session.

## Canonical Invite Flow

### 1. Invitation creation

- An authorized organization member calls `inviteMember`.
- Better Auth stores a pending invitation record.
- `sendInvitationEmail` is responsible for building the actual email link.
- The recommended link includes `data.id`, for example `/accept-invitation/{invitationId}`.

Important behavior from docs:

- If the user is already a member, the invitation is canceled instead of duplicated.
- If the user is already invited, resend behavior depends on `resend`.
- Re-invite behavior can optionally cancel older pending invitations.

### 2. User opens invite link

- The app route receives `invitationId`.
- The normal Better Auth pattern is not “accept immediately from link”.
- The app is expected to show an invite page that works against authenticated APIs.

### 3. User authenticates

- Better Auth docs explicitly say `acceptInvitation` must be called after login.
- `getInvitation`, `acceptInvitation`, and `rejectInvitation` all require a session.
- So the framework assumes a signed-in user before the invitation can be inspected or acted on.

### 4. Invitation is fetched

- `getInvitation?id=...` loads the invitation record for the current session.
- The request fails if:
  - the user is not authenticated
  - the invitation does not exist
  - the invitation is expired
  - the invitation is no longer `pending`
  - the signed-in user email does not exactly match the invitation recipient email

When successful, Better Auth returns invite metadata enriched with:

- `organizationName`
- `organizationSlug`
- `inviterEmail`

### 5. Invitation is accepted

- `acceptInvitation({ invitationId })` validates the record again on the server.
- The plugin rejects the request if the invite is missing, expired, or not pending.
- The plugin rejects the request if the current session email does not match the invited email.
- The plugin can also reject if email verification is required and the current user email is still unverified.
- If the organization has a membership limit, that is checked before membership is created.
- If teams are enabled, invite-linked team membership can also be created during accept.

On success, Better Auth:

1. marks the invitation as `accepted`
2. creates the organization membership
3. sets the accepted organization as the active organization in the session
4. returns the accepted invitation and created member

### 6. Invitation is rejected

- `rejectInvitation({ invitationId })` is the decline path for the invited user.
- It also requires an authenticated session.
- If email verification is required for invitations, rejection is blocked until the email is verified.

### 7. Invitation is canceled

- `cancelInvitation({ invitationId })` is the sender/admin path.
- This is not the same as recipient rejection.
- It is intended for a user with permission to manage invitations.

## Enforcement Rules In The Plugin

These are the important guardrails enforced directly in server code:

### Exact recipient matching

Better Auth uses strict email equality:

- `invitation.email.toLowerCase() === session.user.email.toLowerCase()`

That check exists both for `getInvitation` and `acceptInvitation`.

Practical consequence:

- a signed-in user on the wrong account cannot even load the invite details successfully
- the plugin does not provide a softer “you are signed in with the wrong account, here is the invite anyway” mode

### Only pending invitations are actionable

The plugin treats an invitation as invalid for accept/get when:

- it does not exist
- it is expired
- its status is no longer `pending`

Accepted or rejected invitations are not handled as nuanced terminal invite states in the core route logic. They simply stop being valid actionable invites.

### Optional email verification gate

If `requireEmailVerificationOnInvitation` is enabled:

- accepting an invitation requires `session.user.emailVerified === true`
- rejecting an invitation requires the same

This is a configurable hardening layer, not the default baseline requirement.

### Active organization is persisted

After successful accept, Better Auth updates the session to set:

- `activeOrganizationId`

This is important because the accepted organization becomes the current app context immediately after the invite succeeds.

The test suite explicitly checks this behavior.

## Error Surface

Relevant organization error codes include:

- `INVITATION_NOT_FOUND`
- `YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION`
- `EMAIL_VERIFICATION_REQUIRED_BEFORE_ACCEPTING_OR_REJECTING_INVITATION`

These codes make the server behavior explicit, but Better Auth leaves it to the app to decide how much UX nuance to expose.

## Demo App Behavior

The demo page in `demo/nextjs/app/(auth)/accept-invitation/[id]/page.tsx` is much simpler than the plugin itself.

### What the demo does

- reads the `id` param from the route
- fetches the invitation via `useInvitationQuery(id)`
- shows a loading card while pending
- shows invitation details when the invitation is available
- allows `Accept Invitation`
- allows `Decline`
- redirects to `/dashboard` after either action succeeds

### What the demo does not do well

- it does not expose a specific wrong-account state
- it does not show a dedicated “sign out and retry” recovery path
- it does not distinguish invalid invite vs wrong recipient vs permission failure in a nuanced way
- it collapses fetch failure into one generic error card

So the plugin is strict and explicit on the server, but the demo UI is relatively shallow.

## Canonical State Map

From the perspective of a product implementing Better Auth exactly as intended, the meaningful states are:

1. invite link opened with `invitationId`
2. user must be authenticated before continuing
3. authenticated user fetches invite details
4. invite is pending and belongs to the current user
5. invite is missing, expired, or no longer pending
6. authenticated user is not the invite recipient
7. authenticated user must verify email before acting
8. invite is accepted and active organization is updated
9. invite is rejected

## What Better Auth Does Not Model For You

These parts are not first-class framework behavior in the plugin:

- guest invite continuation via a pending invite cookie
- a public pre-auth invite page that truthfully previews the invitation
- a built-in wrong-account recovery UX
- a built-in post-auth result route for invite mismatch or expired states
- a richer distinction between “already handled” terminal outcomes on the frontend

Those are application concerns on top of the plugin.

## Comparison Lens For Our App

When comparing Better Auth with our current workspace flow, the most important reference points are:

- Better Auth is stricter about authenticated access before invitation inspection or acceptance.
- Better Auth uses exact invited-email matching, just like our current implementation.
- Better Auth persists the accepted organization as active context, which is the same behavior we now want for direct workspace invite accept.
- Better Auth itself does not provide a better guest UX than we can build locally; its demo is actually less nuanced than our current invite mismatch handling.

## Practical Summary

If we want to stay aligned with the Better Auth mental model without copying it blindly, the key takeaways are:

- keep invite acceptance identity-bound
- keep invite acceptance server-validated
- persist accepted workspace or organization as active context
- treat guest invite continuation and wrong-account recovery as product UX layers, not as core auth primitives

That means Better Auth is a useful baseline for correctness and enforcement, but not a strong reference for polished invite UX by itself.

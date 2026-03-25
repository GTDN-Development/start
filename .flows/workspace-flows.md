# Workspace Flows

## Entry And Routing

- Application entry
  - Valid active workspace cookie -> `/w/[workspaceSlug]/overview`
  - No valid active workspace cookie -> `/app`

- Direct workspace route
  - `/w/[workspaceSlug]` with access -> `/w/[workspaceSlug]/overview`
  - `/w/[workspaceSlug]` without access or with unknown slug -> workspace 404

- Unknown nested workspace route
  - `/w/[workspaceSlug]/...` outside implemented pages -> workspace 404

## Scope Switcher

- Switch to personal scope
  - Success -> `/app`

- Switch to another workspace
  - Workspace available to current user -> `/w/[workspaceSlug]/overview`
  - Workspace missing or forbidden -> stays on current page

- Create workspace
  - Open drawer -> user must enter workspace name
  - Success -> app generates a unique slug, sets it as active workspace, then goes to `/w/[workspaceSlug]/overview`
  - Invalid input or unauthorized -> stays in drawer -> user must fix input or sign in

## Workspace General Settings

- Change workspace name
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings`
  - Member -> read-only

- Change workspace URL / slug
  - Admin or owner success -> `/w/[newWorkspaceSlug]/settings`
  - Slug already taken -> stays on page -> user must pick another slug
  - Member -> read-only

- Change workspace avatar
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings`
  - Invalid file / upload failure -> stays on page -> user must pick another file
  - Member -> read-only

- Remove workspace avatar
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings`
  - Member -> read-only

- Leave workspace
  - User must type the current workspace slug and confirm
  - Success -> `/app`
  - Last owner -> blocked on page -> user must transfer ownership first

- Delete workspace
  - Owner only
  - User must type the current workspace slug and confirm
  - Success -> `/app`
  - Non-owner -> read-only

## Members And Invitations

- Open members settings
  - Member list loads -> stays on `/w/[workspaceSlug]/settings/members`
  - Members or invites load fails -> `/w/[workspaceSlug]/settings`

- Create invitation
  - Admin or owner enters email + role -> success -> stays on `/w/[workspaceSlug]/settings/members`
  - Already member / already invited / invalid email -> stays on page -> user must fix input
  - Member -> read-only

- Copy invitation link
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings/members` and gets refreshed invite URL copied to clipboard
  - Failure -> stays on page -> user must retry

- Resend invitation
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings/members`
  - Rate limited or forbidden -> stays on page -> user must retry later or use another account

- Remove invitation
  - Admin or owner success -> stays on `/w/[workspaceSlug]/settings/members`
  - Failure -> stays on page -> user must retry

- Change member role
  - Owner can change any role, including promote to owner -> stays on `/w/[workspaceSlug]/settings/members`
  - Admin can manage non-owner members, but cannot promote anyone to owner -> stays on page
  - Last owner downgrade -> blocked on page

- Remove member
  - Owner can remove anyone except the last owner -> stays on `/w/[workspaceSlug]/settings/members`
  - Admin can remove non-owner members -> stays on `/w/[workspaceSlug]/settings/members`
  - Last owner removal -> blocked on page

- Leave workspace from members list
  - Current user chooses leave in own row -> `/app`
  - Last owner -> blocked on page

## Invite Acceptance

- `/invite/[token]` without session + valid token -> `/invite/[token]/start` -> sets pending invite cookie -> `/sign-in`
- After sign in or email verification with pending invite cookie -> `/invite/[token]`
- `/invite/[token]` with session and matching email
  - Pending invite -> user must click Accept -> `/w/[workspaceSlug]/overview`
  - Already member -> direct to `/w/[workspaceSlug]/overview`
- `/invite/[token]` with session and different email -> stays on invite page -> user must sign out and sign in with the invited account
- Invalid or expired invite -> stays on invite state page

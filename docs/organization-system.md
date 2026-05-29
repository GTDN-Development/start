# Organization System

Organizations are PocketBase records with membership-based access.

- `organizationConfig.enabled` is the frontend rollout switch for the organization feature.
  It is controlled by `NEXT_PUBLIC_ORGANIZATIONS_ENABLED` and defaults to false.
  When false, the app shell stays in personal scope, organization navigation is omitted, scope
  switching/creation UI is hidden, `/o/[organizationSlug]` redirects to `/app`, invite routes do
  not inspect or accept invites, and post-auth routing falls back to `/app`.
- Setting `organizationConfig.enabled` to true exposes the prepared organization UI again.
- Main routes live under `/o/[organizationSlug]`: overview, settings, and members.
- Users can create, switch, update, leave, and delete organizations.
- Roles are `owner`, `admin`, and `member`; invites can create `admin` or `member`.
- Owners can manage everything; admins can manage non-owner members; members are mostly read-only.
- Last-owner protection is enforced in PocketBase hooks and mirrored in UI guards.
- `active_organization` remembers the selected organization; `pending_invite` preserves invite intent through sign-in.
- Organization navigation is patched locally after mutations to avoid broad refreshes.

Server shape:

- Route access resolves the current user, organization by slug, and membership.
- General mutations handle create, rename, slug/avatar update, leave, and delete.
- Member mutations handle role changes and removal.
- Invite mutations create, resend, revoke, inspect, and accept invite tokens.
- PocketBase domain hooks provide custom endpoints for atomic create and invite accept/inspect flows, plus membership owner guards.

Useful files:

- [organization config](/Users/fanda/Dev/start/apps/web/src/config/organization.ts)
- [role rules](/Users/fanda/Dev/start/apps/web/src/features/organizations/organization-role-rules.ts)
- [navigation context](/Users/fanda/Dev/start/apps/web/src/features/organizations/organization-navigation-context.tsx)
- [route queries](/Users/fanda/Dev/start/apps/web/src/server/organizations/organization-route-queries.ts)
- [navigation queries](/Users/fanda/Dev/start/apps/web/src/server/organizations/organization-navigation-queries.ts)
- [post-auth destination](/Users/fanda/Dev/start/apps/web/src/server/organizations/post-auth-destination.ts)
- [general actions](/Users/fanda/Dev/start/apps/web/src/features/organizations/settings/general/organization-general-actions.ts)
- [member actions](/Users/fanda/Dev/start/apps/web/src/features/organizations/settings/members/organization-members-actions.ts)
- [PocketBase hooks](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks)

# Avatar System

Used by account profiles and organizations.

- Uploaded avatars win over fallback initials; removing an upload returns to initials.
- Client upload preparation lives in [avatar-image-processing.ts](/Users/fanda/Dev/start/apps/web/src/lib/avatar-image-processing.ts).
- Oversized images are compressed in the browser with `browser-image-compression`, targeting `0.9 MB`, max `1024px`, and a final `1 MB` limit.
- Server actions validate the file again before storing it in PocketBase.
- Fallback initials and deterministic colors come from [app-utils.ts](/Users/fanda/Dev/start/apps/web/src/lib/app-utils.ts).
- Color seeds are stable IDs: `user.id`, `organization.id`, or organization member `userId`.

Main UI files:

- [account avatar settings](/Users/fanda/Dev/start/apps/web/src/features/account/profile/avatar-settings-item.tsx)
- [organization avatar settings](/Users/fanda/Dev/start/apps/web/src/features/organizations/settings/general/organization-avatar-settings-item.tsx)

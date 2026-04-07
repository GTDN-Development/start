# Avatar System

## What This Solves

This layer handles avatar upload, removal, fallback initials, and deterministic fallback colors for both user accounts and workspaces.

Current behavior:

- uploaded avatars take priority over fallback initials
- removing an uploaded avatar falls back to initials again
- fallback colors are derived client-side from stable entity identifiers
- shared avatar primitives stay generic; color overrides are applied at UI call sites

## Upload Flow

Both account and workspace avatar settings use the same client-side preparation step before sending the file to a server action.

Short version:

1. user selects a file in the settings UI
2. `prepareAvatarUpload()` validates file type and optionally compresses/resizes the image in the browser
3. the prepared file is sent to the relevant server action
4. the server validates the file again and stores it in PocketBase
5. the local profile/workspace state is patched with the updated avatar URL

Main entrypoints:

- client image preparation: [avatar-image-processing.ts](/Users/fanda/Dev/start/apps/web/src/lib/avatar-image-processing.ts)
- account avatar UI: [avatar-settings-item.tsx](/Users/fanda/Dev/start/apps/web/src/features/account/profile/avatar-settings-item.tsx)
- workspace avatar UI: [workspace-avatar-settings-item.tsx](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-avatar-settings-item.tsx)
- account server handling: [account-profile-service.ts](/Users/fanda/Dev/start/apps/web/src/server/account/account-profile-service.ts)
- workspace server handling: [workspace-general-service.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-general-service.ts)

## Client-Side Image Processing

`prepareAvatarUpload()` uses `browser-image-compression` in the browser.

Current rules:

- non-image files are rejected immediately
- files already within the limit are passed through unchanged
- oversized files are processed client-side with a web worker
- compression targets `0.9 MB`
- max width or height is `1024`
- initial quality is `0.9`
- if the processed file is still above the configured limit, the upload is rejected

Current size limits:

- account avatars: `1 MB`
- workspace avatars: `1 MB`

Even after client-side processing, the server still validates MIME type and final file size before persistence.

## Fallback Initials And Colors

Fallback initials come from `getUserInitials()` in [app-utils.ts](/Users/fanda/Dev/start/apps/web/src/lib/app-utils.ts).

Fallback colors come from `getAvatarColorClass()` in the same file. The helper hashes a stable seed string and selects one class pair from a fixed Tailwind palette.

Current seeds:

- user account avatars: `user.id`
- all workspace avatars: `workspace.id`
- workspace member avatars: `member.userId`

For user avatars, account settings, header/account menus, and workspace member lists should all use the
same `user.id` seed so the fallback color stays synced across surfaces.

This keeps colors stable across reloads without storing any extra color field in the database.

## Current Constraints

- no server-side generated avatar images
- no stored avatar color metadata
- no SVG or raster fallback generation pipeline
- no avatar provider abstraction layer

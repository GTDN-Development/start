# 03. Device Session Ownership Rules

Source history: `da7c9c8`

Depends on: recommended after Task 02, but technically independent

Skip impact: device-session ownership stays enforced mostly by app logic instead of by PocketBase itself.

## Goal

Add PocketBase rules so users can only create, read, update, and delete their own `user_device_sessions` records.

## Value

- stronger backend security boundary for account security features
- less trust placed on app code for cross-user isolation
- clearer guarantees for sign-out-another-device and sign-out-all-other-devices flows

## Current Gap

The lost migration `1775736195_user_device_session_rules.js` is still missing from current `main`.

That means the intended owner-only backend enforcement for device sessions was lost during the revert.

## Scope

- add a new migration equivalent in intent to the lost device-session rules migration
- make sure create and update rules prevent users from writing another user’s session
- verify current heartbeat and revoke flows still satisfy the stricter rules

## Non-goals

- redesign of device-session UX
- changing session retention policy

## Acceptance Criteria

- guests cannot list device sessions
- authenticated users can only access their own device sessions
- cross-user read, create, update, and delete attempts fail at the PocketBase layer

## Validation

- restore an E2E or direct PocketBase spec equivalent to `device-session-rules-enforce-authz.spec.ts`
- keep these flows green:
- `apps/web/tests/e2e/account/security/sign-out-all-other-devices.spec.ts`
- `apps/web/tests/e2e/account/security/sign-out-another-device.spec.ts`

## Notes

This task is self-contained enough to skip if needed, but it is one of the cleaner backend security wins because the rule surface is small and easy to test directly.


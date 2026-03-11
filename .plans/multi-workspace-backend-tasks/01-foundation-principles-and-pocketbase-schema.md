# Task 01: Foundation, principles, and PocketBase schema

## Goal
Establish the production foundation of the workspace domain so it works as a plugin on top of the existing auth flow (not a replacement), with PocketBase schema/rules baseline validated and generated types refreshed.

## Scope
1. Confirm architectural principles (KISS + DX) and responsibility boundaries between auth and workspace layers.
2. Validate existing PocketBase collections configuration:
   - `workspaces`
   - `workspace_members`
   - `workspace_invites`
3. Validate collection fields against the source plan.
4. Validate required indexes and unique constraints.
5. Validate baseline PocketBase API rules for all three collections.
6. Run `npm run pocketbase:typegen` to generate current types from the live schema, then commit `src/types/pocketbase.ts`.
7. Create/normalize base domain files:
   - `src/server/workspaces/workspace-types.ts`
   - `src/server/workspaces/workspace-errors.ts`

## Implementation steps
1. In PocketBase, verify all three collections exist and match expected fields:
   - `workspaces`: `name`, `slug`, `kind`, `avatar`
   - `workspace_members`: `workspace`, `user`, `role`
   - `workspace_invites`: `workspace`, `email_normalized`, `role`, `token_hash`, `expires_at`, `invited_by`
2. Verify indexes/unique constraints exactly as defined in the source plan; fix only if drift is detected.
3. Verify approved rules without changing logic unless drift is detected.
4. Ensure `workspaces.kind` allows only `personal | organization`.
5. Regenerate PocketBase types via `npm run pocketbase:typegen` and fix dependent type usage.
6. Define stable workspace-domain error codes in `workspace-errors.ts`.

## PocketBase status note
PocketBase collections/rules are already configured. This task is focused on baseline validation plus mandatory type refresh from current collections (`npm run pocketbase:typegen`).

## Acceptance criteria
1. Collections, fields, indexes, and rules match the source plan 1:1.
2. `slug` is unique at DB level.
3. `workspace_members` enforces unique `workspace + user`.
4. `workspace_invites` enforces unique `token_hash` and unique `workspace + email_normalized`.
5. `src/types/pocketbase.ts` is up to date and type checks pass.
6. Existing `/api/auth/*` and `/api/account/*` behavior remains unchanged.

## User-visible behavior
1. End users should see no sign-in/sign-up regression.
2. Workspace features do not need to be exposed yet, but backend is ready for next tasks.
3. Security rules already prevent unauthorized access to other workspaces.

## Dependencies
1. None (entry task for all subsequent workspace workstreams).

## Coverage of source plan
1. Section 1 (Design principles)
2. Section 2 (What does not change)
3. Section 3 (Target modular structure - foundation part)
4. Section 4 (PocketBase data model)

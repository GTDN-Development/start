# Task 05: Workspace API contract and route handlers

## Goal
Deliver complete server API layer for workspaces, members, and invites with a unified response pattern, stable error codes, and mandatory security checks.

## Scope
1. Implement route handlers in:
   - `src/app/api/workspaces/*`
   - `src/app/api/workspace-invites/*`
2. Cover endpoints:
   - `GET /api/workspaces`
   - `POST /api/workspaces`
   - `POST /api/workspaces/switch`
   - `PATCH /api/workspaces/[workspaceSlug]/general`
   - `POST /api/workspaces/[workspaceSlug]/leave`
   - `DELETE /api/workspaces/[workspaceSlug]`
   - `GET /api/workspaces/[workspaceSlug]/members`
   - `PATCH /api/workspaces/[workspaceSlug]/members/[memberId]/role`
   - `DELETE /api/workspaces/[workspaceSlug]/members/[memberId]`
   - `POST /api/workspaces/[workspaceSlug]/members/transfer-ownership`
   - `GET /api/workspaces/[workspaceSlug]/invites`
   - `POST /api/workspaces/[workspaceSlug]/invites`
   - `POST /api/workspaces/[workspaceSlug]/invites/[inviteId]/resend`
   - `DELETE /api/workspaces/[workspaceSlug]/invites/[inviteId]`
   - `POST /api/workspace-invites/accept`
3. Enforce `WorkspaceResponse` shape (`ok: true/false`).
4. Enforce stable error code contract (base + domain codes).

## Implementation steps
1. Define `workspace-contract.ts` as source of truth for API payloads.
2. Map service errors to HTTP statuses + `errorCode` without leaking internals.
3. Add `hasValidOrigin` checks to all mutating endpoints (`POST`, `PATCH`, `DELETE`).
4. Return `400 BAD_REQUEST` for missing/invalid `Origin`.
5. Keep response serialization consistent across endpoints.
6. Keep compatibility with auth API style (`ok: true/false`).
7. Add i18n mapping for all new `WorkspaceErrorCode` values.

## Acceptance criteria
1. All listed endpoints exist and return contract-compliant responses.
2. UI can react using only `errorCode` (no fragile message parsing).
3. Mutating endpoints reject invalid origin with `400`.
4. Unauthorized access returns expected `401/403/404` without data leaks.
5. `POST /api/workspace-invites/accept` works as authenticated token-driven endpoint.

## User-visible behavior
1. Workspace actions (create/switch/edit/leave/delete) are predictable and immediate.
2. Error handling is consistent and localizable.
3. Invalid request context (for example cross-origin mutation) is safely rejected.

## Dependencies
1. Task 02 (core workspace service).
2. Task 03 (members service).
3. Task 04 (invite service).

## Coverage of source plan
1. Section 6.1 (Workspace API)
2. Section 6.2 (Members API)
3. Section 6.3 (Invites API)
4. Section 6.4 (Response pattern)
5. Section 6.5 (API security baseline)

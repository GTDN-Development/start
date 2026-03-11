# Task 08: Security hardening and operational guards

## Goal
Add production security controls across workspace services/API: anti-CSRF baseline, anti-enumeration responses, audit logging, resend rate limits, and sensitive-data log protection.

## Scope
1. Complete security guardrails across service and API layers.
2. Implement invite resend rate limit (`updated >= 60s`).
3. Add minimum audit log coverage for critical actions.
4. Enforce leak-free authorization behavior (`403/404` without existence leak).
5. Verify tokens/hashes are never logged.

## Implementation steps
1. Verify/enforce `hasValidOrigin` checks for mutating endpoints.
2. Add resend throttle in `resendInvite` with clear `RATE_LIMITED` error code.
3. Add audit events for:
   - create/revoke/accept invite
   - role change
   - workspace delete
4. Add sensitive-data redaction policy in logs (token/hash and other sensitive values).
5. Normalize service/API error behavior to avoid exposing workspace existence.
6. Verify idempotent handling of race conditions (unique index + retry).

## Acceptance criteria
1. Resend invite before 60 seconds returns stable rate-limit error.
2. Audit logs include critical events and exclude token/hash data.
3. Unauthorized access does not reveal workspace existence.
4. Security behavior is consistent across service and API layers.

## User-visible behavior
1. Users cannot spam invite resend actions.
2. Unauthorized users receive generic safe failures.
3. Legitimate users get stable behavior even during concurrent operations.

## Dependencies
1. Task 05 (API layer).
2. Task 03 and Task 04 (members/invites domain logic).

## Coverage of source plan
1. Section 10 (Security and operations)
2. Section 6.5 (API security baseline enforcement)

# Task 09: Test infrastructure, API/E2E coverage, and CI

## Goal
Establish test coverage that proves all critical workspace flows, security guards, and auth resilience behaviors.

## Scope
1. Unit tests for:
   - `workspace-service`
   - `workspace-invite-service`
2. API integration tests for all workspace mutations.
3. Local PocketBase test infrastructure:
   - `docker-compose`
   - fixture seeds
   - reset script before each integration run
4. CI job that boots PB test instance, applies schema, seeds fixtures, and runs tests.
5. E2E scenarios from source plan.

## Implementation steps
1. Build test helpers that isolate workspace data between test runs.
2. Add integration tests for:
   - create/switch/leave/delete workspace
   - invite create/resend/revoke/accept
   - role change + ownership transfer
3. Add E2E flows:
   - sign-up -> overview -> personal workspace created
   - create org workspace -> switch -> settings
   - sign-in -> overview redirect by valid cookie
   - invite cold flow (guest -> sign-in -> accept)
   - invite email mismatch
   - last-owner guard
   - personal workspace restrictions
4. Add security test for cross-origin mutations returning `400`.
5. Add auth resilience test: `sign-in/sign-up` remain successful on hook `transient_error`.
6. Wire tests into CI as required quality gate.

## Acceptance criteria
1. Critical service logic has unit coverage including edge cases.
2. API integration tests cover all mutating endpoints in the contract.
3. E2E tests cover all source-plan user flows.
4. CI executes tests deterministically on clean PB instance.
5. Auth regression tests (`sign-in/sign-up/sign-out/session`) stay green with workspace plugin enabled.

## User-visible behavior
1. Workspace backend rollout does not regress baseline auth flows.
2. Critical workspace scenarios (invite, ownership, leave/delete) behave reliably in edge conditions.
3. Error behavior is consistent between local development and production.

## Dependencies
1. Tasks 01-08 (tests depend on implemented functionality).

## Coverage of source plan
1. Section 11 (Testing strategy)
2. Section 13.8 (Auth regression DoD)

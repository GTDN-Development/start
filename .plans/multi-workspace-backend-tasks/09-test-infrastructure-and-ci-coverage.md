# Task 09: Post-v1 testing backlog (deferred)

## Goal
Define the full testing backlog for a follow-up phase after v1. No automated tests are implemented in this task during the first release.

## Scope
1. Capture deferred test scope for a future implementation phase:
   - unit testing (for example Vitest)
   - component testing (for example React Testing Library)
   - E2E testing (for example Playwright or Cypress)
   - API integration testing
2. Capture deferred test infrastructure scope:
   - local PocketBase test stack
   - fixtures and reset scripts
   - CI execution strategy
3. Keep this task as planning-only in v1 (no test code, no CI test jobs).

## Implementation steps
1. Document exact future test suites and ownership (unit, component, integration, E2E).
2. Document exact target flows that will be validated in the testing phase.
3. Document tool candidates and decision criteria (Vitest, React Testing Library, Playwright/Cypress).
4. Document CI rollout strategy for tests in a separate post-v1 milestone.
5. Explicitly mark all test implementation work as deferred and out of v1 scope.

## Acceptance criteria
1. Test implementation is explicitly excluded from v1 scope.
2. A complete, actionable post-v1 testing backlog exists in this document.
3. Deferred scope explicitly includes unit, component, integration, and E2E testing.
4. Deferred scope explicitly includes CI execution in a later step.

## User-visible behavior
1. No direct user-visible change from this task in v1.
2. Testing guarantees are not part of v1 deliverables and will be added in a follow-up phase.

## Dependencies
1. Tasks 01-08 (the deferred backlog references implemented functionality).

## Coverage of source plan
1. Section 11 (Testing strategy)
2. Section 13.8 (Auth regression DoD)

# Multi-workspace Testing Implementation Plan (Post-v1)

Date: 2026-03-11
Goal: implement complete automated test coverage for the multi-workspace backend/frontend scope after testing libraries are installed and configured.

## 1. Scope and boundaries

1. In scope:
   - Unit tests (service/domain logic)
   - Component tests (critical UI behavior)
   - API integration tests (route handlers + PocketBase rules/contracts)
   - E2E tests (key user journeys)
   - CI test jobs and quality gates
2. Out of scope:
   - New product features beyond existing multi-workspace plan
   - Broad visual snapshot testing for entire app
   - Non-workspace domains unless required as dependency (auth baseline only)

## 2. Preconditions (must be done before implementation)

1. Testing libraries are installed and baseline-configured:
   - Vitest
   - React Testing Library
   - Playwright or Cypress (preferred: Playwright; fallback: Cypress)
2. Test scripts exist in `package.json` and run locally.
3. Dedicated test env vars are available.
4. PocketBase test instance strategy is agreed (Docker Compose).
5. Existing workspace API and routing implementation is merged and stable.

## 3. Tooling decisions and standards

1. Unit + integration runner: Vitest.
2. Component tests: React Testing Library on Vitest.
3. E2E runner:
   - Preferred: Playwright (cross-browser + tracing + parallelism)
   - Alternative: Cypress (if team standard requires it)
4. Coverage tooling:
   - V8 coverage via Vitest
   - Coverage report artifact in CI
5. Test design rules:
   - Stable selectors (`data-testid` only where semantic selectors are insufficient)
   - No brittle timing sleeps; always wait for explicit state
   - Deterministic fixtures and DB reset between test cases

## 4. Test architecture

1. Test layers:
   - `tests/unit/*`
   - `tests/integration/api/*`
   - `tests/component/*`
   - `tests/e2e/*`
2. Shared helpers:
   - Auth/session helper
   - Workspace fixture builder
   - Invite token helper
   - PocketBase reset/seed helper
3. Test data strategy:
   - Per-suite seed templates
   - Unique IDs per test run
   - Hard reset before integration and E2E suites

## 5. Coverage map by domain flow

## 5.1 Auth plugin + bootstrap

1. Sign-up/sign-in remains successful with post-auth workspace hook enabled.
2. `/overview` always resolves to valid workspace redirect.
3. `transient_error` in post-auth hook is fail-open.
4. `pending_invite_hash` is cleared on mismatch/expired states.

## 5.2 Workspace lifecycle

1. `ensurePersonalWorkspace` idempotency under concurrent calls.
2. Single personal workspace invariant per user.
3. Organization slug collision suffix policy.
4. Reserved slug rejection.
5. `active_workspace` invalid cookie fallback ordering.
6. Personal workspace leave/delete restrictions.

## 5.3 Members and ownership

1. Owner-only role mutation authorization.
2. Last-owner guard for demote/remove.
3. Ownership transfer ordering: promote target -> demote source.
4. Partial transfer failure returns `OWNERSHIP_TRANSFER_PARTIAL` and safe state.

## 5.4 Invites

1. Invite token stored as hash only.
2. Email match requirement for acceptance.
3. Resend rate limit (>=60s).
4. Guest invite flow via `/invite/[token]` -> sign-in -> consume pending invite.
5. Revoke/expired invite behavior.

## 5.5 API contract and security

1. All workspace endpoints return `WorkspaceResponse` shape.
2. Stable `WorkspaceErrorCode` mapping.
3. Origin validation on POST/PATCH/DELETE.
4. Unauthorized access responses do not leak workspace existence.
5. Sensitive logging policy (token/hash not logged).

## 5.6 Routing and UI integration

1. Dynamic routes `/w/[workspaceSlug]/...` enforce membership.
2. Legacy `/w/workspace/*` paths absent.
3. `workspace-switcher` switches context via API and cookie.
4. Settings pages (`/settings`, `/settings/members`) work against real backend data.
5. i18n error/copy integration for workspace flows.

## 6. Implementation phases

## Phase A: Infrastructure and smoke

1. Configure runners, reporters, and CI cache.
2. Add PB Docker Compose test stack.
3. Implement reset + seed scripts.
4. Add smoke tests for auth session and workspace list endpoint.

Acceptance criteria:
1. `npm run test:unit`, `test:integration`, `test:component`, `test:e2e` execute locally.
2. CI can boot PB test environment and run smoke suite.

## Phase B: Unit tests (domain/services)

1. `workspace-service` full behavior matrix.
2. `workspace-members-service` guards and ownership paths.
3. `workspace-invite-service` token/email/rate-limit paths.
4. `post-auth-workspace-hook` status matrix.

Acceptance criteria:
1. Critical domain logic has deterministic unit coverage.
2. Edge cases (race/idempotency/partial-fail) are covered.

## Phase C: API integration tests

1. Workspace routes: create/switch/general/leave/delete.
2. Member routes: list/role/remove/transfer-ownership.
3. Invite routes: list/create/resend/revoke/accept.
4. Security tests: origin checks, unauthorized access, leak prevention.

Acceptance criteria:
1. All mutating endpoints have passing integration tests.
2. Contract and status code behavior is validated end-to-end with PB test DB.

## Phase D: Component tests

1. `workspace-switcher` behavior and state updates.
2. Settings forms and action states (success/error/disabled guards).
3. Invite state rendering map (accepted/mismatch/expired/etc.).
4. Error message mapping by `WorkspaceErrorCode`.

Acceptance criteria:
1. Critical UI logic is verified without full browser runs.
2. Components are validated for backend-driven state transitions.

## Phase E: E2E journeys

1. Sign-up -> overview bootstrap -> personal workspace ready.
2. Create organization -> switch -> settings loaded.
3. Invite cold flow guest -> sign-in -> auto-consume.
4. Invite email mismatch flow.
5. Last-owner guard flow.
6. Personal workspace restrictions flow.

Acceptance criteria:
1. All critical user journeys pass in CI.
2. Failures produce reproducible traces/videos/screenshots.

## Phase F: CI hardening and release gates

1. Parallelize test jobs by layer.
2. Add flaky test quarantine policy.
3. Publish coverage/report artifacts.
4. Define mandatory merge gates by suite.

Acceptance criteria:
1. CI is stable and deterministic.
2. Quality gates enforce coverage of critical workspace regressions.

## 7. Suggested scripts

1. `npm run test:unit`
2. `npm run test:component`
3. `npm run test:integration`
4. `npm run test:e2e`
5. `npm run test:all`

## 8. Suggested CI pipeline

1. Job 1: lint + typecheck
2. Job 2: unit + component
3. Job 3: integration (with PB service)
4. Job 4: E2E (with app + PB services)
5. Merge gate:
   - required: Jobs 1-3
   - required for release branches: Job 4

## 9. Definition of Done (testing phase)

1. All critical flows from the final workspace checklist have automated test coverage.
2. Auth fail-open behavior with workspace hook is validated.
3. Security baseline (origin checks + no resource leak + no sensitive logs) is validated.
4. CI pipelines are green and enforce required gates.
5. Testing docs include how to run locally and how to debug failures.

## 10. Deliverables

1. Test configuration files and scripts.
2. Test helper infrastructure (fixtures, PB reset/seed tools).
3. Complete automated suites across unit/component/integration/E2E.
4. CI workflow updates with artifacts and gates.
5. Testing runbook in `.plans` or `docs/`.

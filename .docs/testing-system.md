# Testing System

## What This Solves

This repo now has a simple local testing foundation for the SaaS starter.

The goal is:

- have a reliable place to start writing tests
- keep the setup small and explicit
- follow the same KISS rules as the rest of the project

This is not a CI system and not a custom testing framework.

## Current Model

The split is intentional:

- `Vitest` is for unit and business-rule tests
- `Playwright` is for auth flows, workspace flows, email flows, and App Router behavior

Why:

- unit tests are fast and good for direct logic
- Next.js async server behavior is better covered by real browser E2E flows
- this keeps test responsibility clear and avoids forcing too much into one tool

## Key Decisions

- tests run locally only
- test env comes from `.env.test`
- Playwright runs production-like through `next build` + `next start`
- E2E uses `workers: 1` to reduce collisions against the shared dev PocketBase
- PocketBase superuser credentials are allowed only inside test helpers for seed and cleanup
- E2E data should be isolated with `e2e-<runId>-...` prefixes
- no page objects, no custom fixture framework, no test DSL for now

The main reason for this shape is stability with low ceremony.

We want the smallest setup that still works well for:

- auth verification and reset flows
- workspace invitation and membership flows
- email-driven flows through Mailtrap
- account security and device-session flows
- business-rule tests around auth, workspaces, account, and security

## File Map

- unit config: [apps/web/vitest.config.mts](/Users/fanda/Dev/start/apps/web/vitest.config.mts)
- E2E config: [apps/web/playwright.config.ts](/Users/fanda/Dev/start/apps/web/playwright.config.ts)
- shared test env loader: [load-test-env.cjs](/Users/fanda/Dev/start/apps/web/tests/load-test-env.cjs)
- Next test bootstrap runner: [run-next-with-test-env.cjs](/Users/fanda/Dev/start/apps/web/tests/scripts/run-next-with-test-env.cjs)
- Vitest setup: [setup.ts](/Users/fanda/Dev/start/apps/web/tests/vitest/setup.ts)
- PocketBase test admin helper: [pocketbase-test-admin.ts](/Users/fanda/Dev/start/apps/web/tests/e2e/helpers/pocketbase-test-admin.ts)
- Mailtrap helper: [mailtrap.ts](/Users/fanda/Dev/start/apps/web/tests/e2e/helpers/mailtrap.ts)
- test run id helper: [test-run.ts](/Users/fanda/Dev/start/apps/web/tests/e2e/helpers/test-run.ts)
- current Vitest coverage example: [route.test.ts](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/post-auth/route.test.ts>)
- current Vitest coverage example: [route.test.ts](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.test.ts>)
- current Vitest coverage example: [route.test.ts](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.test.ts>)
- current Vitest coverage example: [workspace-members-service.test.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-members-service.test.ts)
- current Vitest coverage example: [workspace-resolution-service.test.ts](/Users/fanda/Dev/start/apps/web/src/server/workspaces/workspace-resolution-service.test.ts)
- current Vitest coverage example: [account-service.test.ts](/Users/fanda/Dev/start/apps/web/src/server/account/account-service.test.ts)
- current Vitest coverage example: [auth-service.test.ts](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-service.test.ts)
- current Vitest coverage example: [device-sessions-service.test.ts](/Users/fanda/Dev/start/apps/web/src/server/device-sessions/device-sessions-service.test.ts)

## Conventions

- colocate unit tests as `*.test.ts` or `*.test.tsx` inside `apps/web/src/**`
- keep E2E tests in `apps/web/tests/e2e/**`
- use explicit locale-prefixed URLs in E2E, preferably `/cs/...`
- keep test helpers thin and direct
- add abstractions only after repeated real use, not in advance

## Daily Use

- `pnpm test`
- `pnpm test:watch`
- `pnpm test:e2e`
- `pnpm test:e2e:ui`

These commands work from the repository root and from `apps/web`.

## Intent To Preserve

When adding tests later, keep the mental model direct:

1. unit test pure logic where direct inputs and outputs are enough
2. use Playwright when behavior depends on Next runtime, cookies, redirects, auth, email, or full user flow
3. prefer a few clear helpers over a large shared testing layer

If a testing change adds more framework than clarity, it is probably too heavy for this repo.

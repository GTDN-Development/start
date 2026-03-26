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
- future business-rule tests around auth and workspaces

## File Map

- unit config: [vitest.config.mts](/Users/fanda/Dev/start/vitest.config.mts)
- E2E config: [playwright.config.ts](/Users/fanda/Dev/start/playwright.config.ts)
- shared test env loader: [load-test-env.cjs](/Users/fanda/Dev/start/tests/load-test-env.cjs)
- Next test bootstrap runner: [run-next-with-test-env.cjs](/Users/fanda/Dev/start/tests/scripts/run-next-with-test-env.cjs)
- Vitest setup: [setup.ts](/Users/fanda/Dev/start/tests/vitest/setup.ts)
- PocketBase admin helper: [pocketbase-admin.ts](/Users/fanda/Dev/start/tests/e2e/helpers/pocketbase-admin.ts)
- Mailtrap helper: [mailtrap.ts](/Users/fanda/Dev/start/tests/e2e/helpers/mailtrap.ts)
- test run id helper: [test-run.ts](/Users/fanda/Dev/start/tests/e2e/helpers/test-run.ts)

## Conventions

- colocate unit tests as `*.test.ts` or `*.test.tsx` inside `src/**`
- keep E2E tests in `tests/e2e/**`
- use explicit locale-prefixed URLs in E2E, preferably `/cs/...`
- keep test helpers thin and direct
- add abstractions only after repeated real use, not in advance

## Daily Use

- `npm run test` or `npm run test:unit`
- `npm run test:unit:watch`
- `npm run test:e2e`
- `npm run test:e2e:ui`
- `npm run test:e2e:headed`
- `npm run test:all`

## Intent To Preserve

When adding tests later, keep the mental model direct:

1. unit test pure logic where direct inputs and outputs are enough
2. use Playwright when behavior depends on Next runtime, cookies, redirects, auth, email, or full user flow
3. prefer a few clear helpers over a large shared testing layer

If a testing change adds more framework than clarity, it is probably too heavy for this repo.

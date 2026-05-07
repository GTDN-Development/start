# Testing System

The repo keeps tests small and local.

- Vitest covers units, route helpers, services, and business rules.
- Playwright covers full browser flows: auth, email links, organizations, account settings, redirects, and App Router behavior.
- E2E starts an isolated local stack, builds Next, runs Playwright, and removes test volumes.
- Mailpit is the local email inbox used by dev and E2E tests.
- Test data uses `e2e-<runId>-...` style prefixes.
- Keep helpers thin; no page-object framework or custom test DSL for now.

Files:

- [Vitest config](/Users/fanda/Dev/start/apps/web/vitest.config.mts)
- [Playwright config](/Users/fanda/Dev/start/apps/web/playwright.config.ts)
- [E2E runner](/Users/fanda/Dev/start/scripts/run-web-e2e.mjs)
- [Mailpit helper](/Users/fanda/Dev/start/apps/web/tests/e2e/helpers/mailpit.ts)
- [PocketBase test admin helper](/Users/fanda/Dev/start/apps/web/tests/e2e/helpers/pocketbase-test-admin.ts)

Commands:

- `pnpm test`
- `pnpm test:watch`
- `pnpm test:e2e`
- `pnpm test:e2e:ui`
- `pnpm check`

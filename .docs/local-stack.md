# Local Stack

Local development uses Docker for PocketBase, Mailpit, and Gotenberg, with the Next.js app running
through pnpm.

- `pnpm local:up` starts PocketBase, Mailpit, and Gotenberg from [compose.yaml](/Users/fanda/Dev/start/compose.yaml).
- `pnpm local:down` stops the local stack.
- `pnpm dev:full` starts the stack and then the workspace dev servers.
- Default local ports are PocketBase `8090`, Mailpit HTTP `8025`, Mailpit SMTP `1025`, and Gotenberg `3031`.
- Gotenberg health is available at `http://127.0.0.1:3031/health`.
- Local PocketBase superuser credentials are injected by [local-stack.mjs](/Users/fanda/Dev/start/scripts/local-stack.mjs).
- `local-stack.mjs` injects `GOTENBERG_BASE_URL` for local web commands.
- `pnpm pocketbase:mailpit:apply` reapplies PocketBase SMTP settings for Mailpit.
- `pnpm test:e2e` starts an isolated stack on free ports, builds Next, runs Playwright, then removes volumes.
- `pnpm pocketbase:typegen` regenerates [pocketbase.ts](/Users/fanda/Dev/start/apps/web/src/types/pocketbase.ts) from the local PocketBase schema.

Useful files:

- [local stack script](/Users/fanda/Dev/start/scripts/local-stack.mjs)
- [E2E runner](/Users/fanda/Dev/start/scripts/run-web-e2e.mjs)
- [web local env example](/Users/fanda/Dev/start/apps/web/.env.local.example)
- [web test env example](/Users/fanda/Dev/start/apps/web/.env.test.example)
- [PocketBase README](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- [Mailpit README](/Users/fanda/Dev/start/infra/mailpit/README.md)
- [Gotenberg README](/Users/fanda/Dev/start/infra/gotenberg/README.md)
- [PDF system](/Users/fanda/Dev/start/.docs/pdf-system.md)

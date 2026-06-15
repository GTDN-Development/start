# Start

Start is an internal baseline for building new products with the web application, PocketBase backend,
and local email tooling in one place. It is maintained for company projects, not as a public
open-source starter.

## Repository Layout

- `apps/web` - Next.js 16 application for marketing, auth, and the authenticated app
- `apps/pocketbase` - PocketBase service with migrations, hooks, public assets, and Railway deployment files
- `infra/mailpit` - Mailpit deployment wrapper for development and test email capture
- `infra/gotenberg` - Gotenberg Chromium PDF rendering deployment wrapper for local and Railway
- `docs` - implementation notes, guidelines, plans, runbooks, and architecture decision records

## Tooling

- `pnpm` workspaces
- `turborepo`
- Next.js 16 / React 19
- PocketBase

## New Project Setup

Use the [project adoption checklist](ADOPTION_CHECKLIST.md) when starting a new product.
Replace the product-specific values and keep the robust platform pieces intact.

Organizations, invites, and roles are enabled in the project env examples, so new team-scope
products start with them on. This is an explicit bootstrap choice, not the runtime fallback: if
`NEXT_PUBLIC_ORGANIZATIONS_ENABLED` is missing, the web app treats organizations as disabled.
Personal-scope products should keep the variable set to `false` or omit it.

## Commands

Run daily commands from the repository root. App READMEs cover app-specific behavior.

Install and run:

```bash
pnpm install
pnpm dev
pnpm dev:full
pnpm start
```

Quality checks:

```bash
pnpm build
pnpm lint
pnpm test
pnpm check-types
pnpm check
pnpm format
pnpm format:check
```

Focused utilities:

```bash
pnpm lint:fix
pnpm test:watch
pnpm test:e2e
pnpm test:e2e:ui
pnpm pocketbase:typegen
pnpm local:up
pnpm local:down
pnpm pocketbase:mailpit:apply
```

Turbo runs `dev`, `build`, `lint`, `test`, and `check-types`. `pnpm check` runs format, lint, and
type checks. `pnpm dev:full` starts the local Docker stack before the web dev server.

## Deployment

- Vercel deploys `apps/web`
- Railway deploys `apps/pocketbase`
- Railway deploys `infra/gotenberg`
- the Railway service for PocketBase must use `apps/pocketbase` as its `Root Directory`
- the Railway service for Gotenberg must use `infra/gotenberg` as its `Root Directory`
- `main` is the production branch
- `dev` is the shared development branch
- development and production use separate services, volumes, domains, and environment variables

## Local Dev And Tests

- `pnpm local:up` starts the persistent PocketBase + Mailpit + Gotenberg stack and applies the local mail baseline.
- `pnpm dev` runs the workspace dev task; `pnpm dev:full` starts the local stack first.
- `pnpm test` runs Turbo tests, including PocketBase script tests.
- `pnpm test:e2e` starts an isolated PocketBase + Mailpit + Gotenberg stack, builds the web app, and runs Playwright.
- Details live in [docs/local-stack.md](docs/local-stack.md) and
  [docs/testing-system.md](docs/testing-system.md).

## Core Env Conventions

- public values shared by client and server use one `NEXT_PUBLIC_*` variable
- `NEXT_PUBLIC_APP_URL` is the canonical public app URL
- `NEXT_PUBLIC_PB_URL` is the canonical PocketBase base URL
- `WEB_INTERNAL_API_SECRET` must match between the web app and PocketBase
- `web` in PocketBase custom API names means the server side of `apps/web`, not the browser client.
- `GOTENBERG_BASE_URL` is the server-only Gotenberg base URL for PDF rendering
- base URLs are written without a trailing slash
- custom email form recipient values belong to the PocketBase environment
- production PocketBase `appURL`, sender identity, and SMTP delivery are configured in PocketBase settings
- complete examples live inside the owning app directories

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- Mailpit infrastructure guide: [infra/mailpit/README.md](/Users/fanda/Dev/start/infra/mailpit/README.md)
- Gotenberg infrastructure guide: [infra/gotenberg/README.md](/Users/fanda/Dev/start/infra/gotenberg/README.md)
- focused project notes: [docs/README.md](docs/README.md)

Environment examples live inside the owning app directories:

- `apps/web/.env.local.example`, `apps/web/.env.prod.example`, `apps/web/.env.test.example`
- `apps/pocketbase/.env.example`

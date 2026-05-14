# Start

Start is a repository with the web application and the PocketBase backend in one place.

## Repository Layout

- `apps/web` - Next.js 16 application for marketing, auth, and the authenticated app
- `apps/pocketbase` - PocketBase service with migrations, hooks, public assets, and Railway deployment files
- `apps/mailpit` - Mailpit service for development and test email capture
- `.rules` - project goals and architecture rules
- `.docs` - implementation notes for key subsystems

## Tooling

- `pnpm` workspaces
- `turborepo`
- Next.js 16 / React 19
- PocketBase

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
pnpm email:dev
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
- the Railway service for PocketBase must use `apps/pocketbase` as its `Root Directory`
- `main` is the production branch
- `dev` is the shared development branch
- development and production use separate services, volumes, domains, and environment variables

## Local Dev And Tests

- `pnpm local:up` starts the persistent PocketBase + Mailpit stack and applies the local mail baseline.
- `pnpm dev` runs the workspace dev task; `pnpm dev:full` starts the local stack first.
- `pnpm test` runs Turbo tests, including PocketBase script tests.
- `pnpm test:e2e` starts an isolated PocketBase + Mailpit stack, builds the web app, and runs Playwright.
- Details live in [.docs/local-stack.md](/Users/fanda/Dev/start/.docs/local-stack.md) and
  [.docs/testing-system.md](/Users/fanda/Dev/start/.docs/testing-system.md).

## Core Env Conventions

- public values shared by client and server use one `NEXT_PUBLIC_*` variable
- `NEXT_PUBLIC_APP_URL` is the canonical public app URL
- `NEXT_PUBLIC_PB_URL` is the canonical PocketBase base URL
- `MAILPIT_BASE_URL` is required for local Mailpit API delivery
- base URLs are written without a trailing slash
- sender identity uses `MAIL_FROM_NAME` and `MAIL_FROM_ADDRESS`
- local dev and E2E both use `MAIL_TRANSPORT="mailpit-api"`
- complete examples live inside the owning app directories

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- Mailpit service guide: [apps/mailpit/README.md](/Users/fanda/Dev/start/apps/mailpit/README.md)
- focused project notes: [.docs/README.md](/Users/fanda/Dev/start/.docs/README.md)

Environment examples live inside the owning app directories:

- `apps/web/.env.local.example`, `apps/web/.env.prod.example`, `apps/web/.env.test.example`
- `apps/pocketbase/.env.example`

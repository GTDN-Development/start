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

Run project commands from the repository root. App READMEs describe app-specific behavior, but this
section is the source of truth for daily commands.

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

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm check-types` run through Turborepo.
`pnpm dev` starts the web app. `pnpm dev:full` starts the local Docker stack first and then runs
`pnpm dev`. `pnpm format` and `pnpm format:check` run the repository-root Prettier baseline across
repo code, docs, and tooling files. `pnpm check` runs format, lint, and type checks.

## Deployment

- Vercel deploys `apps/web`
- Railway deploys `apps/pocketbase`
- the Railway service for PocketBase must use `apps/pocketbase` as its `Root Directory`
- `main` is the production branch
- `dev` is the shared development branch
- development and production use separate services, volumes, domains, and environment variables

## Dev/Test Mail Flow

- `pnpm local:up` starts the persistent local PocketBase + Mailpit Docker stack and reapplies the local mail baseline
- `pnpm dev` runs the repository-wide Turbo dev task
- `pnpm dev:full` is a convenience shortcut that runs `pnpm local:up` and then `pnpm dev`
- `pnpm test` runs the repository-wide Turbo test task and includes PocketBase script tests
- `pnpm test:e2e` starts an isolated local PocketBase + Mailpit Docker stack, builds the app, and runs Playwright against it
- `pnpm local:down` stops the persistent local dev stack
- PocketBase auth emails still use SMTP and are delivered to the local Mailpit container
- local web app emails use the local Mailpit HTTP Send API
- Playwright reads inbox content through the local Mailpit API and rendered message endpoints
- production email delivery is intentionally out of scope for this setup

## Environment Contract

- public values shared by client and server use one `NEXT_PUBLIC_*` variable
- `NEXT_PUBLIC_APP_URL` is the canonical public app URL
- `NEXT_PUBLIC_PB_URL` is the canonical PocketBase base URL
- `MAILPIT_BASE_URL` is required for local Mailpit API delivery
- base URLs are written without a trailing slash
- sender identity uses `MAIL_FROM_NAME` and `MAIL_FROM_ADDRESS`
- local dev and E2E both use `MAIL_TRANSPORT="mailpit-api"`
- `pnpm pocketbase:typegen` targets the local Docker PocketBase instance and uses the local
  superuser created by `pnpm local:up`; web env files do not need PocketBase superuser credentials

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- Mailpit service guide: [apps/mailpit/README.md](/Users/fanda/Dev/start/apps/mailpit/README.md)
- project goal: [.rules/start-goal.md](/Users/fanda/Dev/start/.rules/start-goal.md)
- architecture principles: [.rules/kiss-project-architecture-principles.md](/Users/fanda/Dev/start/.rules/kiss-project-architecture-principles.md)

Environment examples live inside the owning app directories:

- `apps/web/.env.local.example`, `apps/web/.env.prod.example`, `apps/web/.env.test.example`
- `apps/pocketbase/.env.example`

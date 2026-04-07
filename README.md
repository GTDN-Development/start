# Start

Start is a workspace repository with the web application and the PocketBase backend in one place.

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

## Common Commands

Run these from the repository root:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm format
pnpm format:check
pnpm check
pnpm pocketbase:typegen
pnpm pocketbase:mailpit:apply
```

These commands target the web application by default. PocketBase-specific work is handled from `apps/pocketbase`.

## Deployment

- Vercel deploys `apps/web`
- Railway deploys `apps/pocketbase`
- Railway deploys `apps/mailpit` only in development/testing environments
- the Railway service for PocketBase must use `apps/pocketbase` as its `Root Directory`
- the Railway service for Mailpit must be named `mailpit` so the internal SMTP host resolves as `mailpit.railway.internal`
- `main` is the production branch
- `dev` is the shared development branch
- development and production use separate services, volumes, domains, and environment variables

## Dev/Test Mail Flow

- Mailpit exists only for development and testing
- PocketBase auth emails still use SMTP and are delivered to Mailpit over Railway private networking
- local web app test emails use the Mailpit HTTP Send API instead of SMTP
- Playwright reads inbox content through the official Mailpit API and rendered message endpoints
- production email delivery is intentionally out of scope for this setup

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- Mailpit service guide: [apps/mailpit/README.md](/Users/fanda/Dev/start/apps/mailpit/README.md)
- project goal: [.rules/start-goal.md](/Users/fanda/Dev/start/.rules/start-goal.md)
- architecture principles: [.rules/kiss-project-architecture-principles.md](/Users/fanda/Dev/start/.rules/kiss-project-architecture-principles.md)

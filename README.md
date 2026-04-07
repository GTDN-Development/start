# Start

Start is a workspace repository with the web application and the PocketBase backend in one place.

## Repository Layout

- `apps/web` - Next.js 16 application for marketing, auth, and the authenticated app
- `apps/pocketbase` - PocketBase service with migrations, hooks, public assets, and Railway deployment files
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
```

These commands target the web application by default. PocketBase-specific work is handled from `apps/pocketbase`.

## Deployment

- Vercel deploys `apps/web`
- Railway deploys `apps/pocketbase`
- the Railway service for PocketBase must use `apps/pocketbase` as its `Root Directory`
- `main` is the production branch
- `dev` is the shared development branch
- development and production use separate services, volumes, domains, and environment variables

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- project goal: [.rules/start-goal.md](/Users/fanda/Dev/start/.rules/start-goal.md)
- architecture principles: [.rules/kiss-project-architecture-principles.md](/Users/fanda/Dev/start/.rules/kiss-project-architecture-principles.md)

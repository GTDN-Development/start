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
pnpm build
pnpm lint
pnpm test
pnpm typecheck
pnpm format
pnpm format:check
pnpm check
pnpm web:test:e2e
pnpm web:test:e2e:ui
pnpm web:lint:fix
pnpm pocketbase:typegen
pnpm pocketbase:mailpit:apply
```

Command scope:

- `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm format`, `pnpm format:check`, and `pnpm check` run at repo scope
- `pnpm dev`, `pnpm start`, and `pnpm email:dev` stay targeted to `apps/web`
- `pnpm web:*` commands are the explicit web-only shortcuts when you want to target just `apps/web`
- PocketBase-specific work stays explicit through `pnpm pocketbase:*`

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

## Environment Contract

- public values shared by client and server use one `NEXT_PUBLIC_*` variable
- `NEXT_PUBLIC_APP_URL` is the canonical public app URL
- `NEXT_PUBLIC_PB_URL` is the canonical PocketBase base URL
- base URLs are written without a trailing slash
- sender identity uses `MAIL_FROM_NAME` and `MAIL_FROM_ADDRESS`
- normal local dev stays SMTP-first; E2E/dev-test switches web mail to Mailpit with `MAIL_TRANSPORT="mailpit-api"`
- optional public feature flags such as `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_GTM_ID`, and `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED` are non-canonical and may stay unset

## Documentation

- web app guide: [apps/web/README.md](/Users/fanda/Dev/start/apps/web/README.md)
- PocketBase service guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)
- Mailpit service guide: [apps/mailpit/README.md](/Users/fanda/Dev/start/apps/mailpit/README.md)
- project goal: [.rules/start-goal.md](/Users/fanda/Dev/start/.rules/start-goal.md)
- architecture principles: [.rules/kiss-project-architecture-principles.md](/Users/fanda/Dev/start/.rules/kiss-project-architecture-principles.md)

Environment examples live inside the owning app directories:

- `apps/web/.env.local.example`, `apps/web/.env.prod.example`, `apps/web/.env.test.example`
- `apps/pocketbase/.env.example`

# Start PocketBase

`apps/pocketbase` is the PocketBase service for Start. It contains:

- `pb_migrations/` for schema history
- `pb_hooks/` for optional JS hooks
- `pb_public/` for optional static files
- persistent data in `/pb_data`
- superuser bootstrap from environment variables

## Overview

This service stays close to the default PocketBase standalone workflow.

It keeps backend state in versioned migrations, runs locally in Docker, and deploys as a single Railway service.

## Local Development

Start the repository Docker stack from the repo root:

```sh
pnpm local:up
```

Useful commands:

```sh
docker compose exec pocketbase ./pocketbase migrate create add_something --dir=/pb_data --migrationsDir=/pb/pb_migrations
docker compose exec pocketbase ./pocketbase migrate collections --dir=/pb_data --migrationsDir=/pb/pb_migrations
docker compose exec pocketbase ./pocketbase migrate history-sync --dir=/pb_data --migrationsDir=/pb/pb_migrations
pnpm local:down
```

Default local URLs:

- app: `http://127.0.0.1:8090`
- admin UI: `http://127.0.0.1:8090/_/`

Local runtime data lives in the Docker volume for the `pocketbase` service and is not committed.

## Project Structure

- `pb_migrations/` - PocketBase JS migrations
- `pb_hooks/` - optional PocketBase JS hooks
- `pb_public/` - optional static files

## Workflow

Recommended workflow:

1. Run `pnpm local:up`.
2. Run `pnpm dev` separately if you also need the web app.
3. Update collections or auth settings in the PocketBase admin UI.
4. Let PocketBase generate new migration files in `pb_migrations/`.
5. Add JS hooks in `pb_hooks/` when you need custom event logic.
6. Commit and push changes to `dev`.
7. Verify in the Railway development environment.
8. Promote the same changes to `main` for production.

## What Goes Into Migrations

Keep application-level configuration in `pb_migrations/`, for example:

- collections, fields, rules and indexes
- auth collection settings
- auth email templates such as verification, password reset and email change templates

Keep environment-specific values outside migrations, for example:

- public app URL
- SMTP host, port, username and password
- sender name and sender email
- any value that should differ between `dev` and `prod`

For dev/test mail flows, prefer the repository-managed Mailpit apply script over manual admin UI edits.

## Railway Deployment

1. Create a Railway service from this repository.
2. Set the service root directory to `apps/pocketbase`.
3. Add a Volume mounted to `/pb_data`.
4. Generate a public domain in `Settings -> Networking`.
5. Add:
   - `PB_SUPERUSER_EMAIL`
   - `PB_SUPERUSER_PASSWORD`
6. Deploy or redeploy the service.
7. Open `https://your-domain/_/` and sign in with the configured superuser.

`Root Directory = apps/pocketbase` is required in Railway for this monorepo layout. Without it, Railway will build from the repository root instead of the PocketBase app and the deployment will fail or build the wrong service.

Environment examples:

- `.env.example` as the shared base for both `dev` and `prod`

## Dev/Test Mailpit Setup

`pnpm local:up` already applies the local mail baseline to PocketBase.
Use `pnpm pocketbase:mailpit:apply` from the repository root when you need to reapply it manually without restarting the stack.

The script sets:

- `meta.appURL`
- `meta.senderName`
- `meta.senderAddress`
- Mailpit SMTP host/port/TLS/auth settings
- SMTP host is fixed to `mailpit`, the Docker Compose service hostname

Required envs:

- `NEXT_PUBLIC_PB_URL`
- `PB_SUPERUSER_EMAIL`
- `PB_SUPERUSER_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `MAIL_FROM_NAME`
- `MAIL_FROM_ADDRESS`

URL convention:

- use base URLs without a trailing slash
- Mailpit is for local development and testing only

The container startup sequence is:

1. `migrate up`
2. `superuser upsert`
3. `serve`

Railway runs PocketBase with:

- `--dir=/pb_data`
- `--hooksDir=/pb/pb_hooks`
- `--migrationsDir=/pb/pb_migrations`
- `--publicDir=/pb/pb_public`
- `--automigrate=false`

That means Railway applies committed migrations on startup, but does not generate new ones in the deployed environment.

## Environments

Recommended branch mapping:

- `main` -> production
- `dev` -> development

Each Railway environment should have:

- its own branch
- its own Volume
- its own domain
- its own environment variables

Do not share a Volume across environments.

## Migration Rules

- Do not edit already deployed migrations.
- Create a new migration file for every schema change.
- Use `migrate collections` only for an intentional snapshot or schema history squash.
- For destructive schema changes, add an explicit migration. Snapshot imports use `app.importCollections(snapshot, false)`, so missing fields and collections are not deleted from existing deployments.
- Keep schema in migrations and environment-specific settings outside the repo.

Generated migrations may reference `pb_data/types.d.ts`. The file is created automatically after the first local run.

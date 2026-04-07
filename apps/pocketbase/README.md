# Start PocketBase

`apps/pocketbase` is the PocketBase service for Start. It contains:

- `pb_migrations/` for schema history
- `pb_hooks/` for optional JS hooks
- `pb_public/` for optional static files
- persistent data in `/pb_data`
- superuser bootstrap from environment variables

## Overview

This service stays close to the default PocketBase standalone workflow.

It keeps backend state in versioned migrations and deploys as a single Railway service.

## Local Development

1. Download PocketBase `0.36.7` from the [official releases page](https://github.com/pocketbase/pocketbase/releases/tag/v0.36.7).
2. Change into `apps/pocketbase`.
3. Extract the binary into this directory as `./pocketbase`.
4. Start PocketBase locally:

```sh
./pocketbase serve
```

Useful commands:

```sh
./pocketbase migrate create add_something
./pocketbase migrate collections
./pocketbase migrate history-sync
```

Default local URLs:

- app: `http://127.0.0.1:8090`
- admin UI: `http://127.0.0.1:8090/_/`

Local runtime data is stored in `pb_data/` and is not committed.

## Project Structure

- `pb_migrations/` - PocketBase JS migrations
- `pb_hooks/` - optional PocketBase JS hooks
- `pb_public/` - optional static files

## Workflow

Recommended workflow:

1. Run PocketBase locally.
2. Update collections or auth settings in the PocketBase admin UI.
3. Let PocketBase generate new migration files in `pb_migrations/`.
4. Add JS hooks in `pb_hooks/` when you need custom event logic.
5. Commit and push changes to `dev`.
6. Verify in the Railway development environment.
7. Promote the same changes to `main` for production.

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

Set those environment-specific values manually in each PocketBase environment.

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

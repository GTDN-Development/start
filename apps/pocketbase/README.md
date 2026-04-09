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

Use `pnpm pocketbase:mailpit:apply` from the repository root to apply the dev/test mail baseline to PocketBase.

The script sets:

- `meta.appURL`
- `meta.senderName`
- `meta.senderAddress`
- Mailpit SMTP host/port/TLS/auth settings
- SMTP host is fixed to `mailpit.railway.internal`, so the Railway Mailpit service must be named `mailpit`

Required envs:

- `NEXT_PUBLIC_PB_URL`
- `PB_SUPERUSER_EMAIL`
- `PB_SUPERUSER_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- `MAIL_FROM_NAME`
- `MAIL_FROM_ADDRESS`

URL convention:

- use base URLs without a trailing slash

Safety rules:

- the script refuses production-like targets by default
- production writes require `ALLOW_PB_SETTINGS_WRITE=production`
- Mailpit is for development and testing only

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

## Workspace Authz Matrix

Workspace access control is intentionally split between PocketBase rules and app logic.

PocketBase rules are responsible only for coarse authorization:

- `workspaces`
  - create: authenticated user with `created_by = auth.id`
  - list/view: authenticated user must be a member of the workspace
  - update: authenticated owner or admin in the workspace
  - delete: authenticated owner in the workspace
- `workspace_members`
  - list/view: authenticated user must belong to the same workspace
  - create: either initial owner bootstrap for a newly created workspace or invite acceptance for the authenticated user
  - update: owner always; admin only when the target is not owner and the requested next role is not owner
  - delete: owner always; admin only on non-owner targets; self-delete always allowed
- `workspace_invites`
  - list/view/create/update/delete: authenticated owner or admin in the target workspace
  - create also requires `invited_by = auth.id`

Application code remains responsible for business logic:

- `last owner` guard
- invite resend cooldown
- duplicate invite/member guard and expired invite cleanup
- slug normalization and uniqueness fallback
- invite token lifecycle, e-mail delivery, and resend rollback
- cookie writes, redirects, and post-auth routing

If a rule starts encoding workflow, timing, fallback behavior, or ownership invariants beyond the simple matrix above, it is in the wrong layer.

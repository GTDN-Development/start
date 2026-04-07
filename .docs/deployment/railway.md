# Railway Deployment

## What This Solves

This document describes how Start is deployed to Railway from a monorepo.

It covers:

- how to create the PocketBase service from `apps/pocketbase`
- how to avoid Railway auto-importing the wrong app from the repo root
- how to run separate `production` and `development` environments
- which Railway settings must stay aligned with this repository layout

## Current Model

Start uses one Railway project with isolated environments.

Recommended shape:

- `production` environment
- `development` environment
- one PocketBase service in each environment
- one dedicated volume per environment mounted to `/pb_data`

Both PocketBase services deploy from the same repository and the same subdirectory:

- `apps/pocketbase`

The service must not deploy from the repository root.

## Why The Service Is Created Manually

Do not create the PocketBase service by clicking directly on the repository from the Railway dashboard.

In a monorepo, that flow may auto-detect and deploy other apps from the repository, including the web app.

Create an empty service first, then connect the repository after the service settings are in place.

## Create The Production Service

1. Create a new Railway project or open the existing Start project.
2. In the `production` environment, click `+ Create`.
3. Choose `Empty Service`.
4. Name the service `pocketbase`.
5. Open the service `Settings`.
6. Set `Root Directory` to `/apps/pocketbase`.
7. Set `Config as Code` to `/apps/pocketbase/railway.json`.
8. Leave `Build Command` empty.
9. Leave `Start Command` empty.
10. In `Service Source`, connect the GitHub repository.
11. Set the auto-deploy branch to `main`.
12. Attach a volume and mount it to `/pb_data`.
13. In `Variables`, add:
    - `PB_SUPERUSER_EMAIL`
    - `PB_SUPERUSER_PASSWORD`
14. In `Networking`, generate a public domain.
15. Deploy the service.

## Create The Development Environment

The simplest approach is to duplicate the production environment after production is working.

1. Open the environment switcher.
2. Create `development` as a duplicated environment from `production`.
3. Review the staged changes and deploy them.
4. Open the `pocketbase` service in the `development` environment.
5. Change the auto-deploy branch to `dev`.
6. Confirm the service still uses `Root Directory = /apps/pocketbase`.
7. Attach or confirm a separate volume mounted to `/pb_data`.
8. Set development-specific variables.
9. Generate or assign the development domain.

Do not share the same volume between `production` and `development`.

## Required Service Settings

These settings are required for the current monorepo layout:

- `Root Directory = /apps/pocketbase`
- `Config as Code = /apps/pocketbase/railway.json`
- empty `Build Command`
- empty `Start Command`
- volume mounted to `/pb_data`

If `Root Directory` is not set correctly, Railway will build from the repository root and may either:

- try to deploy the web app
- fail to find the PocketBase Dockerfile
- fail Docker `COPY` steps because the build context is wrong

## Runtime Behavior

The PocketBase container starts in this order:

1. `migrate up`
2. `superuser upsert` when `PB_SUPERUSER_EMAIL` and `PB_SUPERUSER_PASSWORD` are set
3. `serve`

That means the initial admin account can be bootstrapped from Railway variables.

## Environment Separation

Keep these separate between `production` and `development`:

- Git branch
- volume
- public domain
- superuser credentials
- any SMTP or app URL configuration

Recommended mapping:

- `main` -> `production`
- `dev` -> `development`

## Related Files

- service Dockerfile: [apps/pocketbase/Dockerfile](/Users/fanda/Dev/start/apps/pocketbase/Dockerfile)
- Railway config: [apps/pocketbase/railway.json](/Users/fanda/Dev/start/apps/pocketbase/railway.json)
- PocketBase guide: [apps/pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)

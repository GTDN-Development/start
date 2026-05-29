# Deployment Runbook

This runbook describes how to deploy the full Start stack:

- Vercel deploys `apps/web`
- Railway deploys `apps/pocketbase`
- Railway deploys `infra/gotenberg`
- Mailpit is local/E2E only and is not deployed for production

Use one isolated set of services per environment. A simple product can run only local development
plus production. A team workflow can add a shared development environment with the same shape as
production.

## 1. Choose Environments

Pick one of these shapes:

- Local + production: local Docker stack for development, one Vercel production project, one
  Railway production project/environment.
- Local + shared dev + production: local Docker stack, one Vercel preview/development target, one
  Railway development environment, plus separate production services.

For every non-local environment, keep these separate:

- domains
- Railway volumes
- PocketBase superuser credentials
- `START_INTERNAL_API_SECRET`
- SMTP provider credentials
- Gotenberg credentials
- Turnstile site/secret keys

Recommended branch mapping:

- `main` -> production
- `dev` -> shared development

## 2. Prepare Secrets And Domains

Before creating services, decide:

- web app domain, for example `https://app.example.com`
- PocketBase domain, for example `https://pb.example.com`
- Gotenberg domain or private Railway URL
- random `START_INTERNAL_API_SECRET`, same value in Vercel web and Railway PocketBase
- PocketBase superuser email/password
- production SMTP sender address, sender name, host, port, username, password, TLS/auth settings
- `GENERAL_FORMS_RECIPIENT` for contact/support notifications
- Gotenberg basic auth username/password
- Cloudflare Turnstile site key and secret key

Write base URLs without trailing slashes.

## 3. Deploy PocketBase On Railway

Create one Railway service per environment.

1. Create a new Railway service from this repository.
2. Set Railway service Root Directory to `apps/pocketbase`.
3. Confirm the service uses the committed Dockerfile.
4. Add a persistent Railway Volume mounted at `/pb_data`.
5. Generate or attach the environment-specific PocketBase domain.
6. Add Railway variables:
   - `PB_SUPERUSER_EMAIL`
   - `PB_SUPERUSER_PASSWORD`
   - `START_INTERNAL_API_SECRET`
   - `GENERAL_FORMS_RECIPIENT`
7. Deploy the service.
8. Open `https://your-pocketbase-domain/_/`.
9. Sign in with the configured superuser.
10. In PocketBase settings, configure:
    - application URL: the public web app URL
    - sender name
    - sender email
    - SMTP host/port/auth/TLS
11. Send a test auth email from the PocketBase admin UI if SMTP is already ready.

PocketBase starts by applying committed migrations, then optionally upserting the superuser, then
serving with `--automigrate=false`. Deployed environments do not generate migrations.

For production hardening, also review
[PocketBase production readiness](pocketbase-production-readiness.md).

## 4. Deploy Gotenberg On Railway

Create one Railway service per environment if the product keeps document/PDF export enabled.

1. Create a new Railway service from this repository.
2. Set Railway service Root Directory to `infra/gotenberg`.
3. Confirm the service uses the committed Dockerfile.
4. Add a public or private service URL that the Vercel app can reach.
5. Add Railway variables:
   - `API_ENABLE_BASIC_AUTH=true`
   - `GOTENBERG_API_BASIC_AUTH_USERNAME`
   - `GOTENBERG_API_BASIC_AUTH_PASSWORD`
6. Deploy the service.
7. Check `https://your-gotenberg-domain/health`.

If the adopted product does not need document export, remove the document-export feature and
Gotenberg env values instead of deploying unused infrastructure.

## 5. Deploy The Web App On Vercel

Create or configure the Vercel project for `apps/web`.

1. Import the same Git repository into Vercel.
2. Set the project root directory to `apps/web`.
3. Set the package manager/build defaults for the monorepo:
   - install command: `pnpm install --frozen-lockfile`
   - build command: `pnpm build`
   - output: Next.js default
4. Configure the environment's web domain.
5. Add Vercel variables from `apps/web/.env.prod.example`:
   - `START_INTERNAL_API_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_PB_URL`
   - `GOTENBERG_BASE_URL`
   - `GOTENBERG_API_BASIC_AUTH_USERNAME`
   - `GOTENBERG_API_BASIC_AUTH_PASSWORD`
   - `NEXT_PUBLIC_TURNSTILE_ENABLED`
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET_KEY`
   - `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED`
   - `NEXT_PUBLIC_ORGANIZATIONS_ENABLED`
   - `NEXT_PUBLIC_GA_ID` if analytics is used
6. Deploy the web app.

`START_INTERNAL_API_SECRET` must exactly match the PocketBase environment value.
`NEXT_PUBLIC_PB_URL` must point at the matching PocketBase environment.
`GOTENBERG_BASE_URL` must point at the matching Gotenberg environment.

## 6. Wire Environment URLs

After all services have domains:

1. In PocketBase settings, set `appURL` to `NEXT_PUBLIC_APP_URL`.
2. In Vercel, set `NEXT_PUBLIC_PB_URL` to the PocketBase domain.
3. In Vercel, set `GOTENBERG_BASE_URL` to the Gotenberg domain.
4. In Turnstile, allow the web app domain.
5. In the SMTP provider, verify the sender domain/address.
6. Restrict PocketBase CORS/origins once the final web and PB domains are known.

For shared dev + production, repeat the same wiring separately for each environment.

## 7. Smoke Test A Deployment

Run these checks after each environment deploy:

1. Open the web app root.
2. Create a user account.
3. Receive and open the verification email.
4. Sign in.
5. Open account settings and update profile display name.
6. Submit the contact form and confirm the contact email arrives.
7. Submit the support form as an authenticated user and confirm the support email arrives.
8. Create an organization.
9. Invite a user and confirm the invite email arrives.
10. Accept the invite with the invited account.
11. If document export is enabled, generate the sample/export PDF.
12. Check Railway logs for PocketBase and Gotenberg errors.
13. Check Vercel deployment logs for server action/API errors.

For automated local confidence before deploy:

```sh
pnpm test
pnpm check
pnpm test:e2e
```

## 8. Promotion Flow

For local + production:

1. Develop locally with `pnpm local:up` and `pnpm dev`.
2. Commit migrations, hooks, web changes, and docs together.
3. Run tests locally.
4. Merge to `main`.
5. Deploy production Vercel and Railway services.
6. Run the smoke test checklist.

For shared dev + production:

1. Develop locally with `pnpm local:up` and `pnpm dev`.
2. Merge to `dev`.
3. Deploy the shared development Vercel/Railway environments.
4. Run smoke tests in shared development.
5. Promote the same commit to `main`.
6. Deploy production Vercel/Railway environments.
7. Run smoke tests in production.

Do not share a Railway PocketBase Volume between environments. Do not point a Vercel development
environment at the production PocketBase unless that is an intentional one-off debugging step.

## 9. Ongoing Operations

- Add a new PocketBase migration for every schema change.
- Do not edit already deployed migrations.
- Keep auth email templates in committed migrations.
- Keep SMTP credentials and app URLs in PocketBase settings/environment, not migrations.
- Rotate `START_INTERNAL_API_SECRET` by updating Vercel and Railway together.
- Keep Gotenberg basic auth enabled for non-local deployments.
- Keep Mailpit limited to local development and E2E tests.

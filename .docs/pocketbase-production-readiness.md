# PocketBase Production Readiness

This project treats `apps/pocketbase` as a deployable PocketBase app with committed migrations,
hooks, and deployment documentation. The baseline follows the official
[PocketBase Going to production](https://pocketbase.io/docs/going-to-production/) checklist where
the setting is safe for this baseline.

## Template Baseline

- The Docker image pins the PocketBase binary version explicitly.
- The container starts by running committed migrations, then optional superuser bootstrap, then
  `serve` with `--automigrate=false`.
- Collection schema, auth settings, rules, indexes, and auth email copy live in committed
  migrations.
- Public `posts` reads expose only records with `status = "published"`.
- PocketBase rate limiting is enabled in the initial migration with conservative public API,
  public user auth, create, and invite inspection limits. The auth rule is scoped to
  `users:authWithPassword` so superuser operations can be controlled separately with the
  production `_superusers` IP/CIDR whitelist.
- User and organization avatar uploads allow only JPEG, PNG, and WebP files, capped at 5 MB per
  file. The web app still optimizes avatar uploads before sending them, but direct PocketBase API
  uploads have a server-side ceiling.

## Production Deployment Setup

These values depend on the deployment provider, domains, and infrastructure. Configure them in the
production PocketBase environment or dashboard instead of hardcoding them in the baseline.

- Set PocketBase application URL, sender name, sender email, and SMTP delivery so auth emails are
  sent from the production domain.
- Configure backups, preferably to a separate S3-compatible bucket with retention appropriate for
  the deployment.
- Configure trusted proxy headers so PocketBase sees the real client IP behind Railway, a CDN, or
  another reverse proxy. This affects logs and rate limiting.
- Provide a 32-character `PB_ENCRYPTION_KEY` and run PocketBase with
  `--encryptionEnv=PB_ENCRYPTION_KEY` when the deployment is ready to lock in encrypted settings.
- Set `GOMEMLIMIT` based on the service memory limit.
- Raise file descriptor limits if the deployment expects many realtime connections.
- On PocketBase `0.38.0` and newer, configure the `_superusers` IP/CIDR whitelist once the
  production operator IP ranges are known.
- Restrict CORS with `--origins` once the production web and PocketBase domains are final.

## Intentional Template Choices

- `_superusers` MFA and OTP remain disabled in this baseline. Enable them manually when the team
  wants that operational flow.
- Provider-specific settings are documented here rather than encoded in migrations because they
  should differ across local development, staging, and production.

# Start Mailpit

`apps/mailpit` is the dev/test-only Mailpit service for Start.

It exists to capture PocketBase auth emails and local web app test emails during development and end-to-end testing.

## Deployment

Create a dedicated Railway service from this app directory.

- service name must be `mailpit`
- `Root Directory = apps/mailpit`
- generate a public HTTPS domain for the web UI and API
- do not attach a volume
- do not expose SMTP publicly
- use `/readyz` as the healthcheck path

Recommended Railway environment variables:

- `MP_UI_AUTH=<user>:<password>`
- `MP_SEND_API_AUTH=<user>:<password>`
- `MP_MAX_MESSAGES=2000`
- `MP_MAX_AGE=7d`

The SMTP listener stays internal on Railway private networking:

- host: `mailpit.railway.internal`
- port: `1025`

This service should exist only in development and testing environments. Do not create it in production.

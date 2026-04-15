# Start Mailpit

`apps/mailpit` is the local Mailpit image used by the repository Docker stack.

It captures PocketBase auth emails and local web app emails during development and end-to-end testing.

## Local Usage

The repository root `compose.yaml` builds this image and exposes:

- HTTP UI / API on host port `8025` by default
- SMTP on host port `1025` by default

Default commands:

```sh
pnpm local:up
pnpm test:e2e
pnpm local:down
```

Operational notes:

- the local stack keeps Mailpit unauthenticated because it runs only in trusted dev/test environments
- PocketBase talks to Mailpit over the Docker network hostname `mailpit`
- the web app talks to Mailpit over `MAILPIT_BASE_URL` from `.env.local`

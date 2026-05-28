# Start Mailpit

`infra/mailpit` is the local Mailpit image wrapper used by the repository Docker stack.

It captures PocketBase auth and custom emails during development and end-to-end testing.

## Local Usage

The repository root `compose.yaml` builds this image. Use the root
[README.md](/Users/fanda/Dev/start/README.md) for local stack commands.

Default exposed ports:

- HTTP UI / API on host port `8025` by default
- SMTP on host port `1025` by default

Operational notes:

- the local stack keeps Mailpit unauthenticated because it runs only in trusted dev/test environments
- PocketBase talks to Mailpit over the Docker network hostname `mailpit`
- Playwright helpers use the Mailpit HTTP API to inspect captured messages during E2E runs

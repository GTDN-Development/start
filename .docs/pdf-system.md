# PDF System

PDF rendering is backed by Gotenberg.

- `apps/gotenberg` is a deploy wrapper around the pinned
  `gotenberg/gotenberg:8.32.0-chromium` image.
- The web app talks to Gotenberg from server-only code in
  [src/server/pdf](/Users/fanda/Dev/start/apps/web/src/server/pdf).
- Local Gotenberg runs at `http://127.0.0.1:3031` and is bound to loopback only.
- Production should enable Gotenberg basic auth and use matching server-only web credentials.
- V1 supports HTML to PDF through Chromium.

The demo lives behind auth in User Scope `/app/pdf-demo` and Organization Scope
`/o/[organizationSlug]/pdf-demo`. Both pages render the same TanStack Form component. The API route
requires a signed-in user, validates the payload, verifies Organization Scope access when relevant,
and returns an inline PDF.

Useful files:

- [Gotenberg client](/Users/fanda/Dev/start/apps/web/src/server/pdf/gotenberg-client.ts)
- [Demo PDF route](/Users/fanda/Dev/start/apps/web/src/app/api/pdf/demo/route.ts)
- [Demo PDF form](/Users/fanda/Dev/start/apps/web/src/features/pdf/pdf-demo-form.tsx)
- [Demo report template](/Users/fanda/Dev/start/apps/web/src/server/pdf/templates/demo-report.ts)
- [Gotenberg README](/Users/fanda/Dev/start/apps/gotenberg/README.md)

Useful commands: `pnpm local:up`, `curl http://127.0.0.1:3031/health`, `pnpm check`.

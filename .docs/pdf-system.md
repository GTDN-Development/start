# PDF System

PDF rendering is backed by Gotenberg.

- `apps/gotenberg` is a deploy wrapper around the pinned
  `gotenberg/gotenberg:8.32.0-chromium` image.
- The web app talks to Gotenberg from server-only code in
  [src/server/pdf](/Users/fanda/Dev/start/apps/web/src/server/pdf).
- Local Gotenberg runs at `http://127.0.0.1:3031` and is bound to loopback only.
- Production should enable Gotenberg basic auth and use matching server-only web credentials.
- V1 supports HTML to PDF through Chromium.

The document export example lives behind auth in User Scope `/app/document-export` and
Organization Scope `/o/[organizationSlug]/document-export`. Both pages link to the same API route:
`/api/document-export/sample`. The route requires a signed-in user, verifies Organization Scope
access when relevant, builds a localized sample document on the server, renders it through
Gotenberg, and returns an inline PDF.

The example is intentionally small. Products that need PDF as core functionality should add their
own PocketBase schema, document UI, persistence, and domain-specific export routes in the owning
feature. Products that do not need PDF can remove `apps/gotenberg`, the document export pages/API,
PDF env variables, and this note.

Useful files:

- [Gotenberg client](/Users/fanda/Dev/start/apps/web/src/server/pdf/gotenberg-client.ts)
- [Document export route](/Users/fanda/Dev/start/apps/web/src/app/api/document-export/sample/route.ts)
- [Document export page panel](/Users/fanda/Dev/start/apps/web/src/features/document-export/document-export-panel.tsx)
- [Sample document builder](/Users/fanda/Dev/start/apps/web/src/server/document-export/sample-document.ts)
- [Gotenberg README](/Users/fanda/Dev/start/apps/gotenberg/README.md)

Useful commands: `pnpm local:up`, `curl http://127.0.0.1:3031/health`, `pnpm check`.

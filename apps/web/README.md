# Start Web

`apps/web` is the Next.js 16 application for the public site, auth flows, and the authenticated app.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/base-ui components
- next-intl (EN/CS)
- Cloudflare Turnstile
- PocketBase (typegen + auth integration)

## Commands

From `apps/web`, use the local app scripts:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm lint:fix
pnpm check-types
pnpm check
pnpm test
pnpm test:watch
pnpm test:e2e
pnpm test:e2e:ui
pnpm format
pnpm format:check
pnpm pocketbase:typegen
```

Useful repository-root shortcuts:

```bash
pnpm dev
pnpm dev:web
pnpm dev:full
pnpm build
pnpm lint
pnpm test
pnpm check-types
pnpm check
pnpm format
pnpm format:check
pnpm local:up
pnpm local:down
```

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm check-types` are workspace-wide
Turbo commands from the repository root. Repository-root `pnpm format` and `pnpm format:check`
run the repo-wide Prettier baseline. Local `pnpm format` and `pnpm format:check` in `apps/web`
are convenience wrappers that run that same baseline only against `apps/web`.
`pnpm dev:web` keeps the focused web-only flow. `pnpm local:up` and `pnpm local:down` manage the
persistent local PocketBase + Mailpit stack. `pnpm dev:full` is the repository-root shortcut for
`pnpm local:up && pnpm dev`.

## Env

Use `.env.local.example` as the quickest local template.

Explicit examples:

- `.env.local.example` for local development on your machine
- `.env.prod.example` for production deployment values
- `.env.test.example` for Playwright runs against the local Docker stack

Canonical public/runtime envs:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PB_URL`
- `MAILPIT_BASE_URL`
- `MAIL_FROM_NAME`
- `MAIL_FROM_ADDRESS`
- base URLs should be written without a trailing slash

PocketBase typegen requires:

- `NEXT_PUBLIC_PB_URL`
- `PB_SUPERUSER_EMAIL`
- `PB_SUPERUSER_PASSWORD`

## PocketBase Typegen

- Command: `pnpm pocketbase:typegen`
- Output: `src/types/pocketbase.ts`
- Source: live PocketBase collection schema
- Do not edit generated types manually

## Testing

Local testing uses `.env.test`.

- `pnpm test` runs the Vitest suite once from `apps/web`; from the repository root it runs the workspace-wide Turbo test task
- `pnpm test:watch` runs Vitest in watch mode
- `pnpm test:e2e` starts an isolated local PocketBase + Mailpit Docker stack, builds the app with test env, runs Playwright, and tears the stack down again
- `pnpm test:e2e:ui` is the same local stack with Playwright UI enabled
- auth/email E2E flows should set `PLAYWRIGHT_TEST_EMAIL` in `.env.test`; tests derive unique `+alias` recipients from it

Local email defaults:

- local dev and `pnpm test:e2e` both use `MAIL_TRANSPORT="mailpit-api"`
- PocketBase auth emails still use SMTP delivery, but they deliver to the local Mailpit container
- local web app emails go through the local Mailpit HTTP Send API
- production email delivery is out of scope here

Local stack contract:

- `pnpm local:up` starts the persistent local PocketBase + Mailpit stack from the repository root and reapplies the local mail baseline
- `pnpm dev` starts only the Next.js app from `apps/web`; from the repository root it runs the workspace-wide Turbo dev task
- `pnpm dev:web` starts only the Next.js app from the repository root
- `pnpm dev:full` is a repository-root shortcut for `pnpm local:up && pnpm dev`
- `pnpm test:e2e` starts a fresh isolated stack and removes its Docker volume after the run
- `pnpm local:down` stops the persistent local dev stack from the repository root

## Tooling

- `pnpm format` / `pnpm format:check` run the repository-root Prettier baseline with `prettier-plugin-tailwindcss`; from `apps/web` they stay scoped to `apps/web`
- `pnpm lint` / `pnpm lint:fix` run ESLint with Next.js baseline rules plus project architectural guardrails
- `pnpm check-types` runs `next typegen` and TypeScript without emitting
- `pnpm check` runs format, lint, and type checks together

Conventions:

- colocate unit tests as `*.test.ts` / `*.test.tsx` inside `src/**`
- keep E2E tests in `tests/e2e/**`
- use explicit locale-prefixed URLs in E2E, preferably `/cs/...`
- keep PocketBase superuser credentials in local tooling only, never in app runtime

## Structure

- `src/app` - routes, layouts, metadata, API route adapters
- `src/features` - feature-first modules (`auth`, `account`, `marketing`, `cookies`, `application`)
- `src/components` - shared cross-feature UI infrastructure (`ui`, `layout`, `brand`, `dev`)
- `src/server` - server-only infrastructure (`captcha`, `email`)
- `src/config` - structural config (menus, links, site data)
- `src/i18n` + `messages` - routing and translations
- `src/lib` - shared utilities (`utils.ts` for shadcn-safe helpers, `app-utils.ts` for app-specific shared helpers)
- `src/types` - shared types + generated PocketBase types
- `scripts/pocketbase-typegen.mjs` - PocketBase type generator
- repo-level PocketBase integration notes live in `.rules/pocketbase-integration.md`

## Architecture Conventions

- Feature-first source of truth lives in `src/features/*`
- Shared contracts, types, and rules that are used by both features and server stay at the owning feature root
- No barrel exports (`index.ts` / `index.tsx`) in feature modules
- No `shared/` folders inside features; feature-wide types/helpers live at feature root
- Keep `src/components/ui` as the shadcn CLI target
- Application shell/composition belongs to `src/features/application`; account domain stays in `src/features/account`
- Keep route-scoped UI close to route context (example: `src/features/marketing/home/newsletter-cta.tsx`)
- Keep marketing shell files flat in `src/features/marketing` (`marketing-header.tsx`, `marketing-footer.tsx`)
- Keep `src/lib/utils.ts` limited to shadcn-safe helpers such as `cn()`
- Put app-specific shared helpers in `src/lib/app-utils.ts`; avoid spreading utility helpers across many micro files
- Keep server-only helpers in `src/server/*` domains (example: `src/server/captcha/turnstile.ts`)
- API groups are path-based:
  - Marketing: `/api/marketing/*`

## i18n Routing (EN keys + CS aliases)

- Default locale is `cs`
- Internal route keys stay in English (e.g. `"/sign-in"`, `"/app"`)
- Public Czech pathname aliases are configured in `src/i18n/routing.ts` via `pathnames`

Examples:

- Internal key: `"/sign-in"`
- EN URL: `/en/sign-in`
- CS URL alias: `/cs/prihlasit-se`

### Important navigation rules

- For internal localized app links use `@/components/ui/link` (re-exports `@/i18n/navigation` `Link`)
- For external URLs and hash/mailto/tel links use a native `<a>`
- For localized redirects/path building use `@/i18n/navigation`
  - `redirect({href: "/sign-in", locale})`
  - `getPathname({href: "/sign-in", locale})`
- Do not build localized URLs manually with `/${locale}/...`
  - This breaks when pathname aliases are enabled
  - It also affects hidden form redirects, server redirects and metadata canonicals

### Server redirects (localized)

Use `redirect` from `@/i18n/navigation` for route redirects in server components/layouts.

```ts
import { redirect } from "@/i18n/navigation";
import { Locale } from "next-intl";

redirect({ href: "/sign-in", locale: locale as Locale });
```

### Metadata canonicals / alternates

- Route metadata uses localized path generation for canonical URLs and language alternates
- `createPageMetadata(...)` now expects `locale` and an internal pathname key

## Auth/Account Status

- Auth uses PocketBase via SSR-safe per-request server clients.
- Client auth flows are implemented primarily via server actions exposed from `src/features/auth/auth-client.ts`.
- The public auth API route currently exposed from `src/app/api/auth` is `src/app/api/auth/session/route.ts`.
- Additional auth-related route handlers live next to their route flows:
  - `src/app/[locale]/(auth)/(flow)/post-auth/route.ts`
  - `src/app/[locale]/(auth)/(flow)/verify-email/complete/route.ts`
  - invite accept/start handlers under `src/app/[locale]/(auth)/(flow)/invite/...`
- Client DX API is exposed via `src/features/auth/auth-client.ts`:
  - `signIn`, `signUp`, `useSession`, `signOut`
- Application routes are protected by:
  - `src/proxy.ts` cookie-presence redirect guard
  - server-layout fallback session validation in `src/app/[locale]/(application)/layout.tsx`

### Cookie Boundary

- Pages, layouts, and other render-time Server Components are cookie-read-only
- Auth and workspace services may return serialized `setCookie[]`, but render code must never commit them
- Server Actions commit auth cookies through `src/server/auth/auth-cookies.ts`
- Route Handlers commit auth and workspace cookies on `NextResponse`
- `src/proxy.ts` stays optimistic only; real auth and cleanup decisions stay near the data

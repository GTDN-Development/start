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

Use the repository-root commands documented in [../../README.md](/Users/fanda/Dev/start/README.md).
The app package keeps local scripts for direct app work.

## Env

Use `.env.local.example` as the quickest local baseline.

Explicit examples:

- `.env.local.example` for local development on your machine
- `.env.prod.example` for production deployment values
- `.env.test.example` for Playwright runs against the local Docker stack

Core URL and service envs:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_PB_URL`
- `START_INTERNAL_API_SECRET`
- `GOTENBERG_BASE_URL`
- `NEXT_PUBLIC_TURNSTILE_ENABLED`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY`
- base URLs should be written without a trailing slash
- PocketBase-specific mail recipient and SMTP/sender setup live with the PocketBase service

See [.docs/local-stack.md](/Users/fanda/Dev/start/.docs/local-stack.md) for local stack details.

## PocketBase Typegen

- Command: `pnpm pocketbase:typegen`
- Output: `src/types/pocketbase.ts`
- Source: live PocketBase collection schema
- Do not edit generated types manually

## Testing

Vitest covers unit and business-rule tests. Playwright covers auth, organization, email, and App
Router flows against a local Docker stack. Use the root README for commands and
[.docs/testing-system.md](/Users/fanda/Dev/start/.docs/testing-system.md) for the test flow.

Auth/email E2E flows can set `PLAYWRIGHT_TEST_EMAIL` in `.env.test`; tests derive unique `+alias`
recipients from it. Without it, tests use isolated `example.com` addresses against Mailpit.

## Tooling

Tooling is intentionally split by concern:

- ESLint uses Next.js baseline rules plus project architectural guardrails
- Type checks run Next.js route typegen and TypeScript without emitting
- Prettier uses the repository-root baseline with `prettier-plugin-tailwindcss`

Conventions:

- colocate unit tests as `*.test.ts` / `*.test.tsx` inside `src/**`
- keep E2E tests in `tests/e2e/**`
- use explicit locale-prefixed URLs in E2E, preferably `/cs/...`
- keep PocketBase superuser credentials in local tooling only, never in app runtime

## Structure

- `src/app` - routes, layouts, metadata, API route adapters
- `src/features` - feature-first modules (`account`, `application`, `auth`, `cookies`, `document-export`, `error-handling`, `marketing`, `organizations`)
- `src/components` - shared cross-feature UI infrastructure (`ui`, `layout`, `brand`, `dev`)
- `src/server` - server-only domains for auth, account, application state, PDF, PocketBase, and feature backends
- `src/config` - structural config (routes, menus, product identity, legal variants, env parsing)
- `src/i18n` + `messages` - routing and translations
- `src/lib` - shared utilities (`utils.ts` for shadcn-safe helpers, `app-utils.ts` for app-specific shared helpers)
- `src/types` - shared types + generated PocketBase types
- `scripts/pocketbase-typegen.mjs` - PocketBase type generator
- PocketBase service and migration notes live in [../pocketbase/README.md](/Users/fanda/Dev/start/apps/pocketbase/README.md)

## New Project Setup

Before using this app for a new product, follow the
[project adoption checklist](/Users/fanda/Dev/start/.docs/adoption-checklist.md).

Organizations are enabled in the app env examples and still feature-flagged. This is an explicit
bootstrap default for new team-scope products; the runtime fallback is intentionally conservative,
so a missing `NEXT_PUBLIC_ORGANIZATIONS_ENABLED` disables organizations. Personal-scope products
should keep the variable set to `false` or omit it.

## Architecture Conventions

- Feature-first source of truth lives in `src/features/*`
- Shared contracts, types, and rules that are used by both features and server stay at the owning feature root
- No barrel exports (`index.ts` / `index.tsx`) in feature modules
- No `shared/` folders inside features; feature-wide types/helpers live at feature root
- Keep `src/components/ui` as the shadcn CLI target
- Application shell/composition belongs to `src/features/application`; account domain stays in `src/features/account`
- Keep route-scoped UI close to route context.
- Keep marketing shell files flat in `src/features/marketing` (`marketing-header.tsx`, `marketing-footer.tsx`)
- Keep `src/lib/utils.ts` limited to shadcn-safe helpers such as `cn()`
- Put app-specific shared helpers in `src/lib/app-utils.ts`; avoid spreading utility helpers across many micro files
- Keep server-only helpers in `src/server/*` domains (example: `src/server/captcha/turnstile.ts`)
- API route handlers live under `src/app/api/*`; current adapters include the PocketBase email-link
  route and the sample document export route.

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
- There is no client polling auth-session endpoint; cross-tab sync broadcasts sign-out events only.
- Additional auth-related route handlers live next to their route flows:
  - `src/app/[locale]/(auth)/(flow)/post-auth/route.ts`
  - `src/app/[locale]/(auth)/(flow)/verify-email/complete/route.ts`
  - invite accept/start handlers under `src/app/[locale]/(auth)/(flow)/invite/...`
- Client DX helpers exposed via `src/features/auth/auth-client.ts`:
  - `signIn`, `signOut`, `resetPasswordWithToken`, `confirmEmailChange`
- Sign-up and verification request forms call their server actions directly.
- Application routes are protected by:
  - `src/proxy.ts` cookie-presence redirect guard
  - server-layout fallback session validation in `src/app/[locale]/(application)/layout.tsx`

### Cookie Boundary

- Pages, layouts, and other render-time Server Components are cookie-read-only
- Auth and organization services may return serialized `setCookie[]`, but render code must never commit them
- Server Actions commit auth cookies through `src/server/auth/auth-cookies.ts`
- Route Handlers commit auth and organization cookies on `NextResponse`
- `src/proxy.ts` stays optimistic only; real auth and cleanup decisions stay near the data

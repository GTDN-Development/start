# Start

Next.js 16 starter app for marketing, auth, and application pages.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/base-ui components
- next-intl (EN/CS)
- Cloudflare Turnstile
- PocketBase (typegen + auth integration)

## Commands

```bash
npm install
npm run dev
npm run lint
npm run lint:fix
npm run check
npm run test
npm run test:e2e
npm run build
npm run format
npm run format:check
npm run pocketbase:typegen
```

## Env

Use `.env.example` as the template.

PocketBase typegen requires:

- `NEXT_PUBLIC_PB_URL`
- `PB_SUPERUSER_EMAIL`
- `PB_SUPERUSER_PASSWORD`

## PocketBase Typegen

- Command: `npm run pocketbase:typegen`
- Output: `src/types/pocketbase.ts`
- Source: live PocketBase collection schema
- Do not edit generated types manually

## Testing

Local testing uses `.env.test`.

- `npm run test` runs the Vitest suite once
- `npm run test:watch` runs Vitest in watch mode
- `npm run test:e2e` builds the app with test env and runs Playwright against `next start` on `http://127.0.0.1:3100`
- `npm run test:e2e:ui` is the local Playwright debugging variant
- auth/email E2E flows should set `PLAYWRIGHT_TEST_EMAIL` in `.env.test`; tests derive unique `+alias` recipients from it

## Tooling

- `npm run format` / `npm run format:check` run Prettier with `prettier-plugin-tailwindcss`
- `npm run lint` / `npm run lint:fix` run ESLint with Next.js baseline rules plus project architectural guardrails
- `npm run check` runs format and lint checks together

Conventions:

- colocate unit tests as `*.test.ts` / `*.test.tsx` inside `src/**`
- keep E2E tests in `tests/e2e/**`
- use explicit locale-prefixed URLs in E2E, preferably `/cs/...`
- keep PocketBase superuser credentials inside test helpers only, never in app runtime

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
- `.rules/pocketbase-integration.md` - PocketBase integration notes

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
- Additional auth-related route handlers live next to their route flows (for example invite accept/start handlers under `src/app/[locale]/(auth)/(flow)/invite/...`).
- Client DX API is exposed via `src/features/auth/auth-client.ts`:
  - `signIn`, `signUp`, `useSession`, `signOut`
- Application routes are protected by:
  - `src/proxy.ts` cookie-presence redirect guard
  - server-layout fallback session validation in `src/app/[locale]/(application)/layout.tsx`

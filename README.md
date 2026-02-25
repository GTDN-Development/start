# Start

Next.js 16 starter app for marketing, auth, and platform pages.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/base-ui components
- next-intl (EN/CS)
- Cloudflare Turnstile
- PocketBase (integration in progress)

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm run format
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

## Structure

- `src/app` - routes, layouts, API handlers
- `src/components` - UI and feature components
- `src/config` - structural config (menus, links, site data)
- `src/i18n` + `messages` - routing and translations
- `src/lib` - shared utilities
- `src/types` - shared types + generated PocketBase types
- `scripts/pocketbase-typegen.mjs` - PocketBase type generator
- `POCKETBASE-INTEGRATION.md` - PocketBase SSR/auth notes

## i18n Routing (EN keys + CS aliases)

- Default locale is `cs`
- Internal route keys stay in English (e.g. `"/login"`, `"/dashboard"`)
- Public Czech pathname aliases are configured in `src/i18n/routing.ts` via `pathnames`

Examples:

- Internal key: `"/login"`
- EN URL: `/en/login`
- CS URL alias: `/cs/prihlasit-se`

### Important navigation rules

- For internal app links use `@/components/ui/link` (wraps `@/i18n/navigation`)
- For localized redirects/path building use `@/i18n/navigation`
  - `redirect({href: "/login", locale})`
  - `getPathname({href: "/login", locale})`
- Do not build localized URLs manually with `/${locale}/...`
  - This breaks when pathname aliases are enabled
  - It also affects hidden form redirects, server redirects and metadata canonicals

### Server redirects (localized)

Use `redirect` from `@/i18n/navigation` for route redirects in server components/layouts.

```ts
import { redirect } from "@/i18n/navigation";
import { Locale } from "next-intl";

redirect({ href: "/login", locale: locale as Locale });
```

### Metadata canonicals / alternates

- Route metadata uses localized path generation for canonical URLs and language alternates
- `createPageMetadata(...)` now expects `locale` and an internal pathname key

## PocketBase Email Links (single template)

PocketBase templates cannot be localized per user in our setup, so auth emails should use the bridge route:

- Verify email: `{APP_URL}/api/pocketbase/email-link?action=verify-email&token={TOKEN}`
- Reset password: `{APP_URL}/api/pocketbase/email-link?action=reset-password&token={TOKEN}`
- Confirm email change: `{APP_URL}/api/pocketbase/email-link?action=confirm-email-change&token={TOKEN}`

Bridge behavior:

- Preserves token/query params
- Resolves locale by `?locale=...` -> `NEXT_LOCALE` cookie -> `Accept-Language` -> default `cs`
- Redirects to the localized auth page (including Czech aliases)

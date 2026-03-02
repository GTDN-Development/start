# Start

Next.js 16 starter app for marketing, auth, and platform pages.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- shadcn/base-ui components
- next-intl (EN/CS)
- Cloudflare Turnstile
- PocketBase (schema typegen only)

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

- `src/app` - routes, layouts, metadata, API route adapters
- `src/features` - feature-first modules (`auth`, `account`, `marketing`, `cookies`, `platform`)
- `src/components` - shared cross-feature UI infrastructure (`ui`, `layout`, `brand`, `providers`, `dev`)
- `src/server` - server-only infrastructure (`captcha`, `email`)
- `src/config` - structural config (menus, links, site data)
- `src/i18n` + `messages` - routing and translations
- `src/lib` - shared utilities
- `src/types` - shared types + generated PocketBase types
- `scripts/pocketbase-typegen.mjs` - PocketBase type generator
- `POCKETBASE-INTEGRATION.md` - PocketBase integration notes

## Architecture Conventions

- Feature-first source of truth lives in `src/features/*`
- No barrel exports (`index.ts` / `index.tsx`) in feature modules
- No `shared/` folders inside features; feature-wide types/helpers live at feature root
- Keep `src/components/ui` as the shadcn CLI target
- Platform shell/composition belongs to `src/features/platform`; account domain stays in `src/features/account`
- Keep route-scoped UI close to route context (example: `src/features/marketing/home/newsletter-cta.tsx`)
- Keep marketing shell files flat in `src/features/marketing` (`marketing-header.tsx`, `marketing-footer.tsx`)
- Keep common helpers centralized in `src/lib/utils.ts`; avoid splitting utility helpers into many micro files
- Keep server-only helpers in `src/server/*` domains (example: `src/server/captcha/turnstile.ts`)
- API groups are path-based:
  - Marketing: `/api/marketing/*`

## i18n Routing (EN keys + CS aliases)

- Default locale is `cs`
- Internal route keys stay in English (e.g. `"/login"`, `"/dashboard"`)
- Public Czech pathname aliases are configured in `src/i18n/routing.ts` via `pathnames`

Examples:

- Internal key: `"/login"`
- EN URL: `/en/login`
- CS URL alias: `/cs/prihlasit-se`

### Important navigation rules

- For internal localized app links use `@/components/ui/link` (re-exports `@/i18n/navigation` `Link`)
- For external URLs and hash/mailto/tel links use a native `<a>`
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

## Auth/Account Status

- Auth and account pages are currently static UI implementations.
- Form submissions are mocked client-side (validation + UI states only).
- No `/api/auth/*` or `/api/account/*` backend route handlers are active.

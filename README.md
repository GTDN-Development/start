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

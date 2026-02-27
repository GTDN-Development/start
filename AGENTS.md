# Agent Rules

## Code Style

- Named function exports only — no arrow function components or top-level arrow utils
- Double quotes, semicolons, 2-space indent, trailing commas (es5), printWidth 100
- Never use `any`. Never leave unused variables (prefix unused args with `_`)
- Use `size-*` utility when width and height are equal — **never** `w-* h-*` together
- In JSX, prefer `condition && <Element />` over `condition ? <Element /> : null` when there is no else branch
- Prefer named React hook imports (e.g. `import { useState } from "react"`) over `React.useState`

## Next.js

- **Never** import from `next/link` directly — use `@/components/ui/link` for internal localized links
- For external URLs and hash/mailto/tel links use a native `<a>` (do not force `@/components/ui/link`)
- Mirror route-specific feature folders to the actual app route/route-group structure when practical (e.g. `src/features/.../account/security/*` for `/account/security`)
- **Never** use `middleware.ts` — use `proxy.ts` for request interception (no edge runtime)
- `params` and `searchParams` must be awaited — they are async in Next.js 16
- `cookies()`, `headers()`, `draftMode()` must be awaited
- Use `"use cache"` directive for caching — not the old `fetch` cache options
- `revalidateTag(tag, cacheLifeProfile)` requires a cacheLife profile as the 2nd argument
- Parallel route slots require explicit `default.tsx` files

## Architecture

- Primary app/domain code lives in `src/features/*`
- `src/components/*` is for shared cross-feature UI infrastructure only (`ui`, `layout`, `brand`, `providers`, `dev`)
- Keep platform shell/composition in `src/features/platform`; keep account domain in `src/features/account`
- Keep route-scoped UI close to route context (example: `src/features/marketing/home/newsletter-cta.tsx`)
- Keep marketing shell files flat in `src/features/marketing` (`marketing-header.tsx`, `marketing-footer.tsx`)
- **Never** introduce barrel files (`index.ts` / `index.tsx`) in features
- **Never** add `shared/` folders inside features; place feature-wide types/helpers at feature root
- Keep `src/components/ui` shadcn-compatible (safe target for shadcn CLI generated components)
- Keep shared utility helpers centralized in `src/lib/utils.ts`; avoid splitting into many micro utility files
- Keep server-only helpers in `src/server/*` domains (example: `src/server/captcha/turnstile.ts`)
- API route groups:
  - auth: `src/app/api/auth/*`
  - account: `src/app/api/account/*`
  - marketing: `src/app/api/marketing/*`
  - cookies: `src/app/api/cookies/consent/route.ts`

## Tailwind CSS v4

- Use `@import "tailwindcss"` — **never** `@tailwind base/components/utilities`
- Use `bg-black/50` — **never** `bg-opacity-50`
- Use `bg-(--brand-color)` — **never** `bg-[--brand-color]`
- Use `margin-top` for spacing between sections; use `gap` inside flex/grid containers

## Components & UI

- Lucide icons: always import with `Icon` suffix (`ChevronRightIcon`), always `aria-hidden="true"` on decorative icons
- Local images: use `StaticImage` from `@/components/ui/static-image` — **never** raw `<img>`
- Remote images: use `remotePatterns` in `next.config.ts` — **never** `images.domains`
- `Button` with a non-`<button>` render target (`<a>`, `Link`, etc.) must set `nativeButton={false}`
- Base UI components with `render={<button ... />}` (e.g. menu items) must set `nativeButton={true}`; if `nativeButton={false}`, the render target must be non-`<button>`
- For form feedback use `Alert` component — **not** toast

## Forms

- Use unique ID prefixes per form (e.g. `contact-${field.name}`) to avoid conflicts with multiple forms on one page
- `aria-invalid={isInvalid}` on controls, `data-invalid={isInvalid}` on `<Field>` wrapper
- Zod e-mail validation: use `z.email()` (or `.pipe(z.email())`) — **never** deprecated `z.string().email()`

## State

- Defer `setState` inside `useEffect` via `Promise.resolve().then(...)` — **never** call it synchronously

## Configuration & Menus (`src/config/menu.ts`)

- **Never** reintroduce `getMenu`, `getMenuLinks`, `flattenMenuItems`, group resolvers, or multi-step mapping layers — use direct exported arrays
- Keep already-flat menus (`authMenu`, `platformMenu`, `legalItems`) flat; only `marketingMenu` is nested
- Every new `labelKey` in `menu.ts` must be added to both `messages/en.json` and `messages/cs.json` under `layout.navigation.items`
- Auth CTAs (login/sign-up) are component-level — **not** part of `marketingMenu`
- Menu `href` values must be internal path-only strings (e.g. `"/pricing"`)

## Internationalization

- All user-facing copy goes in `messages/*.json` — **never** hardcode UI strings in components or config files except of placeholders with titles like `"Content"`
- `src/config/*` holds structural data (routes, links, business info) — **not** localized copy
- Top-level message sections: `common`, `layout`, `pages`, `forms`, `legal`, `cookies`
- Internal app routes stay in English (e.g. `"/login"`); Czech pathname aliases live only in `src/i18n/routing.ts` `pathnames`
- For internal navigation use `@/i18n/navigation` (`Link`, `useRouter`, `redirect`, `getPathname`) — avoid `next/navigation` for localized redirects/push/replace
- **Never** build localized app URLs manually with `/${locale}/...` for redirects, hidden form inputs, metadata, or links — use `redirect({href, locale})` / `getPathname({href, locale})`
- API `redirectTo` values must be internal path-only route keys (English), preferably typed/allowlisted
- PocketBase auth email templates should link to `/api/pocketbase/email-link` (single-template bridge), not directly to locale-specific auth pages

## PocketBase / Typegen

- Generate PocketBase schema types with `npm run pocketbase:typegen`
- Required env vars for typegen: `NEXT_PUBLIC_PB_URL`, `PB_SUPERUSER_EMAIL`, `PB_SUPERUSER_PASSWORD`
- Generated file is `src/types/pocketbase.ts` — do not edit manually
- Re-run typegen after PocketBase schema changes before writing/adjusting PocketBase integration code

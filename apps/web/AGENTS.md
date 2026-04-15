<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

These instructions apply only to files under `apps/web/**`.

## Code Style

- Named function exports only — no arrow function components or top-level arrow utils
- Double quotes, semicolons, 2-space indent, trailing commas (es5), printWidth 100
- Never use `any`. Never leave unused variables (prefix unused args with `_`)
- Use `size-*` utility when width and height are equal — **never** `w-* h-*` together
- In JSX, prefer `condition && <Element />` over `condition ? <Element /> : null` when there is no else branch
- Prefer named React hook imports (e.g. `import { useState } from "react"`) over `React.useState`
- Keep setup sections readable: group related constants/hooks/state/derived values together and separate those groups with a blank line in pages, components, and server helpers

## Next.js

- **Never** import from `next/link` directly — use `@/components/ui/link` for internal localized links
- For external URLs and hash/mailto/tel links use a native `<a>` (do not force `@/components/ui/link`)
- Mirror route-specific feature folders to the actual app route/route-group structure when practical (e.g. `src/features/.../account/security/*` for `/account/security`)
- Prefer route-group/layout splits over client pathname branching when the difference affects first paint, chrome, or `loading.tsx`
- **Never** use `middleware.ts` — use `proxy.ts` for request interception (no edge runtime)
- `params` and `searchParams` must be awaited — they are async in Next.js 16
- `cookies()`, `headers()`, `draftMode()` must be awaited
- Never mutate cookies during Server Component/page/layout render. In Next.js 16, cookie writes are allowed only in Server Actions, Route Handlers, or other response-writing server contexts
- If a service returns `setCookie[]`, treat it as response metadata only. Only Server Actions may commit it with the action cookie writer, and only Route Handlers may commit it on `NextResponse`
- URL-token auth flows and redirect-plus-cookie handoffs belong in Route Handlers, not in `page.tsx` or `layout.tsx`
- Keep `proxy.ts` optimistic only: cookie presence checks and fast redirects, never DB-backed auth repair or session mutation
- Use `"use cache"` directive for caching — not the old `fetch` cache options
- `revalidateTag(tag, cacheLifeProfile)` requires a cacheLife profile as the 2nd argument
- Parallel route slots require explicit `default.tsx` files
- Treat `router.refresh()` as a last resort for server-driven views; if the UI already has a shared/local source of truth, update that directly instead
- Do not pair `router.refresh()` with an already-applied local/context patch for the same mutation
- Do not call `router.refresh()` immediately after `router.push()` or `router.replace()`
- Be extra careful with `router.refresh()` on routes with `loading.tsx` or nested Suspense boundaries — it can remount large route segments, cause loading flicker, and surface React boundary bugs

## Architecture

- Primary app/domain code lives in `src/features/*`
- `src/components/*` is for shared cross-feature UI infrastructure only (`ui`, `layout`, `brand`, `dev`)
- Keep shared contracts, types, and rules that are used by both features and server at the owning feature root
- Keep application shell/composition in `src/features/application`; keep account domain in `src/features/account`
- Keep route-scoped UI close to route context (example: `src/features/marketing/home/newsletter-cta.tsx`)
- Keep marketing shell files flat in `src/features/marketing` (`marketing-header.tsx`, `marketing-footer.tsx`)
- **Never** introduce barrel files (`index.ts` / `index.tsx`) in features
- **Never** add `shared/` folders inside features; place feature-wide types/helpers at feature root
- Keep `src/components/ui` shadcn-compatible (safe target for shadcn CLI generated components)
- Keep `src/lib/utils.ts` shadcn-managed and limited to preset-safe utilities (for example `cn()`); put app-specific shared helpers in `src/lib/app-utils.ts`
- Never add app-specific helpers to `src/lib/utils.ts`. Reason: changing or reapplying a shadcn preset can restore `src/lib/utils.ts` to the default shadcn version, which removes custom helpers and breaks imports
- Before adding a new helper/utility, check whether an existing one already exists in `src/lib/app-utils.ts`, `src/lib/utils.ts` for shadcn-safe helpers only, the relevant feature root, or `src/server/*`, and reuse/extend it when practical
- Do not introduce shared helpers/components too early just to deduplicate markup; two instances are not enough on their own to justify an abstraction
- Three instances is still a judgment call and depends on context; prefer duplication unless the abstraction has clear semantic value, ownership, or behavioral reuse
- Usually only extract a shared helper/component when the same pattern appears in four or more places, or when there is a strong reason beyond deduplication
- Do not extract one-off wrapper components when the same UI is clearer as inline composition with existing primitives in the route/layout file
- Do not extract duplicated JSX into intermediate variables only to avoid small local duplication
- Keep server-only helpers in `src/server/*` domains (example: `src/server/captcha/turnstile.ts`)
- API route groups:
  - marketing: `src/app/api/marketing/*`

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
- For small, localized UI changes, prefer inline composition with existing shared primitives (`Button`, `Link`, etc.) over extracting one-off helper components
- Do not introduce local wrapper/helper components only to deduplicate a tiny amount of markup inside a single file, unless they carry their own logic, semantics, or are likely to be reused meaningfully
- Prefer a direct `Button` with `render={<Link ... />}` over a custom CTA wrapper component when the abstraction would only hide a simple one-off render pattern
- When a variant changes only inner content or a few classes, keep one shared outer wrapper and branch inside it

## Forms

- Use unique ID prefixes per form (e.g. `contact-${field.name}`) to avoid conflicts with multiple forms on one page
- `aria-invalid={isInvalid}` on controls, `data-invalid={isInvalid}` on `<Field>` wrapper
- Zod e-mail validation: use `z.email()` (or `.pipe(z.email())`) — **never** deprecated `z.string().email()`

## State

- Default to no raw `useEffect` in app code — follow `../../.rules/use-effect-guidelines.md`
- Prefer render-time derivation, event handlers, server/data abstractions, `key`, and `useSyncExternalStore` over `useEffect`
- Prefer one source of truth per interactive surface; if a mutation must update multiple visible components, use shared client state or return the updated payload instead of relying on a broad `router.refresh()`
- `useMountEffect()` is only for mount/unmount sync with external systems — do not move business logic into it just to satisfy lint
- `useLayoutEffect()` is only for DOM measurement or pre-paint sync that would visibly break in `useEffect`

## Testing

- For narrow bug fixes, keep test changes smaller than the fix when practical. Prefer one targeted test at the owning layer over large new scaffolding; if the test diff grows larger or more complex than the bug fix, tighten the scope unless broader coverage is clearly needed.

## Configuration & Menus (`src/config/menu.ts`)

- **Never** reintroduce `getMenu`, `getMenuLinks`, `flattenMenuItems`, group resolvers, or multi-step mapping layers — use direct exported arrays
- Keep already-flat menus (`authMenu`, `applicationMenu`, `legalItems`) flat; only `marketingMenu` is nested
- Every new `labelKey` in `menu.ts` must be added to both `messages/en.json` and `messages/cs.json` under `layout.navigation.items`
- Auth CTAs (sign-in/sign-up) are component-level — **not** part of `marketingMenu`
- Menu `href` values must be internal path-only strings (e.g. `"/pricing"`)

## Internationalization

- All user-facing copy goes in `messages/*.json` — **never** hardcode UI strings in components or config files except of placeholders with titles like `"Content"`
- `src/config/*` holds structural data (routes, links, business info) — **not** localized copy
- Top-level message sections: `common`, `layout`, `pages`, `forms`, `legal`, `cookies`
- Internal app routes stay in English (e.g. `"/sign-in"`); Czech pathname aliases live only in `src/i18n/routing.ts` `pathnames`
- For internal navigation use `@/i18n/navigation` (`Link`, `useRouter`, `redirect`, `getPathname`) — avoid `next/navigation` for localized redirects/push/replace
- **Never** build localized app URLs manually with `/${locale}/...` for redirects, hidden form inputs, metadata, or links — use `redirect({href, locale})` / `getPathname({href, locale})`
- API `redirectTo` values must be internal path-only route keys (English), preferably typed/allowlisted
- Auth and account routes are currently static UI flows (no backend integration)

## PocketBase / Typegen

- Generate PocketBase schema types with `pnpm pocketbase:typegen`
- Required env vars for typegen: `NEXT_PUBLIC_PB_URL`, `PB_SUPERUSER_EMAIL`, `PB_SUPERUSER_PASSWORD`
- Generated file is `src/types/pocketbase.ts` — do not edit manually
- Re-run typegen after PocketBase schema changes before writing/adjusting PocketBase integration code

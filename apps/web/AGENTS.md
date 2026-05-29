<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

These instructions apply only to files under `apps/web/**`.

## Hard Rules

- Do not import from `next/link` directly outside the existing localized link wrappers. Use `@/components/ui/link` for internal localized links; use native `<a>` for external, hash, `mailto`, and `tel` links.
- Do not use `middleware.ts`; this app uses `proxy.ts` for request interception.
- Do not mutate cookies during Server Component, page, or layout render. Cookie writes belong only in Server Actions, Route Handlers, or other response-writing contexts.
- Do not build localized app URLs manually with `/${locale}/...` in normal app code; use `@/i18n/navigation` helpers. `proxy.ts` and i18n routing utilities are the boundary exceptions.
- Do not add new app-flow or navigation copy directly in components or config files. Use `messages/*.json`, except obvious placeholders such as `"Content"`.
- Do not add barrel files (`index.ts` / `index.tsx`) in features.
- Do not add `shared/` folders inside features.
- Do not add app-specific helpers to `src/lib/utils.ts`; keep it shadcn-safe and put app helpers in `src/lib/app-utils.ts` or the owning feature/server module.
- Do not use `any`, leave unused variables, or edit generated `src/types/pocketbase.ts` manually.

## Next.js 16 Boundaries

- Before touching Next.js APIs, check the local docs in `node_modules/next/dist/docs/`.
- `params`, `searchParams`, `cookies()`, `headers()`, and `draftMode()` are async.
- URL-token auth flows and redirect-plus-cookie handoffs belong in Route Handlers, not in `page.tsx` or `layout.tsx`.
- Keep `proxy.ts` optimistic only: cookie presence checks and fast redirects, never DB-backed auth repair or session mutation.
- Use the `"use cache"` directive for caching, not old `fetch` cache options.
- `revalidateTag(tag, cacheLifeProfile)` requires a cacheLife profile as the second argument.
- Parallel route slots require explicit `default.tsx` files.

## State And Effects

- Default to no raw `useEffect` in app code; follow `../../docs/guidelines/use-effect.md`.
- Do not move business logic into `useMountEffect()` just to satisfy lint. It is only for mount/unmount sync with external systems.
- Treat `useLayoutEffect()` as DOM measurement or pre-paint sync only.
- Treat `router.refresh()` as a last resort for server-driven views. Do not pair it with an already-applied local/context patch, and do not call it immediately after `router.push()` or `router.replace()`.

## PocketBase

- Never share one global user PocketBase instance on the server. User-scoped server code must create a fresh client per request through the server PocketBase helpers.
- Treat `pb.authStore` cookie export as response metadata; only Server Actions and Route Handlers may commit it.
- Re-run `pnpm pocketbase:typegen` after PocketBase schema changes.

## UI And Styling

- Keep `src/components/ui` shadcn-compatible.
- For shadcn/Base UI components, do not create nested `<button>` elements. If `Button` renders a non-button target, set `nativeButton={false}`; if Base UI renders a real `<button>`, set `nativeButton={true}`.
- Use Tailwind CSS v4 syntax: `@import "tailwindcss"`, `bg-black/50`, `bg-(--token)`. Do not use `@tailwind base/components/utilities`, `bg-opacity-*`, or `bg-[--token]`.
- Use `remotePatterns` in `next.config.ts`; do not use deprecated `images.domains`.
- Use `size-*` when width and height are equal.

## Project-Specific Traps

- `src/config/menu.ts`: do not reintroduce `getMenu`, `getMenuLinks`, `flattenMenuItems`, group resolvers, or multi-step mapping layers. Keep the current direct exported arrays.
- `src/config/menu.ts`: every new `labelKey` must be added to both `messages/en.json` and `messages/cs.json` under `layout.navigation.items`.
- Internal app routes stay in English; Czech aliases belong only in `src/i18n/routing.ts` `pathnames`.

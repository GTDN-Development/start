# Layout Banner System

Layout banners are global notices shown above navigation in the marketing and application shells.

- Records live in PocketBase collection `layout_banners`.
- The first version is managed through the PocketBase admin UI; there is no custom web admin.
- Public reads are allowed only for records with `enabled = true`; writes are superuser-only.
- The app fetches active banners server-side and renders at most one banner per shell.
- Higher `priority` wins. If priorities match, the newest record wins.

## Collection Fields

- `enabled` controls whether the record can be displayed.
- `show_marketing` displays the banner above the marketing navigation.
- `show_application` displays the banner in the application content area, not across the sidebar.
- `remember_dismiss` enables the close button and stores dismissal in both `localStorage` and a
  client-readable cookie.
- `priority` is an integer. Use higher values for more important banners.
- `bg_image` is an optional JPEG, PNG, or WebP background image rendered full-width at 40% opacity.
- `severity` controls the visual intent: `info`, `warning`, or `success`.
- `title_cs`, `title_en`, `body_cs`, and `body_en` provide localized content.
- `cta_label_cs`, `cta_label_en`, `cta_href`, and `cta_open_new_tab` define an optional CTA.

## Selection Rules

- Marketing pages request the `marketing` area; app/admin pages request the `application` area.
- A banner must be `enabled` and enabled for the requested area.
- A banner must have a non-empty localized title or body for the active locale.
- CTA renders only when both localized label and `cta_href` are present.
- Known app CTA hrefs such as `/app`, `/pricing`, `/contact`, and `/blog` are localized server-side
  before rendering. Unknown root-relative hrefs are rendered as entered.
- PocketBase failures fail closed: the layout renders without a banner.
- Banner reads use Next.js Cache Components with `cacheTag("layout-banners")` and a short profile:
  `stale = 30s`, `revalidate = 60s`, `expire = 3600s`. This keeps the banner in the initial
  server-rendered layout without requiring a `Suspense` fallback above navigation.

## Dismiss Behavior

Dismissal is local to the current browser/device.

- The storage key is `layout_banner_dismissed_ids`.
- The cookie name is also `layout_banner_dismissed_ids`; it expires after 180 days.
- The stored value is a JSON array of banner record IDs.
- The cookie is used by a small pre-paint guard so a dismissed server-rendered banner is hidden
  before it can cause a visible layout shift on reload. Next.js Cache Components do not allow this
  marketing layout to read request cookies directly without moving the slot back behind `Suspense`.
- Changing a banner by creating a new record gives it a new ID and shows it again.
- Disabling `remember_dismiss` removes the close button and does not write storage.

## Local Demo Banner

`pnpm local:up` sets `PB_SEED_LAYOUT_BANNER_DEMO=true` for the local PocketBase container. When the
layout banner migrations run locally, this creates one enabled demo banner:

- shown in both marketing and application layouts
- `severity = warning`
- `remember_dismiss = true`
- `priority = 100`
- localized Czech and English content
- CTA pointing to `/app`

Deployments and e2e test stacks do not set this env variable, so the demo banner is not created there.

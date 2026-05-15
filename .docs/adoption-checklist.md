# Project Adoption Checklist

Use this checklist when creating a new product from Start. Keep the proven platform pieces intact and
change only the product-specific surfaces.

## Product Surface

- Update product metadata in [app config](/Users/fanda/Dev/start/apps/web/src/config/app.ts).
- Replace logo/favicon/OG/email assets:
  [logo component](/Users/fanda/Dev/start/apps/web/src/components/brand/logo-start.tsx),
  [SVG assets](/Users/fanda/Dev/start/apps/web/src/assets/svgs),
  [favicon](/Users/fanda/Dev/start/apps/web/src/app/favicon.ico),
  [OG image](/Users/fanda/Dev/start/apps/web/src/assets/images/og-image.jpg), and
  [email logo](/Users/fanda/Dev/start/apps/web/public/email/start-logo-email.png).
- Update social links in [brand config](/Users/fanda/Dev/start/apps/web/src/config/brand.ts) or
  remove unused profiles.
- Rewrite product-facing copy in [English messages](/Users/fanda/Dev/start/apps/web/messages/en.json)
  and [Czech messages](/Users/fanda/Dev/start/apps/web/messages/cs.json).

## Theme And UI Preset

- Change the shadcn preset in [components.json](/Users/fanda/Dev/start/apps/web/components.json)
  when the project should start from a different shadcn style.
- Change design tokens in [globals.css](/Users/fanda/Dev/start/apps/web/src/styles/globals.css):
  primary color, radius, chart colors, sidebar colors, and dark-mode values.

## Legal And Compliance

- Review company/contact values and legal toggles in
  [legal config](/Users/fanda/Dev/start/apps/web/src/config/legal.ts).
- Update `legalDocumentDates`, cookie catalog entries, and GDPR third-party defaults before launch.

## Environment And Deployment

- Configure web envs from [prod example](/Users/fanda/Dev/start/apps/web/.env.prod.example).
- Configure PocketBase envs from
  [PocketBase env example](/Users/fanda/Dev/start/apps/pocketbase/.env.example).
- Keep `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_PB_URL` without trailing slashes.
- On Railway, keep `apps/pocketbase` as the root directory and mount a volume to `/pb_data`.
- Use Mailpit only for local development and E2E tests.

## Organizations

- Organizations, invites, and roles are enabled by default.
- Set `NEXT_PUBLIC_ORGANIZATIONS_ENABLED=false` only when the product should stay personal-scope.
- Review role language, invite emails, member settings, limits, and support/legal wording.

## Keep Stable Foundations Intact

- Do not rewrite auth, account, cookie boundaries, PocketBase migrations/hooks, Railway startup,
  Mailpit integration, or E2E helpers unless the product has a concrete need.
- Do not edit deployed PocketBase migrations in place. Add a new migration for schema changes.

## Verification

- Run `pnpm check`, `pnpm test`, and `pnpm test:e2e` before launch.
- Manually inspect both locales for public pages, auth flows, account settings, email flows, and
  organization flows.

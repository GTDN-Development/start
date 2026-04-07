# Email System

## What This Solves

This layer handles emails sent directly by the application code.

- building HTML emails in React
- generating a plain text version from the same source
- localizing email copy through `next-intl`
- sending through SMTP via Nodemailer

The goal is a simple flow without extra framework layers.

## Stack

- `nodemailer`: actual SMTP delivery
- `@react-email/components`: React components for email markup
- `@react-email/render`: rendering React templates to `html` and `text`
- `react-email`: local preview via `pnpm email:dev`
- `next-intl`: email copy from `apps/web/messages/*.json`

## Out Of Scope

This is not a universal email system for everything in the project.

- it only covers emails sent from app code
- PocketBase system emails are outside this layer
- if PocketBase sends its own internal email, it does not go through the React Email / Nodemailer flow in `apps/web/src/server/email`

In practice:

- app-driven emails: go through `apps/web/src/server/email/*`
- PocketBase-native emails: are separate and need to be handled separately

## How It Works

The flow is always the same:

1. a server flow calls a builder
2. the builder returns `subject`, `react`, and optionally `replyTo` / `attachments`
3. `renderEmail()` turns that into `html` and `text`
4. `sendEmail()` or `sendFormEmail()` sends it through Nodemailer

Short version:

- builder handles data and translations
- template handles markup
- render helper handles final payload generation
- transport handles SMTP

## File Map

- transport: [email-transport.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-transport.ts)
- render helper: [render-email.ts](/Users/fanda/Dev/start/apps/web/src/server/email/render-email.ts)
- shared messages helper: [email-messages.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-messages.ts)
- shared theme: [email-theme.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-theme.ts)
- shared layout: [email-layout.tsx](/Users/fanda/Dev/start/apps/web/src/server/email/email-layout.tsx)
- shared form styles: [email-styles.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-styles.ts)
- template and builder files: `/apps/web/src/server/email/templates/*`
- email image assets: `/apps/web/public/email/*`
- translations: `apps/web/messages/en.json` and `apps/web/messages/cs.json` under `emails`

## Template Vs Builder

`*.tsx` template:

- renders the actual email markup
- has `export default`
- can include `PreviewProps` for local preview

`*.builder.ts`:

- receives business input
- loads translations
- prepares template props
- returns the email contract for `renderEmail()`

Rule of thumb:

- visual structure belongs in the template
- text, locale, URLs, and subject belong in the builder

## Adding A New Email

Typical flow:

1. `apps/web/src/server/email/templates/my-email.tsx`
2. `apps/web/src/server/email/templates/my-email.builder.ts`
3. `getEmailMessages()` inside the builder
4. `formatEmailTimestamp()` when date/time formatting is needed
5. copy in `apps/web/messages/en.json` and `apps/web/messages/cs.json` under `emails`
6. caller flow using this pattern:

```ts
await sendEmail({
  to,
  ...(await renderEmail(await buildMyEmail(...))),
});
```

For internal inbox emails, `sendFormEmail()` is usually the better fit than `sendEmail()`.

## Changing The Look

Global changes:

- wrapper, footer, base layout: [email-layout.tsx](/Users/fanda/Dev/start/apps/web/src/server/email/email-layout.tsx)
- colors, spacing tokens, brand values: [email-theme.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-theme.ts)
- shared form-email styles: [email-styles.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-styles.ts)

Local changes:

- the look of a single email is handled in its own `.tsx` template

## Email Logo Asset

Current asset:

- [start-logo-email.png](/Users/fanda/Dev/start/apps/web/public/email/start-logo-email.png)

Current convention:

- email-specific hosted images live in `/apps/web/public/email`
- logo asset is a `PNG`
- current size is `300 x 80 px`
- a solid white background is preferred over transparency for email-client safety

Why `public`:

- email clients need a stable external URL
- `/apps/web/public/email/...` maps cleanly to `/email/...`
- this is more predictable than relying on Next build asset paths for email-hosted images

Reason:

- email clients are less predictable than the web
- this project currently uses conservative light email templates
- a single PNG logo is safer than maintaining separate dark/light email logo variants

## Changing Copy

- copy lives in `apps/web/messages/en.json`
- copy lives in `apps/web/messages/cs.json`
- email keys stay under `emails`

There should not be a second email i18n system outside `next-intl`.

## Locale Rules

- internal form emails use `routing.defaultLocale`
- recipient-facing emails should receive the real `locale` from the flow

Examples:

- contact/support/newsletter: fixed internal locale
- workspace invite: locale based on user or UI flow

## Reply-To And Attachments

`replyTo`:

- returned from the builder output
- typically used for inbox emails from forms

`attachments`:

- returned from the builder output
- transport passes them straight to Nodemailer

## Preview And Local Development

- main preview workflow: `pnpm email:dev`
- preview reads `apps/web/src/server/email/templates`
- templates need `export default`
- preview data lives in `PreviewProps` inside the template file

This is the main workflow for visual and copy iteration.

## Debugging A Template

When the issue is visual:

- `pnpm email:dev` is usually the first step
- `PreviewProps` is the fastest local input to adjust
- the problem is usually in the `.tsx` template or shared layout/styles

When the issue is data-related:

- the builder is usually the main place to inspect
- builder input is the first thing to verify
- translations in `apps/web/messages/*.json` are the second common place to check

When plain text output looks wrong:

- the issue is usually in the `renderEmail()` output or in the HTML structure
- it helps to verify how `toPlainText()` converts links and CTAs

When preview looks correct but the delivered email does not:

- the next useful step is sending to Mailpit or a test inbox
- that is where the real SMTP payload and client behavior can be verified

When render fails:

- the builder is usually the first place to inspect
- required props are worth checking first
- template code should also be checked for anything preview/runtime cannot handle

## Common Changes

Subject change:

- handled in the builder

Copy change:

- handled in `apps/web/messages/en.json` and `apps/web/messages/cs.json`

CTA URL change:

- handled in the builder

Global spacing or color change:

- usually handled in `email-theme.ts` or `email-layout.tsx`

Single-email visual change:

- handled in that specific template

Attachment support:

- attachments come from the builder

`replyTo` support:

- `replyTo` comes from the builder

## Checklist After Changes

- `pnpm lint`
- `pnpm typecheck`
- if the change is visual, also check `pnpm email:dev`

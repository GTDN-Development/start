# Email System

App-owned emails use React Email templates, localized copy, and a shared transport.

- App email code lives in [src/server/email](/Users/fanda/Dev/start/apps/web/src/server/email).
- PocketBase-native system emails are separate from this layer.
- Builders prepare subject, locale copy, URLs, `replyTo`, and attachments.
- Templates render email markup and local preview props.
- `renderEmail()` creates HTML and plain text.
- `sendEmail()` sends through SMTP or Mailpit API, based on `MAIL_TRANSPORT`.
- Form inbox emails usually use `sendFormEmail()`.
- Copy lives in `apps/web/messages/en.json` and `apps/web/messages/cs.json` under `emails`.
- Email images live in `apps/web/public/email`.

Add a new app email:

1. Add `templates/my-email.tsx`.
2. Add `templates/my-email.builder.ts`.
3. Add copy under `emails` in both locale files.
4. Send it with:

```ts
await sendEmail({
  to,
  ...(await renderEmail(await buildMyEmail(...))),
});
```

Useful files:

- [email-transport.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-transport.ts)
- [render-email.ts](/Users/fanda/Dev/start/apps/web/src/server/email/render-email.ts)
- [email-layout.tsx](/Users/fanda/Dev/start/apps/web/src/server/email/email-layout.tsx)
- [email-theme.ts](/Users/fanda/Dev/start/apps/web/src/server/email/email-theme.ts)

Useful commands: `pnpm email:dev`, `pnpm test`, `pnpm check`.

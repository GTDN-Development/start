# Email System

PocketBase owns transactional email rendering and delivery.

- Email hooks live in [pb_hooks](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks).
- Custom app emails are Czech-only and file-backed.
- Next.js server actions validate UI input, run Turnstile when enabled, then call PocketBase with `START_INTERNAL_API_SECRET`.
- PocketBase validates payloads again, checks PB auth/roles for user-bound flows, renders HTML/text, and sends through its configured SMTP client.
- Auth email templates stay in committed PocketBase migrations.
- Email images live in `apps/web/public/email` because email links resolve against `NEXT_PUBLIC_APP_URL`.

Current custom email flows:

- Contact Request notification
- Support Request notification with bounded attachments
- Organization Invite create/resend emails

Useful files:

- [PocketBase email helper](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks/lib/start-email.js)
- [PocketBase email endpoints](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks/emails.pb.js)
- [Organization invite hooks](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks/organization-invites.pb.js)
- [PocketBase Mailpit settings](/Users/fanda/Dev/start/apps/pocketbase/scripts/apply-mailpit-settings.mjs)

Useful commands: `pnpm local:up`, `pnpm pocketbase:mailpit:apply`, `pnpm test`, `pnpm check`.

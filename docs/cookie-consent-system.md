# Cookie Consent System

Cookie consent gates analytics and records a small audit trail.

- Main cookie: `cookie_consent`, versioned by `COOKIE_CONSENT_VERSION`.
- Subject cookie: `cookie_consent_subject`, a pseudonymous browser key for audit events.
- Categories are necessary, functional, analytics, and marketing; necessary is always true.
- Client state lives in [cookie-context.tsx](/Users/fanda/Dev/start/apps/web/src/features/cookies/cookie-context.tsx).
- Consent actions write the browser cookie and send an audit event through a server action.
- Audit events are stored in PocketBase `cookie_consent_events`.
- Audit events are retained for 395 days and cleaned daily by a PocketBase cron hook.
- Analytics scripts mount only after the cookie store is ready and analytics consent is true.
- If both GTM and GA IDs are set, GTM wins.
- `NEXT_PUBLIC_COOKIE_CONSENT_ENABLED=false` disables the UI and analytics mounting.

Useful files:

- [cookie consent config](/Users/fanda/Dev/start/apps/web/src/config/cookie-consent.ts)
- [cookie feature README](/Users/fanda/Dev/start/apps/web/src/features/cookies/README.md)
- [analytics scripts](/Users/fanda/Dev/start/apps/web/src/features/cookies/analytics-scripts.tsx)
- [consent service](/Users/fanda/Dev/start/apps/web/src/server/cookie-consent/cookie-consent-service.ts)
- [PocketBase cleanup hook](/Users/fanda/Dev/start/apps/pocketbase/pb_hooks/cookie-consent-cleanup.pb.js)

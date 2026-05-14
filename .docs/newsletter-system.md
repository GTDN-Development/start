# Newsletter System

Newsletter is a lightweight capture flow, not a production mailing platform.

- The public marketing form validates email syntax and verifies Turnstile when enabled.
- Successful signups are stored in PocketBase `newsletter_subscriptions`.
- Email is normalized to lowercase before it is stored.
- Duplicate email submissions are treated as success and do not create another record.
- A best-effort internal notification email is sent after a new subscription is stored.
- The current implementation does not verify that the inbox exists or that the owner confirmed the subscription.
- There is no unsubscribe flow, campaign management, segmentation, delivery audit, or mailing provider integration.
- This is an intentional interim trade-off so the form can collect interested people before a future swap to a dedicated newsletter tool.

Useful files:

- [newsletter form](/Users/fanda/Dev/start/apps/web/src/features/marketing/newsletter/newsletter-form.tsx)
- [newsletter action](/Users/fanda/Dev/start/apps/web/src/features/marketing/newsletter/newsletter-actions.ts)
- [newsletter email builder](/Users/fanda/Dev/start/apps/web/src/server/email/templates/newsletter-signup.builder.ts)
- [PocketBase schema snapshot](/Users/fanda/Dev/start/apps/pocketbase/pb_migrations/1774467906_collections_snapshot.js)

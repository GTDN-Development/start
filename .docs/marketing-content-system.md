# Marketing And Content

Marketing pages are mostly static UI, with a few server-backed flows.

- Marketing routes include home, pricing, blog, contact, sales/support, legal, changelog, roadmap, features, and integrations.
- Contact and newsletter forms validate input, verify Turnstile when enabled, and send app-owned form emails.
- Support form requires an authenticated user and can include bounded attachments.
- Form emails use the shared email system and `GENERAL_FORMS_RECIPIENT`.
- Blog posts are fetched from PocketBase `posts` records with `status="published"` and matching locale.
- Blog fetching uses Next cache with the `blog` cache life profile.
- YouTube watch links inside blog HTML are converted to iframe embeds.

Useful files:

- [contact actions](/Users/fanda/Dev/start/apps/web/src/features/marketing/contact/contact-actions.ts)
- [newsletter actions](/Users/fanda/Dev/start/apps/web/src/features/marketing/newsletter/newsletter-actions.ts)
- [support attachments](/Users/fanda/Dev/start/apps/web/src/features/marketing/contact/support-attachments.ts)
- [blog API](/Users/fanda/Dev/start/apps/web/src/server/blog/blog-api.ts)
- [marketing menu](/Users/fanda/Dev/start/apps/web/src/config/menu.ts)

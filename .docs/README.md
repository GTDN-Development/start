# Project Notes

Quick map of the current app:

- Next.js web app in `apps/web`, with localized marketing, auth, account, and organization routes.
- PocketBase deployment app in `apps/pocketbase`, with committed schema migrations and hooks.
- Mailpit local email app in `apps/mailpit`, used by local development and E2E tests.
- Main product features: sign up, sign in, email verification, password reset, account settings, avatars, organization creation, invites, members, roles, and organization settings.
- Marketing features: home, pricing, blog, contact, sales/support forms, newsletter, legal pages, changelog, roadmap, features, and integrations.
- Tests use Vitest for unit/business rules and Playwright for full browser flows.

Focused notes:

- [Account system](account-system.md)
- [Application shell](application-shell.md)
- [Auth system](auth-system.md)
- [Avatar system](avatar-system.md)
- [Back navigation](back-navigation.md)
- [Cookie consent system](cookie-consent-system.md)
- [Email system](email-system.md)
- [I18n and routing](i18n-routing-system.md)
- [Local stack](local-stack.md)
- [Marketing and content](marketing-content-system.md)
- [Newsletter system](newsletter-system.md)
- [Organization system](organization-system.md)
- [PocketBase production readiness](pocketbase-production-readiness.md)
- [Testing system](testing-system.md)

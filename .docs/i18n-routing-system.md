# I18n And Routing

Routing uses `next-intl` with English internal route keys and localized public URLs.

- Supported locales are `cs` and `en`; default locale is `cs`.
- URLs are always locale-prefixed.
- Internal route keys stay English, for example `/sign-in` and `/account/security`.
- Czech path aliases live only in [routing.ts](/Users/fanda/Dev/start/apps/web/src/i18n/routing.ts).
- Use [navigation.ts](/Users/fanda/Dev/start/apps/web/src/i18n/navigation.ts) for `Link`, `redirect`, `useRouter`, `usePathname`, and `getPathname`.
- Do not manually build localized URLs with `/${locale}/...`.
- Menu config stores structure and route keys only; labels come from message files.
- Every menu `labelKey` must exist in both `messages/en.json` and `messages/cs.json`.

Useful files:

- [routing config](/Users/fanda/Dev/start/apps/web/src/i18n/routing.ts)
- [localized navigation](/Users/fanda/Dev/start/apps/web/src/i18n/navigation.ts)
- [menu config](/Users/fanda/Dev/start/apps/web/src/config/menu.ts)
- [route constants](/Users/fanda/Dev/start/apps/web/src/config/routes.ts)

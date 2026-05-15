# Changelog

This changelog tracks notable changes in `apps/web` from the current application baseline onward.
Older legacy-app history was intentionally removed during the initial reset.

## Format

Add new entries at the top.

```md
## YYYY-MM-DD

- Added: ...
- Changed: ...
- Fixed: ...
- Removed: ...
```

Use only the categories that apply. Keep bullets user-facing and concise; mention implementation
details only when they explain an important behavior or migration.

## 2026-05-15

- Initial baseline for the current `apps/web` application.
- Current app scope covers the public site, authentication flows, and the authenticated app shell.
- Baseline stack includes Next.js 16, React 19, Tailwind CSS v4, next-intl, shadcn/Base UI
  components, and PocketBase integration.

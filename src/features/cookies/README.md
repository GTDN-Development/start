# Cookie Consent

Cookie consent module for Next.js App Router with:

- SSR-aware script gating
- versioned consent cookie payload
- audit trail events persisted to PocketBase

## File structure

```txt
src/features/cookies/
├── cookie-consent.ts                       # Consent types, defaults, parse/serialize, versioning
├── cookie-consent-actions.ts               # Server action for consent audit events
├── cookie-server-utils.ts                  # Server reads of consent + interaction state
├── cookie-context.tsx                      # Client state and actions
├── cookie-consent-banner.tsx               # Bottom banner UI
├── cookie-settings-dialog.tsx              # Category settings dialog
├── cookie-settings-trigger.tsx             # Reusable trigger button
├── cookie-error-boundary.tsx               # UI fail-safe wrapper
└── third-party-scripts.tsx                 # Conditionally renders GA/GTM scripts

src/server/cookie-consent/
└── cookie-consent-service.ts               # PocketBase write service for audit trail
```

## Current integration

- UI is rendered in `src/app/[locale]/layout.tsx`
- Provider wiring is in `src/components/providers/app-providers.tsx`

## Consent cookie format

Cookie name: `cookie_consent`

Serialized payload:

```json
{
  "version": "1",
  "necessary": true,
  "functional": false,
  "analytics": false,
  "marketing": false
}
```

`cookie-server-utils.hasInteracted()` returns `true` only when the cookie is present, parseable, and on the current version. If the cookie version is outdated, the banner is shown again.

## Audit trail (enabled)

Each consent action (`accept_all`, `reject_all`, `save_preferences`) is sent through a server action to PocketBase collection `cookie_consent_events`.

Stored fields:

- `subject_key` (pseudonymous stable key per browser)
- `event_type`
- `preferences`, `analytics`, `marketing`
- `consent_version`
- `consent_snapshot`
- `locale`
- `idempotency_key`

Rate limiting is handled by PocketBase rules/configuration. If PocketBase returns `429`, action error code is `RATE_LIMITED`.

## Script gating

`third-party-scripts.tsx` runs on the server and renders analytics scripts only when
`analytics` consent is granted.

## Trigger usage

Use `CookieSettingsTrigger` directly as a button:

```tsx
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";

export function Example() {
  return <CookieSettingsTrigger>Manage cookies</CookieSettingsTrigger>;
}
```

## Debugging

- Force banner in development by toggling `DEBUG_MODE` in `cookie-context.tsx`
- Delete `cookie_consent` and `cookie_consent_subject` cookies to reset local state

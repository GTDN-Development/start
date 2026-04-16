# Cookie Consent

Cookie consent module for Next.js App Router with:

- client-bootstrapped consent UI
- wrapper-first analytics gating via `@next/third-parties/google`
- versioned consent cookie payload
- audit trail events persisted to PocketBase

## File structure

```txt
src/config/
└── cookie-consent.ts                       # Consent contract: cookie names, defaults, parse/serialize, versioning

src/features/cookies/
├── cookie-consent-actions.ts               # Server action for consent audit events
├── cookie-server-utils.ts                  # Server reads of consent + interaction state
├── cookie-context.tsx                      # Client state and actions
├── analytics-scripts.tsx                   # Consent-gated GA/GTM wrappers
├── cookie-consent-banner.tsx               # Bottom banner UI
├── cookie-settings-dialog.tsx              # Category settings dialog
├── cookie-settings-trigger.tsx             # Reusable trigger button
├── cookie-error-boundary.tsx               # UI fail-safe wrapper

src/server/cookie-consent/
└── cookie-consent-service.ts               # PocketBase write service for audit trail
```

## Current integration

- UI is rendered in `src/app/[locale]/layout.tsx`
- Provider wiring is in `src/features/application/app-providers.tsx`

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

`analytics-scripts.tsx` is a client component that mounts Next's Google wrappers only after the
cookie store is ready and `analytics` consent is granted.

Current baseline is intentionally wrapper-first and hydration-timed:

- analytics use `@next/third-parties/google`
- root layout does not bootstrap consent from server cookies
- earliest possible first hit is not optimized in this baseline by design
- moving to `next/script` or a custom bootstrap would be a separate architectural decision

Analytics precedence is explicit:

- if `NEXT_PUBLIC_GTM_ID` is set, only `GoogleTagManager` mounts
- if `NEXT_PUBLIC_GTM_ID` is not set and `NEXT_PUBLIC_GA_ID` is set, `GoogleAnalytics` mounts
- if both are set, GTM wins and `NEXT_PUBLIC_GA_ID` is ignored
- if cookie consent is disabled, analytics do not mount even if IDs are configured

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

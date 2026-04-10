# 06. Backend Smoke And Tooling Hardening

Source history: `d83f99b`, startup-smoke portion of `91cce2c`, Turnstile portion of `4b512c1`

Depends on: best done after Tasks 02 to 04 so the smoke test validates the final backend shape

Skip impact: fewer local safety nets, more noisy generated diffs, and weaker regression coverage around Turnstile and email transport config.

## Goal

Restore the small but high-value tooling and regression hardening that was lost during the revert, without replaying generated churn blindly.

## Value

- catches broken PocketBase boot, hooks, and migrations locally
- reduces accidental generated-file noise in git history
- restores low-level confidence around Turnstile and email transport configuration

## Current Gap

Current `main` is still missing several useful recovery pieces:

- the PocketBase startup smoke test from `91cce2c`
- the generated-message-type ignore and related repo hygiene from `d83f99b`
- the extracted email env/config parsing from `d83f99b`
- the fuller Turnstile env access and test coverage from `d83f99b` and `4b512c1`

## Scope

- add a PocketBase startup smoke test under `apps/pocketbase/scripts` that boots from committed migrations and hooks
- keep or improve the `apps/pocketbase` test script so it can run this smoke test locally
- stop tracking generated message types again, especially `apps/web/messages/en.d.json.ts`
- extract shared email transport env parsing if it still makes the current transport layer clearer
- restore Turnstile regression coverage and keep static `NEXT_PUBLIC_*` lookups safe for both client and server builds

## Explicit Non-goal

Do not replay the giant snapshot churn in `apps/pocketbase/pb_migrations/1774467906_collections_snapshot.js` unless it is intentionally regenerated after the backend tasks are complete.

## Acceptance Criteria

- `apps/pocketbase` has a smoke test that proves committed migrations and hooks boot successfully
- generated i18n type files no longer create avoidable repo noise
- Turnstile config access is testable and safe for client-bundle inlining
- email transport configuration is easier to validate and maintain

## Validation

- run `pnpm --filter @start/pocketbase test`
- keep `apps/web/src/server/email/email-transport.test.ts` green
- restore or extend Turnstile tests:
- `apps/web/src/components/ui/turnstile.test.tsx`
- `apps/web/src/server/captcha/turnstile.test.ts`

## Notes

This task is intentionally last because it should validate the backend shape that wins after the authz and invite tasks are complete. It is still optional, but it gives the best leverage for preventing the same class of regressions from returning.


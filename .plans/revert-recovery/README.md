# Revert Recovery Tasks

Date: April 10, 2026

## Why This Folder Exists

These tasks collect implementation work that was lost in two ways:

- visible commits that were removed by `b418bb3` (`Revert repository state to fa295dc baseline`)
- intermediate commits that disappeared from normal history after resets, but are still visible in reflog

## Destructive History Notes

The normal git graph still shows these reverted commits:

- `aa4690f` - Simplify auth session runtime and cookie handling
- `a0724e4` - Simplify workspace auth and move coarse access rules to PocketBase
- `d83f99b` - Fix repo tooling and stop tracking generated message types
- `da7c9c8` - Lock down user device session access rules
- `453ec7b` - Sync PocketBase workspace auth rules and invite inspect hook

Reflog also shows commits that were on `main` and were later lost by resets/reverts:

- `11879aa` - Move invite recipient flow behind PocketBase custom routes
- `4b512c1` - Fix active workspace slug handling and Turnstile env access
- `91cce2c` - Fix PocketBase rules and add startup smoke test
- `44b0c4d` - Restore app-owned invite acceptance flow

There were also cherry-picked copies on `fanda/da7c9c8-plus-4b512c1` that were later reset away:

- `bf10ed5` - cherry-pick of the `4b512c1` work
- `b1d0c65` - cherry-pick of the `91cce2c` work

## How To Use These Tasks

- The numbering is recommended order, not a strict requirement.
- Each task is written to be understandable and implementable on its own.
- You can skip tasks individually. Each file says what value you lose if you skip it.
- The tasks are grouped by product/architecture outcome, not strictly one file per commit.

## Recommended Order

1. [01-auth-session-runtime-and-cookie-flow.md](/Users/fanda/Dev/start/.plans/revert-recovery/01-auth-session-runtime-and-cookie-flow.md)
2. [02-workspace-backend-authz-foundation.md](/Users/fanda/Dev/start/.plans/revert-recovery/02-workspace-backend-authz-foundation.md)
3. [03-device-session-ownership-rules.md](/Users/fanda/Dev/start/.plans/revert-recovery/03-device-session-ownership-rules.md)
4. [04-invite-recipient-and-acceptance-flow.md](/Users/fanda/Dev/start/.plans/revert-recovery/04-invite-recipient-and-acceptance-flow.md)
5. [05-workspace-active-slug-and-action-regressions.md](/Users/fanda/Dev/start/.plans/revert-recovery/05-workspace-active-slug-and-action-regressions.md)
6. [06-backend-smoke-and-tooling-hardening.md](/Users/fanda/Dev/start/.plans/revert-recovery/06-backend-smoke-and-tooling-hardening.md)

## Today’s Context

These tasks should be implemented against current `main`, not by replaying old diffs blindly.

Important current context:

- local dev and E2E are now local-first via `compose.yaml` and `scripts/run-web-local.mjs`
- current main already restored some workspace E2E and account deletion coverage
- PocketBase currently has only the older two committed migrations, so backend authz migrations from the lost work are still missing
- deployed migrations must never be edited in place; all schema/rule recovery must be additive


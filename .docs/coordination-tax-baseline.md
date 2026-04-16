# Coordination-Tax Baseline

This document is the Phase 0 contract for the coordination-tax reduction program in `apps/web`.

It defines:

- the hotspot buckets that later phases must measure against
- the hotspot surfaces that currently absorb the most orchestration cost
- the mixed-ownership screens that must be corrected in later phases
- the representative change scenarios used to judge whether touch count is going down

Phase 0 is intentionally a docs-and-tooling slice. A positive net LOC diff is acceptable here because
the added baseline doc and read-only measurement script become the stable contract for later negative-LOC
refactor phases.

## Hard Rules

- one owner per screen remains the default rule
- render-time server code stays read-only
- cookie writes and side-effectful redirects stay in response-writing boundaries
- this baseline does not authorize feature rewrites on its own
- later phases must compare against this document instead of inventing new buckets or scenario names

## Hotspot Domains

Phase 0 tracks four canonical buckets:

- `workspaces`
- `auth`
- `account`
- `application`

`auth` is a hotspot domain, but not a hotspot screen. Its coordination tax is concentrated in
action, cookie, response, and session boundaries rather than in a single UI surface.

## Hotspot Surfaces and Ownership

| Surface                      | Current ownership shape                                                                                                                                                                                                                                                                                                                                                      | Mixed ownership | Target ownership model                                     | Notes                                                                                                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workspace general settings` | Server snapshot from [`page.tsx`](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/page.tsx>) plus client patching through [`workspace-navigation-context.tsx`](/Users/fanda/Dev/start/apps/web/src/features/workspaces/workspace-navigation-context.tsx)                                                      | Yes             | Client-owned after initial load                            | [`workspace-general-actions.ts`](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/general/workspace-general-actions.ts) currently revalidates workspace routes while name, slug, and avatar surfaces also patch local client state. |
| `workspace members settings` | Server snapshot from [`page.tsx`](</Users/fanda/Dev/start/apps/web/src/app/[locale]/(application)/(application-shell)/w/[workspaceSlug]/settings/members/page.tsx>) plus client-owned member and invite lists in [`workspace-members-settings-section.tsx`](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-settings-section.tsx) | Yes             | Client-owned after initial load                            | [`workspace-members-actions.ts`](/Users/fanda/Dev/start/apps/web/src/features/workspaces/settings/members/workspace-members-actions.ts) still revalidates the same route that the client already patches with `setMembers()` and `setInvites()`.    |
| `account profile`            | Client-owned after load via [`account-profile-context.tsx`](/Users/fanda/Dev/start/apps/web/src/features/account/account-profile-context.tsx)                                                                                                                                                                                                                                | No              | Keep client-owned after load                               | Control case: profile updates patch local state and avoid route invalidation.                                                                                                                                                                       |
| `account security devices`   | Client-owned after load in [`your-devices-settings-item.tsx`](/Users/fanda/Dev/start/apps/web/src/features/account/security/your-devices-settings-item.tsx)                                                                                                                                                                                                                  | No              | Keep client-owned after load                               | Control case: device-session removal patches the local list directly without broad revalidation.                                                                                                                                                    |
| `scope switcher`             | Navigation boundary over shared workspace snapshot in [`scope-switcher.tsx`](/Users/fanda/Dev/start/apps/web/src/features/application/scope-switcher.tsx)                                                                                                                                                                                                                    | No              | Keep as navigation boundary over shared workspace snapshot | Follow-up work may simplify its dependencies, but the surface should not become a second workspace screen state owner.                                                                                                                              |
| `auth core`                  | Server and response boundary across [`auth-actions.ts`](/Users/fanda/Dev/start/apps/web/src/features/auth/auth-actions.ts), [`auth-response.ts`](/Users/fanda/Dev/start/apps/web/src/server/auth/auth-response.ts), and device-session services                                                                                                                              | Not a screen    | Keep server/response-owned boundary                        | This is a hotspot domain for Phase 1 and Phase 2, not a screen-ownership target.                                                                                                                                                                    |

## Mixed-Ownership Screens

Only two current surfaces are classified as mixed ownership in this baseline:

1. `workspace general settings`
2. `workspace members settings`

They are mixed because both surfaces:

- start with a route-loaded server snapshot
- mirror part of that snapshot into client state
- mutate through server actions
- patch the client-owned copy after success
- also call `revalidatePath()` for the same interactive surface

The baseline intentionally does **not** classify account profile, device sessions, or the scope switcher
as mixed ownership. Those are control cases or navigation boundaries that should not be pulled into a
workspace-style rewrite without fresh evidence.

## Measurement Rules

- Command: `pnpm coordination-tax:baseline`
- Source scope for domain metrics: `apps/web/src/**/*.{ts,tsx}`
- Domain buckets:
  - `workspaces = features/workspaces/** + server/workspaces/**`
  - `auth = features/auth/** + server/auth/** + server/device-sessions/**`
  - `account = features/account/** + server/account/**`
  - `application = features/application/**`
- Exclusions:
  - tests (`*.test.*`, `*.spec.*`, `__tests__`)
  - generated files outside those bucket paths
  - `messages/**`
  - shared UI primitives under `src/components/**`
- `file count` means the number of runtime source files currently inside the bucket definition.
- `LOC` means raw line count over the included runtime files.
- `touch count` means the number of unique runtime/source files in the checked-in representative scenario registry in [`measure-coordination-tax.mjs`](/Users/fanda/Dev/start/scripts/measure-coordination-tax.mjs). It is a stable comparison baseline, not an automatically inferred git diff metric.

## Representative Change Scenarios

These five scenario names are canonical for the program:

- `workspace-general-update`
- `workspace-membership-change`
- `account-profile-update`
- `device-session-sign-out`
- `workspace-scope-switch`

Each scenario records:

- a stable current path
- a stable current touch count
- the reason that scenario is worth tracking across later phases

Later phases may add phase-specific scenarios, but they must keep these five names and continue comparing
against the checked-in baseline.

## Success Rule for Later Phases

Later phases succeed when they can show, against this baseline:

- lower coordination tax on the targeted slice
- fewer layer hops in the representative change path
- fewer files touched for the same representative scenario
- a smaller or cleaner final diff
- no feature regressions

The target is not abstract neatness. The target is fewer places to change and fewer decisions to make for
the next real product task.

## Checked-In Snapshot

The following snapshot is the checked-in Phase 0 baseline generated from the repository state at the
start of the program.

Later phases compare against this snapshot, but they do not overwrite it. Final current-state
comparison lives in phase completion notes and repeated runs of `pnpm coordination-tax:baseline`.

Generated by `pnpm coordination-tax:baseline`.

Source scope: `apps/web/src/**/*.{ts,tsx}`.

Domain metrics exclude tests by rule and stay limited to the four Phase 0 buckets.

## Domain Metrics

| Domain        | Included paths                                                                                           | File count |  LOC |
| ------------- | -------------------------------------------------------------------------------------------------------- | ---------: | ---: |
| `workspaces`  | `apps/web/src/features/workspaces/**`, `apps/web/src/server/workspaces/**`                               |         40 | 6559 |
| `auth`        | `apps/web/src/features/auth/**`, `apps/web/src/server/auth/**`, `apps/web/src/server/device-sessions/**` |         37 | 4545 |
| `account`     | `apps/web/src/features/account/**`, `apps/web/src/server/account/**`                                     |         24 | 3102 |
| `application` | `apps/web/src/features/application/**`                                                                   |         24 | 2047 |

## Representative Changes

| Scenario                      | Touch count | Current path                                                                                                                                                                                              | Why tracked                                                                                                                                      |
| ----------------------------- | ----------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `workspace-general-update`    |           7 | settings/page.tsx -> workspace-name/url/avatar-settings-item.tsx -> workspace-navigation-context.tsx -> workspace-general-actions.ts -> workspace-general-service.ts                                      | Tracks the current split between route snapshot loading, local workspace patching, and the shared workspace mutation boundary.                   |
| `workspace-membership-change` |           7 | settings/members/page.tsx -> workspace-members-settings-section.tsx -> invite/management-settings-item.tsx -> workspace-members-actions.ts -> workspace-members-service.ts -> workspace-invite-service.ts | Captures the mixed members and invites surface where local list patching and route invalidation currently overlap.                               |
| `account-profile-update`      |           7 | account/page.tsx -> account-profile-context.tsx -> avatar/display-name-settings-item.tsx -> account-profile-actions.ts -> account-profile-service.ts                                                      | Provides a control case where profile edits already stay client-owned after load without route revalidation.                                     |
| `device-session-sign-out`     |           5 | account/security/page.tsx -> account-security-devices-section.tsx -> your-devices-settings-item.tsx -> device-session-actions.ts -> device-sessions-service.ts                                            | Provides a second control case for a client-owned interactive list that does not pair local patching with route invalidation.                    |
| `workspace-scope-switch`      |           5 | scope-switcher.tsx -> workspace-selection.ts -> workspace-general-actions.ts -> workspace-resolution-service.ts -> workspace-cookie.ts                                                                    | Tracks the navigation boundary where workspace selection crosses client navigation state, action finalization, and active-workspace persistence. |

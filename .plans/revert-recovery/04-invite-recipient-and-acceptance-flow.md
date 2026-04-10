# 04. Invite Recipient And Acceptance Flow

Source history: `453ec7b`, `11879aa`, `44b0c4d`

Depends on: Task 02

Skip impact: invite flow keeps working only in its current partial form, but backend guarantees and regression coverage remain weaker than intended.

## Goal

Choose one clear invite-recipient architecture and harden it end to end, including backend rules, guest inspection, authenticated acceptance, and test coverage.

## Value

- fewer invite-specific regressions
- clearer split between PocketBase responsibility and app responsibility
- easier maintenance because the flow has one intentional model instead of remnants of two competing approaches

## Current Gap

History shows two different approaches that were both later lost or only partially kept:

- `11879aa` moved invite inspect and accept behind PocketBase custom routes
- `44b0c4d` pulled acceptance back into the app, kept only inspect behind a hook, and added invite-recipient collection rules
- `453ec7b` later widened workspace and invite rules again so recipients could inspect valid invites and clean up records safely

Current `main` still has app-owned acceptance routes, but it is missing key recovery pieces:

- the invite-recipient rules migration
- the dedicated `workspace-invite-recipient-service` unit test file
- the later authz sync migration and hook work from `453ec7b`

## Decision To Make

Pick one final direction and implement only that direction:

- Option A: PocketBase custom routes own inspect and accept
- Option B: app route owns accept, PocketBase only exposes the minimum inspect and collection-rule support

Do not try to keep both models alive.

## Scope

- restore the missing invite-recipient rules from the lost history
- if needed, restore or replace `apps/pocketbase/pb_hooks/workspace-invites.pb.js`
- update `apps/web/src/server/workspaces/workspace-invite-recipient-service.ts` to match the chosen architecture
- keep `apps/web/src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx` and `accept/route.ts` aligned with the chosen backend contract
- restore the missing unit test file for `workspace-invite-recipient-service`

## Non-goals

- redesign of invite UI copy
- unrelated workspace member management changes

## Acceptance Criteria

- guest invite inspection is intentional and documented
- authenticated invite acceptance has a single source of truth
- already-member, pending, email-mismatch, and invalid-or-expired states all behave predictably
- invite cleanup after accept or already-member is handled consistently

## Validation

- restore or rewrite unit coverage for `workspace-invite-recipient-service`
- keep `apps/web/src/app/[locale]/(auth)/(flow)/invite/[token]/accept/route.test.ts` green
- keep current invite E2E green, especially:
- `invite-acceptance-lands-in-correct-workspace.spec.ts`
- `invite-existing-member-lands-in-overview.spec.ts`
- `invite-unverified-user-verifies-then-returns-to-invite.spec.ts`
- `invalid-invite-shows-blocked-state.spec.ts`

## Notes

This task is intentionally written as a decision task, not as a blind restore of one old commit. The history shows the implementation direction changed mid-stream, so the right outcome now is one clean model with good tests.


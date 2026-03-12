# Multi-workspace Backend Implementation Plan (Lean v2)

Datum: 12. 3. 2026  
Navazuje na: `phase-1-account-server-actions.md`, `phase-2-auth-server-actions.md`, `.rules/pocketbase-integration.md`

## 1. Cíl

1. Nahradit statický workspace režim reálným backendem nad PocketBase.
2. Držet jednoduchou architekturu: čtení v Server Components, mutace přes Server Actions.
3. Nezavádět žádnou workspace REST proxy vrstvu (`/api/workspaces/*`, `/api/workspace-invites/*`).
4. Udržet auth flow oddělený od workspace domény.

## 2. Architektonické hranice (bez overengineeringu)

1. Žádné nové "orchestration" vrstvy navíc, žádné CQRS/event bus.
2. Žádné duplicitní authz vrstvy nad PocketBase rules, jen nezbytné doménové guardy:
3. `personal` restrikce
4. `last-owner` guard
5. `invite` token validace a email match
6. Žádné superuser credentials pro workspace read/write.
7. Žádný sdílený globální PocketBase user klient.

## 3. Zarovnání na Phase 1/2

1. Tento plán předpokládá dokončené server actions migrace z Phase 1 a 2.
2. Account mutace po dokončení Phase 1 běží přes server actions, ne přes `/api/account/*`.
3. Auth mutace po dokončení Phase 2 běží přes server actions, ne přes `/api/auth/*` POST.
4. Z auth route zůstává jen session read endpoint (`GET /api/auth/session`) a `GET /api/pocketbase/email-link`.
5. Multi-workspace nebude přidávat workspace logiku do auth service/actions.

## 4. PocketBase integrační kontrakt (must-have)

1. Jediný server vstup pro PB je `createPocketBaseServerClient`.
2. Každý server request (Server Component, Server Action, Route Handler) vytváří novou PB instanci.
3. `cookies()` je vždy `await`.
4. `pb.authStore.loadFromCookie(...)` načítá `pb_auth`; při nevalidní cookie se volá `pb.authStore.clear()`.
5. PB requesty běží s `cache: "no-store"` přes centralizovaný fetch override.
6. Žádný export globální PB user instance.
7. Žádný superuser klient pro workspace doménu.

## 5. Scope v1

In scope:
1. Personal workspace bootstrap (`ensurePersonalWorkspace`) na `/overview`.
2. Dynamic workspace routing `/w/[workspaceSlug]/*`.
3. Workspace switch (`active_workspace` cookie).
4. Workspace general settings: name, slug, avatar (pokud už je UI připravené).
5. Members: role change, remove member, transfer ownership.
6. Invites: create, revoke, resend, accept.
7. Invite cold flow přes `/invite/[token]` + `pending_invite` cookie.

Out of scope:
1. Workspace billing/plan management.
2. Komplexní audit pipeline (stačí základní structured log).
3. Feature-flag framework pro rollout.
4. Nové API endpointy pro workspace doménu.

## 6. Cílové soubory (minimal set)

1. `src/server/workspaces/workspace-types.ts`
2. `src/server/workspaces/workspace-cookie.ts`
3. `src/server/workspaces/workspace-service.ts`  
   Obsahuje read + write use-cases a malé guard helpery.
4. `src/features/workspaces/actions/workspace-actions.ts`  
   Jeden action soubor pro v1 (bez zbytečného štěpení na 3 soubory).
5. `src/app/[locale]/(application)/overview/page.tsx`
6. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
7. `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
8. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
9. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`

## 7. PocketBase model a rules

Kolekce:
1. `workspaces`
2. `workspace_members`
3. `workspace_invites`

Pole:
1. `workspaces`: `name`, `slug`, `kind`, `avatar`
2. `workspace_members`: `workspace`, `user`, `role`
3. `workspace_invites`: `workspace`, `email_normalized`, `role`, `token_hash`, `expires_at`, `invited_by`

Typy:
1. Po změně schématu spustit `npm run pocketbase:typegen`.
2. Commitnout `src/types/pocketbase.ts`.

Rules:
1. Použít aktuálně schválené rules z původního plánu.
2. Hodnoty `workspaces.kind` držet pouze `personal | organization`.

## 8. Query a action kontrakt (lean)

### 8.1 Read funkce (`workspace-service.ts`)

1. `ensurePersonalWorkspace(userId, userEmail, displayName)`
2. `listUserWorkspaces(userId)`
3. `resolveWorkspaceForUserBySlug(userId, slug)`
4. `pickWorkspaceForOverview(userId, activeWorkspaceSlugCookie)`
5. `listWorkspaceMembers(workspaceId)`
6. `listWorkspaceInvites(workspaceId)`
7. `consumePendingInviteIfPresent(user)`

### 8.2 Server actions (`workspace-actions.ts`)

1. `createOrganizationWorkspaceAction(input)`
2. `switchWorkspaceAction(workspaceSlug)`
3. `updateWorkspaceGeneralAction(workspaceSlug, input)`
4. `leaveWorkspaceAction(workspaceSlug)`
5. `deleteOrganizationWorkspaceAction(workspaceSlug)`
6. `changeMemberRoleAction(workspaceSlug, memberId, role)`
7. `removeMemberAction(workspaceSlug, memberId)`
8. `transferOwnershipAction(workspaceSlug, targetMemberId)`
9. `createInviteAction(workspaceSlug, input)`
10. `resendInviteAction(workspaceSlug, inviteId)`
11. `revokeInviteAction(workspaceSlug, inviteId)`

Každá action:
1. `zod` validace vstupu.
2. Volání service funkce pod aktuální session.
3. Mapování chyb na malý union `ok + errorCode`.
4. `revalidatePath(...)` jen na dotčené stránce.
5. Bez fetch na interní API endpointy.

### 8.3 Chybový model (malý)

1. `BAD_REQUEST`
2. `UNAUTHORIZED`
3. `FORBIDDEN`
4. `NOT_FOUND`
5. `RATE_LIMITED`
6. `PERSONAL_WORKSPACE_RESTRICTED`
7. `LAST_OWNER_GUARD`
8. `INVITE_INVALID_OR_EXPIRED`
9. `INVITE_EMAIL_MISMATCH`
10. `UNKNOWN_ERROR`

## 9. Routing a bootstrap

1. `/overview` bude jediný bootstrap bod:
2. ověří session
3. zavolá `ensurePersonalWorkspace`
4. zpracuje `pending_invite` pokud existuje
5. vybere aktivní workspace a redirectne na `/w/[workspaceSlug]/overview`

Invite flow `/invite/[token]`:
1. guest: uložit `pending_invite` cookie + redirect `/sign-in`
2. authenticated: rovnou accept + redirect do workspace
3. invalid/expired: error stav stránky

## 10. Implementační etapy

## Etapa A: Foundation a data

1. Vytvořit PB kolekce/indexy/rules.
2. Spustit typegen.
3. Založit `workspace-types.ts`, `workspace-cookie.ts`, `workspace-service.ts`.
4. Implementovat read funkce + `ensurePersonalWorkspace`.

## Etapa B: Server actions

1. Přidat `workspace-actions.ts` s mutacemi.
2. Přidat doménové guardy (`personal`, `last-owner`) v service.
3. Pro ownership transfer použít PB batch (`all-or-nothing`), bez ručního rollbacku.

## Etapa C: Routing a flow

1. Přidat dynamické routes `/w/[workspaceSlug]/*`.
2. Přepsat `/overview` na bootstrap orchestraci.
3. Přepsat `/invite/[token]` na reálný server flow.
4. Odstranit statické `/w/workspace/*` route soubory a odkazy.

## Etapa D: UI wiring + cleanup

1. Napojit workspace switcher na backend data.
2. Napojit settings formuláře na server actions.
3. Přesunout user-facing texty do `messages/en.json` a `messages/cs.json`.
4. Odstranit preview/mock workspace konstanty.

## 11. Test strategie (minimal, ale bezpečná)

1. Unit testy: slug policy, `last-owner`, `personal` guard.
2. Integration testy: create/switch/update/leave/delete workspace.
3. Integration testy: invite create/revoke/resend/accept + mismatch + expired.
4. Integration test: `/overview` bootstrap (personal create + pending invite consume).
5. Regression smoke: sign-in/sign-up/sign-out/session beze změny chování.

## 12. Definition of Done

1. `/overview` vždy redirectuje do konkrétního workspace slugu.
2. Uživatel má vždy právě jeden personal workspace (idempotentně vytvořený).
3. Workspace CRUD + members + invites fungují přes server actions.
4. Neexistují workspace REST endpointy v `src/app/api/workspaces/*`.
5. Route a UI už nepoužívají hardcoded `/w/workspace/*`.
6. Invite cold flow funguje pro guest i authenticated scénář.
7. `createPocketBaseServerClient` zůstává jediný server vstup pro PB user flow.
8. Workspace doména nepoužívá superuser credentials.
9. Lint, typecheck, build zelené.

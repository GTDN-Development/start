# Multi-workspace Backend Implementation Plan (Lean v3)

Datum: 12. 3. 2026  
Navazuje na: `phase-1-account-server-actions.md`, `phase-2-auth-server-actions.md`, `.rules/pocketbase-integration.md`

## 1. Cíl

1. Nahradit statický workspace režim plnou backend implementací nad PocketBase.
2. Držet jednoduchou architekturu: čtení v Server Components, mutace přes Server Actions.
3. Nezavádět workspace REST proxy vrstvu (`/api/workspaces/*`, `/api/workspace-invites/*`).
4. Zachovat čisté oddělení auth domény a workspace domény.
5. Minimalizovat redirect chaining a vizuální „flash“ při post-auth navigaci.

## 2. Architektonické hranice

1. Nepřidávat orchestration vrstvy navíc (bez CQRS/event bus).
2. Nepřidávat duplicitní authz vrstvu nad PocketBase rules; použít jen doménové guardy:
3. `personal` restrikce
4. `last-owner` guard
5. invite token validace + email match
6. Nepoužívat superuser credentials pro workspace doménu.
7. Nepoužívat globální sdílený PocketBase user klient.

## 3. PocketBase integrační kontrakt

1. Jediný server vstup pro PB bude `createPocketBaseServerClient`.
2. Každý server request (Server Component, Server Action, Route Handler) vytvoří novou PB instanci.
3. `cookies()` se bude vždy volat jako `await cookies()`.
4. `pb.authStore.loadFromCookie(...)` načte `pb_auth`; při nevalidní cookie se provede `pb.authStore.clear()`.
5. PB requesty poběží přes centralizovaný fetch override s `cache: "no-store"`.
6. Workspace doména nebude používat superuser klient.

## 4. Scope v1

In scope:
1. Personal workspace bootstrap (`ensurePersonalWorkspace`).
2. Dynamic workspace routing `/w/[workspaceSlug]/*`.
3. Workspace switch (`active_workspace` cookie).
4. Workspace creation from switcher (`organization` workspace přes drawer flow).
5. Workspace general settings: name, slug, avatar.
6. Members: role change, remove member, transfer ownership.
7. Invites: create, revoke, resend, accept.
8. Invite cold flow přes `/invite/[token]` + `pending_invite` cookie.
9. Lokalizované pathname aliasy pro workspace routy.
10. Workspace-aware navigace v sidebaru a account menu.
11. Workspace switch zachovávající aktuální workspace podstránku (slug swap).

Out of scope:
1. Workspace billing/plan management.
2. Komplexní audit pipeline (stačí základní structured log).
3. Feature-flag framework pro rollout.
4. Nové API endpointy pro workspace doménu.
5. Automatizované testy (odloženo do navazující fáze).

## 5. Cílové soubory (minimal set)

1. `src/server/workspaces/workspace-types.ts`
2. `src/server/workspaces/workspace-cookie.ts`
3. `src/server/workspaces/workspace-service.ts`
4. `src/features/workspaces/actions/workspace-actions.ts`
5. `src/app/[locale]/(application)/overview/page.tsx`
6. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
7. `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
8. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
9. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
10. `src/features/application/application-menu-tree.tsx`
11. `src/features/application/application-page-header.tsx`
12. `src/features/application/workspace-routing.ts`
13. `src/features/account/user-account-menu.tsx`
14. `src/i18n/routing.ts`
15. `src/features/workspaces/workspace-switcher.tsx`
16. `src/features/workspaces/workspace-create-drawer.tsx`

## 6. Query a action kontrakt

### 6.1 Read/service funkce (`workspace-service.ts`)

1. `ensurePersonalWorkspace(userId, userEmail, displayName)`
2. `listUserWorkspaces(userId)`
3. `resolveWorkspaceForUserBySlug(userId, slug)`
4. `pickWorkspaceForOverview(userId, activeWorkspaceSlugCookie)`
5. `listWorkspaceMembers(workspaceId)`
6. `listWorkspaceInvites(workspaceId)`
7. `consumePendingInviteIfPresent(user)`
8. `validateInviteToken(inviteToken)`
9. `acceptInviteTokenForUser(inviteToken, user)`

### 6.2 Server actions (`workspace-actions.ts`)

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
12. `setPendingInviteHashAction(input)`
13. `resolvePostAuthWorkspaceAction()`

Každá action:
1. Provede `zod` validaci vstupu.
2. Zavolá service funkci pod aktuální session.
3. Namapuje chyby na union `ok + errorCode`.
4. Zavolá `revalidatePath(...)` jen pro dotčené trasy.
5. Nebude volat interní API endpointy přes fetch.
6. Pokud pracuje s cookies, provede zápis cookies uvnitř Server Action.

### 6.3 Chybový model

1. `BAD_REQUEST`
2. `SLUG_NOT_AVAILABLE`
3. `UNAUTHORIZED`
4. `FORBIDDEN`
5. `NOT_FOUND`
6. `RATE_LIMITED`
7. `PERSONAL_WORKSPACE_RESTRICTED`
8. `LAST_OWNER_GUARD`
9. `INVITE_INVALID_OR_EXPIRED`
10. `INVITE_EMAIL_MISMATCH`
11. `UNKNOWN_ERROR`

## 7. Routing a redirect flow (aktualizovaná specifikace)

1. `/overview` bude bootstrap/fallback route:
2. ověří session
3. zavolá `ensurePersonalWorkspace`
4. zpracuje `pending_invite` (pokud existuje)
5. vybere aktivní workspace podle `active_workspace` cookie, jinak použije první dostupný workspace
6. redirectne na `/w/[workspaceSlug]/overview`

Post-auth flow (UX pravidlo):
1. `sign-in`, `sign-up`, `verify-email`, `confirm-email-change` budou po úspěchu volat `resolvePostAuthWorkspaceAction()`.
2. Po úspěšném resolve provedou přímý redirect na `/w/[workspaceSlug]/overview`.
3. Na `/overview` půjdou jen fallbackově při chybě resolve.
4. Cílem je eliminovat zbytečný mezikrok a viditelné přeskakování URL.

Invite flow `/invite/[token]`:
1. guest: uložit hash do `pending_invite` přes Server Action + redirect `/sign-in`
2. authenticated: rovnou accept + redirect do workspace
3. invalid/expired: zobrazit error stav stránky

## 8. Cookie kontrakt

1. `active_workspace` a `pending_invite` budou `httpOnly`, `sameSite=lax`, `path=/`, `secure` v produkci.
2. Zápis cookies proběhne pouze v Server Actions nebo Route Handlers (ne v Server Components).
3. Cookie normalizace bude zahazovat prázdné a placeholder hodnoty typu `[workspaceSlug]`.
4. `active_workspace` se nastaví při create/switch/update workspace a při post-auth resolve.
5. `active_workspace` se smaže při leave/delete workspace.

## 9. Workspace URL (slug) policy

1. Při create organization workspace se použije lean auto-unique politika (`slug`, `slug-2`, ...).
2. Při update existující workspace URL se použije strict collision politika:
3. obsazený slug vrátí `SLUG_NOT_AVAILABLE`
4. UI zobrazí explicitní chybu, bez tichého přepsání na suffix
5. Race condition bude ošetřena mapováním PB `validation_not_unique` na `SLUG_NOT_AVAILABLE`

## 10. Navigace a lokalizované pathnames

1. Sidebar linky `overview` a `workspace` budou vždy směřovat na aktuálně vybraný workspace slug.
2. Link `account` zůstane mimo workspace scope (`/account`).
3. User account menu použije workspace-aware `overviewHref`.
4. Přepnutí workspace zachová aktuální workspace route (např. `settings/members`) a vymění pouze slug.
5. Pokud aktuální route není workspace route, fallback bude `/w/[workspaceSlug]/overview`.
6. Resolver slugů bude mít fallback tak, aby nikdy negeneroval URL s placeholder parametry.
7. `src/i18n/routing.ts` bude obsahovat aliasy i pro workspace trasy:
8. `/w/[workspaceSlug]/overview` -> `cs: /w/[workspaceSlug]/prehled`
9. `/w/[workspaceSlug]/settings` -> `cs: /w/[workspaceSlug]/nastaveni`
10. `/w/[workspaceSlug]/settings/members` -> `cs: /w/[workspaceSlug]/nastaveni/clenove`

## 11. UI/i18n požadavky

1. Workspace settings a members copy bude čtená ze slovníků (`messages/en.json`, `messages/cs.json`).
2. Všechny nové `labelKey` v menu konfiguraci budou doplněny do obou jazyků.
3. Stavy pro workspace URL a avatar (success/error) budou lokalizované.
4. Klientská optimalizace avatar uploadu bude sdílená utilita, ne account-only implementace.
5. Workspace switcher bude obsahovat aktivní `Create workspace` akci.
6. `Create workspace` otevře drawer z pravé strany s formulářem (`name` required, `slug` optional).
7. Nový workspace bude vždy `organization`; zakladatel bude automaticky owner.
8. Invite/members UI po mutacích synchronizuje lokální stav s čerstvými server props, aby nebyl potřeba hard refresh.

## 12. Implementační etapy

### Etapa A: Foundation a data

1. Připravit PB kolekce/indexy/rules.
2. Spustit typegen.
3. Založit `workspace-types.ts`, `workspace-cookie.ts`, `workspace-service.ts`.
4. Implementovat read funkce + `ensurePersonalWorkspace`.

### Etapa B: Server actions

1. Přidat `workspace-actions.ts` s mutacemi.
2. Zavést guardy (`personal`, `last-owner`) v service.
3. Pro transfer ownership použít PB batch (`all-or-nothing`).
4. Přesunout cookie zápisy výhradně do action/handler vrstvy.

### Etapa C: Routing a flow

1. Přidat dynamické routes `/w/[workspaceSlug]/*`.
2. Implementovat `/overview` jako bootstrap/fallback route.
3. Implementovat post-auth direct workspace redirect přes `resolvePostAuthWorkspaceAction`.
4. Implementovat `/invite/[token]` cold flow s `pending_invite` cookie.

### Etapa D: UI wiring + i18n + cleanup

1. Napojit workspace switcher a sidebar na backend data + selected workspace slug.
2. Napojit settings formuláře na server actions.
3. Přesunout user-facing texty do `messages/en.json` a `messages/cs.json`.
4. Implementovat přeložené workspace pathnames v `src/i18n/routing.ts`.
5. Odstranit preview/mock workspace konstanty a hardcoded `/w/workspace/*` odkazy.
6. Implementovat create-workspace drawer ve switcheru a redirect na nově vytvořený workspace.
7. Implementovat workspace switch slug-swap navigaci se zachováním aktuální workspace podstránky.
8. U members/invites sekce zajistit okamžitou synchronizaci dat po mutacích bez ručního refresh.

## 13. Test strategie (další fáze)

1. Unit testy: slug policy, `last-owner`, `personal` guard.
2. Integration testy: create/switch/update/leave/delete workspace.
3. Integration testy: invite create/revoke/resend/accept + mismatch + expired.
4. Integration test: post-auth resolve flow + `/overview` bootstrap fallback.
5. Regression smoke: sign-in/sign-up/sign-out/session bez změny chování.

## 14. Definition of Done

1. `/overview` funguje jako bootstrap/fallback a redirectuje do konkrétního workspace slugu.
2. Uživatel má vždy právě jeden personal workspace (idempotentní bootstrap).
3. Workspace CRUD + members + invites fungují přes server actions.
4. Workspace doména nepoužívá REST endpointy v `src/app/api/workspaces/*`.
5. Route a UI nepoužívají hardcoded `/w/workspace/*`.
6. Invite cold flow funguje pro guest i authenticated scénář.
7. `createPocketBaseServerClient` zůstává jediný server vstup pro PB user flow.
8. Workspace doména nepoužívá superuser credentials.
9. Workspace URL update vrací explicitní `SLUG_NOT_AVAILABLE` při kolizi.
10. Sidebar a user menu odkazují na správný aktuální workspace slug.
11. Lokalizované workspace pathnames jsou definované v `src/i18n/routing.ts`.
12. Workspace lze vytvořit přímo ze switcheru přes pravý drawer (organization + owner).
13. Přepnutí workspace zachová aktuální workspace podstránku, pokud je to workspace route.
14. Pending invites se po pozvání zobrazí bez hard refresh.
15. Lint, typecheck, build jsou zelené.

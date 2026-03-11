# Multi-workspace Backend Implementation Plan

Datum: 11. 3. 2026
Cíl: přepnout statickou workspace implementaci na produkční backend bez přepisu existující auth flow.

## 1. Principy návrhu (KISS + DX)

1. Workspace vrstva je plugin nad existujícím auth stackem, ne jeho náhrada.
2. Auth formuláře (`sign-in`, `sign-up`) zůstávají bez workspace logiky.
3. Veškerá business pravidla se vynucují na serveru, UI jen reflektuje stav.
4. Route kontrakt se drží canonical URL z architektury (`/overview`, `/w/[workspaceSlug]/...`, `/invite/[token]`).
5. Služby budou malé, explicitní a dobře testovatelné (bez "smart" framework magie).
6. Žádné dead abstraction vrstvy; přímočará service + route handler + UI data binding.

## 2. Co se nemění

1. PocketBase zůstává auth provider (`pb_auth` cookie).
2. Existující endpointy `/api/auth/*` zůstávají, jen se rozšíří o post-auth hook.
3. Existující account backend (`/api/account/*`) zůstává oddělený.
4. Stávající ověřené auth guardy a redirecty se nerozbíjí.

## 3. Cílová modulární struktura

1. `src/server/workspaces/workspace-service.ts`
2. `src/server/workspaces/workspace-members-service.ts`
3. `src/server/workspaces/workspace-invite-service.ts`
4. `src/server/workspaces/workspace-cookie.ts`
5. `src/server/workspaces/workspace-errors.ts`
6. `src/server/workspaces/workspace-types.ts`
7. `src/server/workspaces/post-auth-workspace-hook.ts`
8. `src/features/workspaces/workspace-client.ts`
9. `src/features/workspaces/workspace-contract.ts`
10. `src/features/workspaces/workspace-context.tsx`
11. `src/app/api/workspaces/*`
12. `src/app/api/workspace-invites/*`

Poznámka: vše workspace-related zůstává v `workspaces` doméně, auth soubory jen volají hook.

## 4. Datový model v PocketBase

## 4.1 Kolekce

1. `workspaces`
2. `workspace_members`
3. `workspace_invites`

## 4.2 Pole

1. `workspaces`: `name`, `slug`, `kind`, `avatar`
2. `workspace_members`: `workspace`, `user`, `role`
3. `workspace_invites`: `workspace`, `email_normalized`, `role`, `token_hash`, `expires_at`, `invited_by`

## 4.3 Indexy

1. `workspaces`: unique(`slug`)
2. `workspace_members`: unique(`workspace`,`user`)
3. `workspace_members`: index(`user`)
4. `workspace_members`: index(`workspace`,`role`)
5. `workspace_invites`: unique(`token_hash`)
6. `workspace_invites`: unique(`workspace`,`email_normalized`)
7. `workspace_invites`: index(`workspace`)
8. `workspace_invites`: index(`expires_at`)

## 4.4 Typy

1. Přidat kolekce do PB.
2. Spustit `npm run pocketbase:typegen`.
3. Commitnout aktualizované `src/types/pocketbase.ts`.

## 4.5 PocketBase API rules baseline (bez superuser credentials)

Tato sekce je záměrně copy-paste reference aktuálně schválených rules.

### `workspaces`

`List/Search rule`
```txt
@request.auth.id != "" && @collection.workspace_members:member.workspace ?= id && @collection.workspace_members:member.user ?= @request.auth.id
```

`View rule`
```txt
@request.auth.id != "" && @collection.workspace_members:member.workspace ?= id && @collection.workspace_members:member.user ?= @request.auth.id
```

`Create rule`
```txt
@request.auth.id != ""
```

`Update rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= id && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner"
```

`Delete rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= id && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner" && kind != "personal"
```

### `workspace_members`

`List/Search rule`
```txt
@request.auth.id != "" && @collection.workspace_members:member.workspace ?= workspace && @collection.workspace_members:member.user ?= @request.auth.id
```

`View rule`
```txt
@request.auth.id != "" && @collection.workspace_members:member.workspace ?= workspace && @collection.workspace_members:member.user ?= @request.auth.id
```

`Create rule`
```txt
@request.auth.id != "" && (
  (
    user = @request.auth.id &&
    role = "owner" &&
    workspace.workspace_members_via_workspace.id:length = 0
  ) ||
  (
    role = "member" &&
    @collection.workspace_members:owner.workspace ?= workspace &&
    @collection.workspace_members:owner.user ?= @request.auth.id &&
    @collection.workspace_members:owner.role = "owner"
  ) ||
  (
    user = @request.auth.id &&
    role = "member" &&
    @collection.workspace_invites:inv.workspace ?= workspace &&
    @collection.workspace_invites:inv.email_normalized ?= @request.auth.email:lower &&
    @collection.workspace_invites:inv.role = "member" &&
    @collection.workspace_invites:inv.expires_at > @now
  )
)
```

`Update rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner"
```

`Delete rule`
```txt
@request.auth.id != "" && (user = @request.auth.id || (@collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner"))
```

### `workspace_invites`

`List/Search rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner"
```

`View rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner"
```

`Create rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner" && workspace.kind != "personal"
```

`Update rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner" && workspace.kind != "personal"
```

`Delete rule`
```txt
@request.auth.id != "" && @collection.workspace_members:owner.workspace ?= workspace && @collection.workspace_members:owner.user ?= @request.auth.id && @collection.workspace_members:owner.role = "owner" && workspace.kind != "personal"
```

### Poznámka ke schématu

`workspaces.kind` je sjednoceno na hodnoty `personal | organization` (nikoliv `organisation`).

## 5. Server business služby

## 5.1 `workspace-service`

1. `ensurePersonalWorkspace(userId, userEmail, displayName)`
2. `createOrganizationWorkspace(userId, input)`
3. `listUserWorkspaces(userId)`
4. `resolveWorkspaceForUserBySlug(userId, slug)`
5. `pickWorkspaceForOverview(userId, activeWorkspaceSlugCookie)`
6. `updateWorkspaceGeneral(...)`
7. `deleteOrganizationWorkspace(...)`
8. `leaveWorkspace(...)`

Business guards:
1. `personal` nelze smazat/opustit/zvát.
2. Last owner guard je server-side hard stop.
3. Slug policy: personal deterministický, organization s retry + suffix.

## 5.2 `workspace-members-service`

1. `listMembers(workspaceId)`
2. `changeMemberRole(workspaceId, actorUserId, targetUserId, role)`
3. `removeMember(workspaceId, actorUserId, targetUserId)`
4. `transferOwnership(workspaceId, fromUserId, toUserId)`

## 5.3 `workspace-invite-service`

1. `createInvite(...)`
2. `resendInvite(...)`
3. `revokeInvite(...)`
4. `validateInviteToken(rawToken)`
5. `acceptInviteByToken(rawToken, authenticatedUser)`
6. `consumePendingInviteIfAny(authenticatedUser)`

Bezpečnost:
1. Raw token jen in-memory.
2. Persistuje se pouze SHA-256 `token_hash`.
3. Žádné logování tokenu.
4. Email match je povinný (`normalize(user.email) === email_normalized`).

## 5.4 Cookie helper

1. `active_workspace` ukládá pouze `workspaceSlug`.
2. `active_workspace` je `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`.
3. `pending_invite_hash` je `HttpOnly` cookie s krátkým TTL.
4. Pokud `active_workspace` odkazuje na workspace bez membership, systém cookie přepíše na validní fallback.
5. Fallback pořadí: validní cookie workspace -> personal workspace -> první dostupný workspace.
6. Jednotné set/clear utility v `workspace-cookie.ts`.

## 5.5 Ownership transfer bez transakcí

1. `transferOwnership` se provádí v pořadí `promote target -> demote source`.
2. Nikdy se nedělá `demote source` jako první (prevence stavu bez ownera).
3. Pokud demote selže, vrací se explicitní error `OWNERSHIP_TRANSFER_PARTIAL` a stav je bezpečný (2 owners).
4. Operace je idempotentní a retry-safe.

## 6. API kontrakt

## 6.1 Workspace API

1. `GET /api/workspaces` -> seznam dostupných workspace + active.
2. `POST /api/workspaces` -> vytvoří nový `organization` workspace.
3. `POST /api/workspaces/switch` -> nastaví `active_workspace` cookie.
4. `PATCH /api/workspaces/[workspaceSlug]/general` -> name/slug/avatar.
5. `POST /api/workspaces/[workspaceSlug]/leave` -> opuštění workspace.
6. `DELETE /api/workspaces/[workspaceSlug]` -> hard delete (organization only).

## 6.2 Members API

1. `GET /api/workspaces/[workspaceSlug]/members`
2. `PATCH /api/workspaces/[workspaceSlug]/members/[memberId]/role`
3. `DELETE /api/workspaces/[workspaceSlug]/members/[memberId]`
4. `POST /api/workspaces/[workspaceSlug]/members/transfer-ownership`

## 6.3 Invites API

1. `GET /api/workspaces/[workspaceSlug]/invites`
2. `POST /api/workspaces/[workspaceSlug]/invites`
3. `POST /api/workspaces/[workspaceSlug]/invites/[inviteId]/resend`
4. `DELETE /api/workspaces/[workspaceSlug]/invites/[inviteId]`
5. `POST /api/workspace-invites/accept` (token-driven; authenticated)

## 6.4 Response pattern

1. Workspace doména používá `WorkspaceResponse` ve stejném tvaru jako auth (`ok: true/false`).
2. Základní `WorkspaceErrorCode`: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `RATE_LIMITED`, `UNKNOWN_ERROR`.
3. Doménové `WorkspaceErrorCode`: `WORKSPACE_MEMBERSHIP_REQUIRED`, `WORKSPACE_SLUG_CONFLICT`, `PERSONAL_WORKSPACE_RESTRICTED`, `LAST_OWNER_GUARD`, `ALREADY_MEMBER`, `INVITE_NOT_FOUND`, `INVITE_EXPIRED`, `INVITE_EMAIL_MISMATCH`, `INVITE_ALREADY_CONSUMED`, `OWNERSHIP_TRANSFER_PARTIAL`.
4. Error kódy jsou stabilní kontrakt pro UI i i18n (`messages/en.json`, `messages/cs.json`).

## 6.5 API security baseline (workspace routes)

1. Každý mutační workspace endpoint (`POST`, `PATCH`, `DELETE`) musí mít `hasValidOrigin` check.
2. Nevalidní nebo chybějící `Origin` vrací `BAD_REQUEST` (`400`).
3. Toto pravidlo platí pro `src/app/api/workspaces/*` i `src/app/api/workspace-invites/*`.

## 7. Integrace do existující auth flow (plugin mode)

## 7.1 Post-auth hook

1. V `src/app/api/auth/[...all]/route.ts` po úspěšném `sign-in` a `sign-up` zavolat `consumePendingInviteIfAny`.
2. Pokud pending invite není, nic se neděje.
3. Pokud je invite validní a email sedí, membership se vytvoří idempotentně + invite smaže.
4. Pokud email nesedí, pending cookie se smaže a nastaví se flash kód `INVITE_EMAIL_MISMATCH`.
5. Hook je vůči auth flow fail-open: `sign-in`/`sign-up` nesmí failnout kvůli workspace hook chybě.
6. Hook vrací explicitní stav (`none`, `consumed`, `email_mismatch`, `invalid_or_expired`, `transient_error`).
7. `email_mismatch` a `invalid_or_expired` vždy clearují `pending_invite_hash`.
8. `transient_error` se pouze zaloguje (warning), auth pokračuje a retry proběhne best-effort v `/overview` bootstrapu.
9. Hook má mít vlastní krátký timeout, aby nebrzdil auth endpointy.

## 7.2 Auth formuláře

1. Beze změn na úrovni fields/submit payload.
2. Volitelně zobrazit flash message, pokud přijde mismatch po redirectu na `/overview`.

## 8. Routing a bootstrap

## 8.1 `/overview` (centrální bootstrap)

1. Ověřit session.
2. Zavolat `ensurePersonalWorkspace` idempotentně.
3. Zkusit `active_workspace` slug z cookie.
4. Validovat membership.
5. Redirect na `/w/[workspaceSlug]/overview`.

## 8.2 Workspace routes

1. Přidat dynamické app routes:
2. `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
3. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
4. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
5. Na serveru vždy validovat membership pro daný slug.
6. Smazat staré statické routes `src/app/[locale]/(application)/w/workspace/*`.
7. Aktualizovat menu a navigační helpery na dynamický slug (`applicationMenu`, `workspaceSettingsInnerSidebarItems`, `isMenuItemActive`, `getWorkspaceSegments`, user menu links).
8. Nepřidávat backward-compatible alias pro `/w/workspace/*`; staré cesty budou odstraněny.

## 8.3 Invite route

1. `GET /[locale]/invite/[token]` serverově validuje token.
2. Pokud user není přihlášen: uloží `pending_invite_hash`, redirect `/sign-in`.
3. Pokud přihlášen: pokus o accept + redirect na workspace nebo error state.

## 8.4 Race handling a slug policy

1. `ensurePersonalWorkspace` je idempotentní a safe pro paralelní requesty.
2. Personal slug se generuje deterministicky (`u-{userId}`) bez suffixů.
3. Při `slug` kolizi v `ensurePersonalWorkspace` se provede refetch existujícího personal workspace místo tvorby dalšího.
4. Guard: uživatel může mít maximálně jeden personal workspace.
5. Organization slug policy: slugify z názvu, suffix `-2`, `-3`, ... při kolizi, max 10 pokusů.
6. Reserved slugs: `overview`, `settings`, `account`, `api`, `invite`, `sign-in`, `sign-up`, `sign-out`.

## 9. Frontend migrace ze statiky

## 9.1 Sdílený workspace context

1. Přidat provider podobný `AccountProfileProvider`.
2. Rozhodnutí: server-first data loading.
3. Initial workspace data načíst v server component layoutu a předat do provideru.
4. Client fetch je pouze pro mutace a explicitní refresh; ne pro první render.
5. Context nese `activeWorkspace`, `availableWorkspaces`, members a invites cache.

## 9.2 Workspace settings komponenty

1. Nahradit mock data (`WORKSPACE_SETTINGS_PREVIEW`, hardcoded rows) za data z API.
2. Zachovat stávající UI komponenty, mění se jen data source + submit handlery.
3. Last-owner/personal guard ponechat i v UI, ale jako sekundární ochranu.

## 9.3 Invite token page

1. Zrušit dev state switcher v produkčním runtime.
2. Napojit state mapping na reálné server result codes.
3. CTA akce skutečně napojit (`sign-in`, `go to workspace`, `sign-out`).
4. Route zůstává v `(auth)` group kvůli guest přístupu.
5. Doménová logika invite se přesune do `features/workspaces/invites/*`, auth route bude jen tenký wrapper.

## 9.4 i18n cleanup (nutné pro produkci)

1. Přesunout veškeré user-facing stringy z `src/features/workspaces/*` do `messages/en.json` a `messages/cs.json`.
2. Doplnit chybové texty pro nové workspace API error codes.

## 10. Bezpečnost a provoz

1. Rate-limit resend invite přes `updated` (>= 60s).
2. Audit log minimálně pro create/revoke/accept invite, role change, delete workspace.
3. Tokeny a hash nikdy nelogovat.
4. Ošetřit závodní podmínky idempotentně (unique index + retry).
5. Neautorizovaný přístup vrací `403`/`404` bez leaku existence workspace.

## 11. Testovací strategie

1. Unit testy pro `workspace-service` a `workspace-invite-service`.
2. API integration testy pro všechny mutace (create/switch/leave/delete/invite/role/transfer).
3. Test infra: lokální PocketBase test instance přes `docker-compose`.
4. Test infra: seed fixtures + reset script před každým integration run.
5. CI: job, který spouští PB test instanci, aplikuje schema, naplní fixture data a spustí testy.
6. E2E flow: sign-up -> overview -> personal workspace created.
7. E2E flow: create organization workspace -> switch -> settings.
8. E2E flow: sign-in -> overview redirect podle validní cookie.
9. E2E flow: invite cold flow (guest -> sign-in -> accept).
10. E2E flow: invite email mismatch.
11. E2E flow: last owner guard.
12. E2E flow: personal workspace restrictions.
13. Security test: cross-origin `POST/PATCH/DELETE` na workspace API vrací `400`.
14. Auth resilience test: při `transient_error` z `consumePendingInviteIfAny` zůstane `sign-in`/`sign-up` `ok: true`.

## 12. Implementační etapy

## Etapa A: Data a server foundation

1. PocketBase kolekce + indexy + rules.
2. Typegen.
3. `workspace-types`, `workspace-errors`, `workspace-cookie`.
4. `workspace-service` + `createOrganizationWorkspace` + testy.
5. Připravit PB test infrastrukturu (`docker-compose`, fixtures, reset script).

## Etapa B: Members + invites backend

1. `workspace-members-service` + testy.
2. `workspace-invite-service` + testy.
3. API route handlery pro members/invites.
4. Rate-limit resend + email normalization + hash flow.

## Etapa C: Auth hook + overview bootstrap

1. `post-auth-workspace-hook.ts`.
2. Integrace do `api/auth/sign-in` a `api/auth/sign-up` (bez změny payload kontraktu).
3. Přepis `/overview` na redirect orchestrator.

## Etapa D: UI wiring

1. Dynamic routes `/w/[workspaceSlug]/*`.
2. Smazání starých route souborů `/w/workspace/*`.
3. Napojení switcheru, menu a user menu na active workspace.
4. Refaktor helperů, které mají hardcoded segment `workspace`.
5. Napojení create workspace tlačítka na `POST /api/workspaces`.
6. Invite token page na reálné stavy.
7. Napojení settings komponent na API.

## Etapa E: Hardening

1. i18n cleanup všech workspace stringů.
2. Regression test auth flow.
3. E2E run a edge-case bugfix.
4. Feature flag rollout (volitelné).

## 13. Definition of Done

1. `/overview` vždy redirectuje do konkrétního workspace.
2. `ensurePersonalWorkspace` běží centrálně a idempotentně.
3. Invite flow funguje i pro nepřihlášeného uživatele bez změn auth formulářů.
4. `POST /api/workspaces` umožňuje vytvořit organization workspace.
5. Staré `/w/workspace/*` routes jsou odstraněné a nikde se již neodkazují.
6. Workspace members/invites/general settings běží proti backendu.
7. Personal restrikce + last-owner guard jsou vynucené serverem.
8. Auth regression testy pro `sign-in/sign-up/sign-out/session` jsou zelené.
9. Ve workspace UI nejsou hardcoded user-facing stringy.

## 14. Doporučený rollout bez rizika pro auth

1. Nejprve nasadit backend služby a API za feature flagem, UI nechat statické.
2. Poté zapnout pouze `/overview` bootstrap + dynamic routing.
3. Nakonec postupně zapínat jednotlivé settings mutace (name/slug/avatar -> members -> invites -> delete/leave).
4. Mít rychlý rollback: vypnout workspace feature flag a vrátit statické komponenty bez zásahu do auth endpointů.

## 15. Nice to have (pozdější hardening)

1. Přidat PocketBase hook pro tvrdý invariant "workspace musí mít alespoň jednoho ownera".
2. `Before Update workspace_members`: blokovat změnu `owner -> member`, pokud by po změně zůstal ve workspace `0` ownerů.
3. `Before Delete workspace_members`: blokovat smazání owner membership, pokud jde o posledního ownera.
4. Důvod: bezpečnostní pojistka přímo na úrovni databáze i při chybě v API/service vrstvě.

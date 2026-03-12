# Multi-workspace Backend Implementation Plan (Lean)

Datum: 12. 3. 2026  
Cíl: přepnout statickou workspace implementaci na produkční backend s minimální komplexitou, bez workspace REST proxy vrstvy a bez zásahu do auth flow.

## 1. Principy návrhu (KISS + využití nativních možností PB/Next)

1. Workspace backend je server-first: čtení dat v Server Components, mutace přes Server Actions.
2. Nevytváříme proxy REST API `src/app/api/workspaces/*` ani `src/app/api/workspace-invites/*`.
3. Autorizace je primárně vynucena PocketBase API rules, ne duplicitní middleware vrstvou.
4. Auth endpointy (`/api/auth/*`) řeší jen auth; workspace orchestrace běží mimo ně.
5. Držíme minimum doménových guardů, které nelze spolehlivě vyjádřit jen PB rules (last-owner, personal restrikce, UX error mapping).
6. Žádné over-abstraction: malé query/helper funkce + malé Server Actions.
7. Každý server request (Server Component, Server Action, Route Handler) vytváří novou PB instanci; žádný sdílený singleton user klient.
8. Workspace read/write operace běží pouze pod session aktuálního uživatele (`pb_auth`), nikdy přes superuser credentials.
9. V tomto feature scope nepoužíváme superuser klienta vůbec (ani read, ani write) pro workspace doménu.

## 2. Co se nemění

1. PocketBase zůstává auth provider (`pb_auth` cookie).
2. Existující endpointy `/api/auth/*` zůstávají pro auth use-cases.
3. Existující account backend (`/api/account/*`) zůstává oddělený.
4. Route kontrakt zůstává canonical: `/overview`, `/w/[workspaceSlug]/...`, `/invite/[token]`.

## 3. Cílová modulární struktura

1. `src/server/workspaces/workspace-types.ts`
2. `src/server/workspaces/workspace-cookie.ts`
3. `src/server/workspaces/workspace-domain.ts` (malé guard/helper funkce)
4. `src/server/workspaces/workspace-queries.ts` (server-side read model nad PB)
5. `src/server/workspaces/workspace-invites.ts` (token helpery + accept/consume)
6. `src/features/workspaces/actions/workspace-actions.ts` (`"use server"` mutace)
7. `src/features/workspaces/actions/workspace-member-actions.ts` (`"use server"` mutace členů)
8. `src/features/workspaces/actions/workspace-invite-actions.ts` (`"use server"` mutace pozvánek)
9. `src/features/workspaces/workspace-context.tsx` (lightweight context: active workspace + available workspaces)
10. `src/app/[locale]/(application)/overview/page.tsx` (centrální bootstrap orchestrátor)
11. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx` (server invite entrypoint)

Poznámka: workspace data flow jde přes Server Components/Actions; route handlers pro workspace doménu nepřidáváme.

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

## 4.6 PocketBase integrační kontrakt (must-have)

1. Jediný vstupní bod pro PB klienta na serveru je `createPocketBaseServerClient`.
2. Helper vždy vytvoří novou instanci, načte auth z `await cookies()` a použije `pb.authStore.loadFromCookie(...)`.
3. Pokud je auth cookie nevalidní, helper provede `pb.authStore.clear()` a vrátí informaci pro clear cookie v odpovědi.
4. Helper centrálně vypne fetch cache pro PB requesty (`cache: "no-store"`), aby nevznikala stale data.
5. Zakázáno exportovat sdílenou globální PB instanci pro user request flow.
6. Zakázáno použít superuser token/credentials pro workspace query i mutace.

## 5. Server operace (queries + actions, bez REST proxy)

## 5.1 Query vrstva pro Server Components

1. `ensurePersonalWorkspace(userId, userEmail, displayName)` (idempotentní bootstrap)
2. `listUserWorkspaces(userId)`
3. `resolveWorkspaceForUserBySlug(userId, slug)`
4. `pickWorkspaceForOverview(userId, activeWorkspaceSlugCookie)`
5. `listWorkspaceMembers(workspaceId)`
6. `listWorkspaceInvites(workspaceId)`

## 5.2 Server Actions pro mutace (`"use server"`)

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
1. Ověří vstup přes Zod.
2. Vytvoří nového PB klienta přes `createPocketBaseServerClient` a spustí operaci pod aktuální session.
3. Nechá PB API rules vynutit authz.
4. Pouze pro domain invarianty přidá explicitní guard (`personal`, `last-owner`).
5. Po mutaci zavolá cílený `revalidatePath(...)`.

## 5.3 Error handling model (minimal)

1. Primární zdroj je `ClientResponseError.status` z PB.
2. Doménové custom kódy držíme jen pro případy, kde status sám nestačí:
3. `PERSONAL_WORKSPACE_RESTRICTED`
4. `LAST_OWNER_GUARD`
5. `INVITE_EMAIL_MISMATCH`
6. `INVITE_INVALID_OR_EXPIRED`
7. Odstraňujeme nadbytečný široký enum a kód `OWNERSHIP_TRANSFER_PARTIAL`.

## 5.4 Cookie helper

1. `active_workspace` ukládá pouze `workspaceSlug`.
2. `active_workspace` je `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`.
3. `pending_invite` je krátkodobá `HttpOnly` cookie s tokenem (raw), nikdy se neloguje.
4. Pokud `active_workspace` odkazuje na workspace bez membership, cookie se přepíše na validní fallback.
5. Fallback pořadí: validní cookie workspace -> personal workspace -> první dostupný workspace.
6. Jednotné set/clear utility v `workspace-cookie.ts`.

## 5.5 Ownership transfer přes PocketBase Batch API

1. `transferOwnershipAction` použije jeden `/api/batch` request pro oba updaty:
2. target member `role -> owner`
3. source member `role -> member`
4. Operace běží v jednom write transactionu (all-or-nothing).
5. Pokud batch selže, neprovádí se žádný ruční rollback.
6. Předpoklad: Batch API je povolené v PocketBase settings.

## 6. Čtení a zápis dat bez workspace REST endpointů

## 6.1 Čtení (Server Components)

1. Route/page/layout komponenty čtou data přímo přes query funkce nad PB klientem.
2. Žádný mezikrok přes `fetch("/api/workspaces/...")`.

## 6.2 Zápis (Server Actions)

1. Formuláře a tlačítka volají Server Actions přímo (`form action` / `startTransition` wrapper).
2. Next.js řeší POST transport nativně; držíme jen minimální validaci vstupů.

## 6.3 Revalidace

1. Members page: `revalidatePath("/w/[workspaceSlug]/settings/members")`.
2. General settings: `revalidatePath("/w/[workspaceSlug]/settings")`.
3. Přepnutí workspace: update cookie + redirect na `/w/[workspaceSlug]/overview`.

## 6.4 Bezpečnostní baseline

1. Workspace mutace nejedou přes custom route handlers, takže nevzniká duplicitní `hasValidOrigin` boilerplate.
2. CSRF/origin ochrana se opírá o Next.js Server Actions mechanismus + same-site cookie model.
3. Pokud bude potřeba cross-origin trusted flow, nastaví se explicitně `serverActions.allowedOrigins` v `next.config.ts`.
4. Autorizační pravidla zůstávají v PB API rules.
5. Každý workspace server request vytváří vlastní PB instanci; žádný global user PB client.
6. Workspace doména nepoužívá superuser credentials pro žádný zápis.

## 7. Integrace do auth flow (zjednodušený plugin mode)

## 7.1 Auth endpointy zůstávají čisté

1. V `src/app/api/auth/[...all]/route.ts` nepřidáváme workspace post-auth orchestraci.
2. `sign-in`/`sign-up` mají jedinou odpovědnost: autentizace.

## 7.2 Invite route (`/[locale]/invite/[token]`)

1. Serverově ověří syntaxi/token existence.
2. Pokud user není přihlášen: uloží `pending_invite` cookie a redirectne na `/sign-in`.
3. Pokud user přihlášený je: provede accept přímo a redirectne do cílového workspace.
4. Při invalid/expired tokenu vrátí odpovídající error stav page.

## 7.3 `/overview` jako jediný bootstrap orchestrace bod

1. Ověří session.
2. Zavolá `ensurePersonalWorkspace` idempotentně.
3. Pokud existuje `pending_invite`, pokusí se o consume:
4. success: vytvoří membership (idempotentně), smaže invite + cookie
5. mismatch/invalid: smaže cookie a nastaví flash stav
6. Poté vybere aktivní workspace a redirect na `/w/[workspaceSlug]/overview`.

## 8. Routing a bootstrap

## 8.1 Dynamic workspace routes

1. Přidat dynamické app routes:
2. `src/app/[locale]/(application)/w/[workspaceSlug]/overview/page.tsx`
3. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/page.tsx`
4. `src/app/[locale]/(application)/w/[workspaceSlug]/settings/members/page.tsx`
5. Na serveru vždy validovat membership pro daný slug.
6. Smazat statické routes `src/app/[locale]/(application)/w/workspace/*`.
7. Aktualizovat menu a helpery na dynamický slug.
8. Nepřidávat backward-compatible alias pro `/w/workspace/*`.

## 8.2 Slug policy a race handling

1. `ensurePersonalWorkspace` je idempotentní a safe pro paralelní requesty.
2. Personal slug: deterministický `u-{userId}`.
3. Při kolizi v personal bootstrapu provést refetch existujícího workspace.
4. Guard: uživatel může mít maximálně jeden personal workspace.
5. Organization slug policy: slugify + suffix `-2`, `-3`, ... max 10 pokusů.
6. Reserved slugs: `overview`, `settings`, `account`, `api`, `invite`, `sign-in`, `sign-up`, `sign-out`.

## 9. Frontend migrace ze statiky

## 9.1 Lightweight workspace context

1. Context nese jen:
2. `activeWorkspace`
3. `availableWorkspaces`
4. Kontext nenese globální cache members/invites.

## 9.2 Route-lokální data loading

1. `/settings/members` načítá members/invites přímo v Server Component page.
2. Po mutaci přes Server Action se použije `revalidatePath`.
3. Nepřidávat globální klientský state manager pro server data.

## 9.3 Invite token page

1. Odebrat dev state switcher z produkčního runtime.
2. Napojit view stavy na reálné server výsledky.
3. CTA napojit na reálné akce (`sign-in`, `continue`, `go to workspace`, `sign-out`).
4. Route zůstává v `(auth)` group kvůli guest přístupu.

## 9.4 i18n cleanup

1. Veškeré user-facing stringy přesunout do `messages/en.json` a `messages/cs.json`.
2. Doplnit texty pro nové lean error stavy.

## 10. Bezpečnost a provoz

1. Rate-limit resend invite přes `updated` (>= 60 s).
2. Audit log minimálně pro create/revoke/accept invite, role change, delete workspace.
3. Tokeny a hash nikdy nelogovat.
4. Ošetřit race conditions idempotentně (unique index + retry/refetch).
5. Neautorizovaný přístup vrací `403`/`404` bez leaku existence workspace.

## 11. Testovací strategie

1. Unit testy pro `workspace-domain` helpery (last-owner/personal guard, slug policy).
2. Integration testy pro Server Actions (workspace create/switch/general/members/invites/leave/delete).
3. Integration test pro ownership transfer přes batch (ověření all-or-nothing).
4. Integration testy pro `/overview` bootstrap (pending invite consume + fallback).
5. Test infra: lokální PocketBase instance přes `docker-compose`.
6. Test infra: seed fixtures + reset script před každým integration během.
7. E2E flow: sign-up -> overview -> personal workspace created.
8. E2E flow: create organization workspace -> switch -> settings.
9. E2E flow: sign-in -> overview redirect podle validní cookie.
10. E2E flow: invite cold flow (guest -> sign-in -> consume na `/overview`).
11. E2E flow: invite email mismatch.
12. E2E flow: last owner guard.
13. E2E flow: personal workspace restrictions.
14. Auth regression test: `sign-in/sign-up/sign-out/session` beze změny kontraktu.

## 12. Implementační etapy

## Etapa A: Data a foundation

1. PocketBase kolekce + indexy + rules.
2. Typegen.
3. `createPocketBaseServerClient` kontrakt pro workspace doménu (per-request instance, async cookies, invalid-cookie clear, no-store fetch).
4. `workspace-types`, `workspace-cookie`, `workspace-domain`.
5. `workspace-queries` + `ensurePersonalWorkspace`.
6. Připravit PB test infrastrukturu (`docker-compose`, fixtures, reset script).

## Etapa B: Server Actions backend

1. `workspace-actions` (create/switch/general/leave/delete).
2. `workspace-member-actions` včetně batch transfer ownership.
3. `workspace-invite-actions` + resend rate-limit + email normalization + hash flow.
4. Integration testy pro všechny mutace.

## Etapa C: Invite + overview orchestrace

1. Přepsat `/invite/[token]` na reálné server zpracování.
2. Přepsat `/overview` na centrální bootstrap orchestrátor.
3. Pending invite consume přes cookie v `/overview`.

## Etapa D: UI wiring

1. Dynamic routes `/w/[workspaceSlug]/*`.
2. Smazání starých route souborů `/w/workspace/*`.
3. Napojení switcheru, menu a user menu na active workspace.
4. Napojení settings komponent přímo na Server Actions.
5. Refaktor helperů s hardcoded segmentem `workspace`.

## Etapa E: Hardening

1. i18n cleanup všech workspace stringů.
2. Regression test auth flow.
3. E2E run a edge-case bugfix.
4. Feature-flag rollout (volitelné).

## 13. Definition of Done

1. `/overview` vždy redirectuje do konkrétního workspace.
2. `ensurePersonalWorkspace` běží centrálně a idempotentně.
3. Invite flow funguje i pro nepřihlášeného uživatele bez změn auth formulářů.
4. Workspace mutace běží přes Server Actions (bez `src/app/api/workspaces/*`).
5. Staré `/w/workspace/*` routes jsou odstraněné a nikde se již neodkazují.
6. Workspace members/invites/general settings běží proti backendu.
7. Personal restrikce + last-owner guard jsou vynucené serverem.
8. Ownership transfer je atomický přes PB batch.
9. Auth regression testy pro `sign-in/sign-up/sign-out/session` jsou zelené.
10. Ve workspace UI nejsou hardcoded user-facing stringy.
11. Workspace request flow nepoužívá sdílenou globální PB instanci.
12. Workspace query/mutace nepoužívají superuser credentials.
13. `createPocketBaseServerClient` vynucuje async cookie auth load, invalid auth clear a `no-store` fetch behavior.

## 14. Doporučený rollout bez rizika pro auth

1. Nejprve nasadit PB schéma/rules a query vrstvu za feature flagem.
2. Poté zapnout `/overview` bootstrap + dynamic routing.
3. Nakonec postupně zapínat settings mutace (general -> members -> invites -> delete/leave).
4. Mít rychlý rollback: vypnout workspace feature flag a vrátit statické komponenty bez zásahu do auth endpointů.

## 15. Nice to have (pozdější hardening)

1. Přidat PocketBase hook pro invariant "workspace musí mít alespoň jednoho ownera".
2. `Before Update workspace_members`: blokovat `owner -> member`, pokud by po změně zůstal `0` ownerů.
3. `Before Delete workspace_members`: blokovat smazání owner membership, pokud jde o posledního ownera.
4. Důvod: obrana-in-depth přímo na úrovni databáze i při chybě aplikační vrstvy.

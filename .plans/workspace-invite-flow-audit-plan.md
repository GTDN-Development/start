# Workspace Invite Flow Audit Plan

## Goal

Prověřit end-to-end flow pozvánky do workspace a zapsat:

- jak dnes flow funguje,
- které scénáře jsou pokryté,
- kde jsou rizika nebo nekonzistence,
- jaké změny případně udělat dál.

## Status

- Produkční změny udělané během předchozího průzkumu byly na žádost revertované.
- Aktuální pracovní výstup je jen tento plánovací dokument.
- Repo teď znovu odpovídá původní produkční implementaci invite flow.

## Current Scope

Audit se teď soustředí na tyto části:

1. Vytvoření pozvánky a odeslání e-mailu
2. Landing route `/invite/[token]`
3. Start route `/invite/[token]/start`
4. Přihlášení / registrace po start route
5. Post-auth spotřebování `pending_invite` cookie
6. Hraniční stavy:
   - `accepted`
   - `already_member`
   - `invalid_or_expired`
   - `email_mismatch`

## Flow Map

### 1. Invite creation

Relevant files:

- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/email/templates/workspace-invite.builder.ts`
- `src/server/email/templates/workspace-invite.tsx`

Aktuální chování:

- Admin vytvoří invite přes `createWorkspaceInviteForCurrentUser()`.
- E-mail se normalizuje.
- Pokud už je uživatel členem workspace, invite se nevytvoří.
- Pokud existuje aktivní invite pro stejný e-mail, vrací se `BAD_REQUEST`.
- Vygeneruje se token + hash.
- Do databáze se ukládá jen hash tokenu.
- E-mail template generuje URL na `/invite/[token]`.

### 2. Direct landing `/invite/[token]`

Relevant file:

- `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`

Aktuální chování:

- Nejdřív se validuje token.
- Pokud je token neplatný nebo expirovaný, zobrazí se blocked state.
- Pokud není session, route redirectuje přes `/invite/[token]/start`.
- Pokud session existuje, invite se zkusí rovnou přijmout pro aktuálního uživatele.
- Pro `accepted` a `already_member` následuje redirect do workspace.
- Pro `email_mismatch` se zobrazí explicitní state se CTA na odhlášení a pokračování jiným účtem.

Poznámka:

- Během průzkumu byla dočasně připravená oprava rich translation renderu, ikony a skutečného sign-out CTA.
- Tyto změny byly následně revertované, takže aktuální kód je zpět v původním stavu.

### 3. Start route `/invite/[token]/start`

Relevant file:

- `src/app/[locale]/(auth)/(flow)/invite/[token]/start/route.ts`

Aktuální chování:

- Route validuje token.
- Pokud je validní, uloží do HTTP-only cookie `pending_invite` hash invite tokenu.
- Pak redirectuje na `/sign-in`.

Tohle je správný bridge pro scénář bez aktivní session.

### 4. Sign-in / Sign-up after start route

Relevant files:

- `src/features/auth/sign-in/sign-in-form.tsx`
- `src/features/auth/sign-up/sign-up-form.tsx`
- `src/features/auth/post-auth-redirect.ts`
- `src/features/workspaces/actions/workspace-actions.ts`

Aktuální chování:

- Po úspěšném sign-in i sign-up se volá `replaceToPostAuthDestination(router)`.
- Ta volá server action `resolvePostAuthWorkspaceAction()`.
- Server action zavolá `resolvePostAuthWorkspace(...)`.

### 5. Pending invite consumption after auth

Relevant files:

- `src/server/workspaces/workspace-resolution-service.ts`
- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/workspaces/workspace-cookie.ts`

Aktuální chování:

- `resolvePostAuthWorkspace()` nejdřív zajistí personal workspace.
- Pak zavolá `consumePendingInviteIfPresent()`.
- Pokud invite vede na:
  - `accepted`: redirect cíl se nastaví na pozvaný workspace
  - `already_member`: redirect cíl se nastaví na pozvaný workspace
  - `email_mismatch`: redirect cíl se dnes nemění
  - `invalid_or_expired`: redirect cíl se dnes nemění
- `consumePendingInviteIfPresent()` v success path maže `pending_invite` cookie i pro `email_mismatch`.

## Confirmed Findings

### Open

1. `email_mismatch.secondary` se na `/invite/[token]` renderuje špatně

Status:

- Potvrzeno
- Dočasně opraveno během průzkumu
- Následně revertováno na žádost uživatele

Příčina:

- Překlad používá rich markup (`<strong>...</strong>`), ale stránka volá obyčejné `t(...)` místo `t.rich(...)`.

Dopad:

- Uživatel vidí raw translation key místo textu.

2. Na direct `/invite/[token]` chybí ikona pro `email_mismatch` state

Status:

- Potvrzeno
- Dočasně opraveno během průzkumu
- Následně revertováno na žádost uživatele

Dopad:

- State nepůsobí konzistentně se zbytkem appky a screenshotem očekávaného UI.

3. CTA na `email_mismatch` stránce slibuje sign-out, ale aktuální implementace jen linkuje na `/sign-in`

Status:

- Potvrzeno
- Dočasně opraveno během průzkumu
- Následně revertováno na žádost uživatele

Příčina:

- Guest auth layout přihlášeného uživatele na `/sign-in` nepustí a redirectuje ho na `/overview`.

Dopad:

- Tlačítko neplní to, co text slibuje.
- Uživatel se v daném browser session nedostane k přihlášení jiným účtem.

4. Pending invite mismatch po sign-in/sign-up se zřejmě ztratí bez feedbacku

Status:

- Otevřené riziko, zatím jen analyzované

Popis:

- Pokud uživatel přijde přes `/invite/[token]/start`, cookie se nastaví správně.
- Po sign-in/sign-up se invite spotřebuje v `resolvePostAuthWorkspace()`.
- Když `acceptInviteByHash()` vrátí `email_mismatch`, `consumePendingInviteIfPresent()` stále smaže cookie.
- `resolvePostAuthWorkspace()` tento stav nepřeklápí do žádné UI větve a prostě pokračuje na běžný overview workspace.

Pravděpodobný dopad:

- Uživatel po přihlášení špatným účtem nedostane informaci, proč invite neproběhl.
- Kontext pozvánky se ztratí.
- Není jasná cesta zpět k invite state bez nového otevření odkazu z e-mailu.

Zasažené soubory:

- `src/server/workspaces/workspace-invite-service.ts`
- `src/server/workspaces/workspace-resolution-service.ts`
- `src/features/auth/post-auth-redirect.ts`

## Reverted Experiments

Během průzkumu byly lokálně připravené tyto změny:

1. `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`

- render `email_mismatch.secondary` přes `t.rich(...)`
- oddělení primárního a sekundárního textu
- doplnění ikonového slotu pro state

2. `src/features/workspaces/invite/invite-email-mismatch-action.tsx`

- nové klientské CTA pro skutečný sign-out
- následný redirect přes `/invite/[token]/start`, aby se znovu nastavil pending invite

Tyto změny byly plně revertované a nejsou součástí aktuálního pracovního stromu.

## Additional UX Inconsistencies To Verify

1. Blocked state na `/invite/[token]` používá CTA label z `states.already_member.cta`

Poznámka:

- Funkčně to projde přes redirect chain, ale copy působí nekonzistentně.
- Je potřeba rozhodnout, jestli:
  - přidat dedikovaný blocked CTA string,
  - nebo CTA v blocked state vůbec neukazovat.

2. Chování `invalid_or_expired` po post-auth flow není explicitně surfacované

Poznámka:

- Podobně jako `email_mismatch` se může stát, že se invite během mezikroku stane neplatným a uživatel dostane jen běžný overview bez vysvětlení.

## Confirmed Gap In UI Surface

Po code searchi aktuálně platí:

- `email_mismatch` UI surface existuje pouze na direct route `src/app/[locale]/(auth)/(flow)/invite/[token]/page.tsx`
- `invalid_or_expired` UI surface po post-auth flow také nemá samostatný screen
- `replaceToPostAuthDestination()` umí jen dvě větve:
  - workspace overview redirect
  - fallback `/overview`

Z toho plyne:

- start-route flow a direct-route flow dnes nejsou ekvivalentní
- direct `/invite/[token]` umí mismatch vysvětlit
- `/invite/[token]/start -> sign-in/sign-up -> post-auth` mismatch dnes vysvětlit neumí

## Candidate Fix Variants

### Variant 1: Keep current hash cookie and add a separate post-auth result screen

Popis:

- `consumePendingInviteIfPresent()` by vracel detailnější outcome
- `resolvePostAuthWorkspaceAction()` by uměl vrátit union s invite výsledkem
- klientský post-auth redirect by podle výsledku šel na nový screen

Výhody:

- není nutné ukládat raw token do cookie

Nevýhody:

- je potřeba nový route/screen
- duplikuje se UI pro `email_mismatch` a `invalid_or_expired`
- víc stavů se rozlévá do auth redirect vrstvy

### Variant 2: Store raw invite token in the pending invite cookie and redirect back to `/invite/[token]`

Popis:

- `pending_invite` cookie by držela raw token místo hash-only hodnoty
- server při consume token zahashuje až těsně před lookupem
- při post-auth výsledku `email_mismatch` nebo `invalid_or_expired` se klient vrátí na direct `/invite/[token]`
- direct page už umí tyto stavy renderovat

Výhody:

- znovupoužije se existující invite page UI
- direct a post-auth flow budou konzistentní
- menší počet nových surface area

Nevýhody:

- invite token bude uložený v HTTP-only cookie místo hash-only hodnoty
- je potřeba lehce upravit cookie helpery a redirect contract

Aktuálně to vypadá jako nejmenší a nejčistší varianta.

### Variant 3: Keep cookie as-is, but do not consume pending invite on mismatch

Popis:

- cookie by zůstala zachovaná při mismatch
- overview by ji dál nosil mezi requesty

Výhody:

- malý zásah do cookie semantics

Nevýhody:

- sama o sobě neřeší chybějící UI
- hrozí opakované tiché consume pokusy
- uživatel stále nedostane vysvětlení

Tahle varianta sama o sobě nestačí.

## Proposed Next Steps

### Step A

Dopsat audit post-auth větve a potvrdit, zda `email_mismatch` a `invalid_or_expired` opravdu nemají žádný UI surface mimo direct `/invite/[token]` page.

### Step B

Navrhnout cílové řešení pro pending invite outcome po auth. Kandidáti:

1. Rozšířit `resolvePostAuthWorkspaceAction()` o explicitní invite outcome.
2. Přidat dedikovanou post-auth invite result route/screen.
3. Zachovat invite kontext i po mismatch tak, aby byl možný retry s jiným účtem bez ztráty stavu.

Doplnění po dalším auditu:

- jako leading candidate vychází Varianta 2
- před implementací je potřeba potvrdit, že tým akceptuje raw invite token v HTTP-only cookie

### Step C

Po návrhu zvolit nejmenší bezpečnou implementaci a teprve potom sahat do produkčního flow.

## Verification Done So Far

- Invite landing page audited
- Start route audited
- Sign-in/sign-up redirect path audited
- `email_mismatch` direct page fix linted
- TypeScript check passed pro dosud upravené soubory

## Verification Still Missing

- Manuální E2E simulace všech post-auth invite outcomes
- Potvrzení finální UX pro pending invite mismatch / expired invite po auth

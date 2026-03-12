# Phase 1: Account Server Actions Migration

Datum: 12. 3. 2026
Aktualizace: sjednoceni s vysledky code review a error handling analyzy

Navaznost: tento plan je Phase 1 dvoudilneho refaktoringu.
Phase 2 (auth migrace) je v `phase-2-auth-server-actions.md` a predpoklada dokonceni Phase 1.

## 1. Cil

1. Odstranit duplicitni transport vrstvu `account-client.ts` → `/api/account/*` → `account-service`.
2. Nahradit ji primym volanim server actions z UI komponent.
3. Zachovat `AuthResponse<T>` response kontrakt a stavajici UX (toasty, inline chyby, errorCode mapovani).
4. Zachovat `@tanstack/react-form` jako form framework (bez prechodu na `useActionState`).
5. Pripravit sdilenou infrastrukturu (Phase 0), kterou vyuzije i Phase 2.

## 2. Rozhodnuti

1. PocketBase volat i nadale pouze na serveru.
2. Account mutace migrovat z `/api/account/*` na server actions.
3. Auth API (`/api/auth/*`) se v tomto planu NEMENI — zustava na API routes.
4. `@tanstack/react-form` zustava — form handling je jednotny napric celou app.
5. Avatar upload pouzije `FormData` podpis od zacatku (ne jako fallback).

## 3. Scope

In scope:
- Phase 0: extrakce sdilenych service utilit + cookie helper + next.config.ts
- `name` update
- `avatar` upload/remove
- `email change request`
- `password update`
- `delete account`

Out of scope (reseno v Phase 2):
- Auth session endpoint (`/api/auth/session`)
- Sign-in/sign-up/sign-out a dalsi auth mutace
- Marketing API endpointy

## 4. Namereny baseline a odhad uspor

### Aktualni stav (namereno v repu)

| Soubor/skupina | LOC |
|---|---|
| `account-client.ts` | 165 |
| `/api/account/profile/route.ts` | 31 |
| `/api/account/avatar/route.ts` | 44 |
| `/api/account/email-change/request/route.ts` | 31 |
| `/api/account/password/route.ts` | 43 |
| `/api/account/delete/route.ts` | 31 |
| **Account transport celkem** | **345** |

Duplikovane utility v `account-service.ts` sdilene s `auth-service.ts`: 7 funkci (~80 LOC).
11 error mapper funkci (5 v account, 6 v auth) s opakujicim se boilerplate: ~60 LOC uspora extrakci base mapperu.

### Odhad

| Zmena | LOC |
|---|---|
| Odstraneno (account-client + API routes) | -345 |
| Odstraneno (deduplikace service utilit, account podil) | -40 |
| Pridano (account-actions.ts) | +100 az +130 |
| Pridano (cookie helper) | +30 az +40 |
| Pridano (pocketbase-utils.ts, sdilene) | +50 az +60 |
| Pridano (base error mapper helper) | +15 az +20 |
| **Cista uspora Phase 1** | **-130 az -190** |

Poznamka: hlavni LOC uspora prichazi az ve Phase 2 (auth), protoze Phase 1 buduje sdilenou infrastrukturu.
Celkova uspora obou fazi dohromady: **~-400 az -500 LOC**.

## 5. Cilova architektura

1. UI komponenty v `src/features/account/*` volaji primo server actions.
2. Server actions jsou tenke adaptery: Zod validace → service volani → `AuthResponse<T>`.
3. `account-service.ts` zustava centralni domenova vrstva (PB mutace, error mapovani, autorizace).
4. API routes `/api/account/*` po migraci neexistuji.
5. `account-client.ts` po migraci neexistuje.
6. Cookie side effects resi centralni helper v `src/server/auth/auth-cookies.ts`.

## 6. Error handling — co se meni a co zustava

### Zustava beze zmen

- `AuthResponse<T>` discriminated union (`ok: true` + `data` / `ok: false` + `errorCode`).
- `AuthErrorCode` type (9 kodu: BAD_REQUEST, INVALID_CREDENTIALS, EMAIL_ALREADY_IN_USE, atd.).
- Per-operation error mappers v `account-service.ts` (mapUpdateProfileErrorCode, atd.).
- Service vrstva jako jediny zdroj domenoveho error mapovani.
- UI komponenty: switch na `errorCode` → toast/inline alert zustava.

### Odstranuje se (overengineered transport)

- `getAuthApiStatusCode` HTTP status roundtrip (PB status → errorCode → HTTP status zpet). Server actions vraci `AuthResponse<T>` primo, bez HTTP status derivace.
- `hasValidOrigin` guard v route handlerech — server actions maji vlastni CSRF ochranu.
- `requestAccountEndpoint` fetch wrapper + `isAuthResponse` type guard v `account-client.ts`.
- Duplicitni JSON parse + safeParse + createAuthApiErrorResponse pattern v kazdem route handleru.

### Novy (Phase 0 prep)

- Base error mapper helper `mapPocketBaseError` — extrahuje opakovany `429 → RATE_LIMITED` + `UNKNOWN_ERROR` fallback ze vsech 11 mapper funkci.
- Sdilene utility v `src/server/pocketbase/pocketbase-utils.ts` — odstrani 7 duplikovanych funkci.
- Centralni cookie helper `applyServerAuthCookies` — nahrazuje `setCookie` string propagaci.

## 7. Implementacni faze

### Phase 0: Priprava sdilene infrastruktury (1 PR)

**PR #0: Service deduplication + cookie helper + next.config.ts**

Nulovy dopad na runtime — ciste refaktor + konfigurace.

1. Vytvorit `src/server/pocketbase/pocketbase-utils.ts` a presunout:
   - `getAvatarUrl` (auth-service L574-582, account-service L367-375 — identicke)
   - `getNullableTrimmedString` (sjednotit na jednu variantu)
   - `isUsersRecord` (auth-service L602-610, account-service L391-399 — identicke)
   - `hasValidationCode` (auth-service L720-724, account-service L525-529 — identicke)
   - `getFieldError` (auth-service L726-739, account-service L531-544 — identicke)
   - `formatServiceError` (sjednotit format*ServiceError — identicke body)
   - `logServiceError(label, context, error)` (parametrizovana verze log*ServiceError)

2. Pridat base error mapper do `src/server/pocketbase/pocketbase-utils.ts`:
   ```
   function mapPocketBaseError(
     error: unknown,
     operationMapper: (error: ClientResponseError) => AuthErrorCode | null
   ): AuthErrorCode
   ```
   Zpracuje: `429 → RATE_LIMITED`, deleguje na operationMapper, fallback `UNKNOWN_ERROR`.
   Pouzit v obou services misto 11 standalone mapper funkci.

3. Vytvorit `src/server/auth/auth-cookies.ts`:
   - `applyServerAuthCookies(setCookie: string[] | undefined)` — vola `cookies().set/delete` v server action kontextu.
   - `clearServerAuthCookies()` — pro unauthorized/delete scenare.
   - Presunout cookie logiku z budoucich action souboru na jedno centralni misto.

4. Pridat do `next.config.ts`:
   ```
   experimental: {
     serverActions: {
       bodySizeLimit: "2mb",
     },
   },
   ```
   (app limit pro avatar je 1MB, `2mb` je rezerva pro FormData overhead)

5. Aktualizovat importy v `auth-service.ts` a `account-service.ts` — odstranit lokalni kopie, importovat z `pocketbase-utils.ts`. Zrefaktorovat mapper funkce na `mapPocketBaseError` wrapper.

6. Lint + typecheck + build musi projit beze zmen v chovani.

### Phase 1A: Account actions vrstva (1 PR)

**PR #1A: `src/features/account/actions/account-actions.ts`**

1. Soubor s top-level `"use server"` direktivou.
2. Exportovane action funkce:
   - `updateAccountProfileAction(input)` — Zod validace → `accountService.updateProfile` → `AuthResponse<T>`
   - `uploadAccountAvatarAction(formData: FormData)` — extrakce souboru z FormData → Zod validace metadat → `accountService.uploadAvatar` → `AuthResponse<T>`
   - `removeAccountAvatarAction()` — `accountService.removeAvatar` → `AuthResponse<T>`
   - `requestAccountEmailChangeAction(input)` — Zod validace → `accountService.requestEmailChange` → `AuthResponse<T>`
   - `updateAccountPasswordAction(input)` — Zod validace → `accountService.updatePassword` → `AuthResponse<T>`
   - `deleteAccountAction(input)` — Zod validace → `accountService.deleteAccount` → `AuthResponse<T>`

3. Kazda action:
   - Provede vstupni Zod validaci (vrati `BAD_REQUEST` pri selhani).
   - Zavola odpovidajici service metodu.
   - Aplikuje cookie side effects pres `applyServerAuthCookies`.
   - Vrati `AuthResponse<T>` — stejny shape jako dosavadni klient.

4. Avatar action pouziva `FormData` podpis — klient posle `FormData` s blob/file, action extrahuje a validuje.

### Phase 1B: Migrace UI komponent (1 PR)

**PR #1B: Prepojeni komponent na actions**

Poradi migrace (od nejnizsiho rizika):

1. `display-name-settings-item.tsx`
   - Nahradit `updateAccountProfile` import za `updateAccountProfileAction`.
   - onSubmit: `const result = await updateAccountProfileAction(input)` misto `await updateAccountProfile(input)`.
   - Zbytek (errorCode switch, toast, patchProfile) zustava beze zmen.

2. `password-settings-item.tsx`
   - Nahradit `updateAccountPassword` za `updateAccountPasswordAction`.
   - Stejny pattern jako display-name.

3. `email-change-settings-item.tsx`
   - Nahradit `requestAccountEmailChange` za `requestAccountEmailChangeAction`.
   - Stejny pattern.

4. `avatar-settings-item.tsx`
   - Nahradit `uploadAccountAvatar` za `uploadAccountAvatarAction`.
   - Nahradit `removeAccountAvatar` za `removeAccountAvatarAction`.
   - Upload: sestavit `FormData` s výsledkem client-side image processingu, poslat do action.
   - Zachovat existujici `prepareAccountAvatarUpload` (client-side image compression).

5. `delete-account-settings-item.tsx`
   - Nahradit `deleteAccount` za `deleteAccountAction`.
   - Zachovat redirect na `/sign-in` po uspechu.

U vsech komponent:
- `@tanstack/react-form` zustava — formularovy handling se nemeni.
- Toast/inline error UX zustava identicky.
- `errorCode` mapovani v komponentach se nemeni.
- `patchProfile()` z AccountProfileContext zustava pro lokalni state reconciliation.

### Phase 1C: Cleanup (1 PR)

**PR #1C: Odstraneni transport vrstvy**

1. Odstranit `src/features/account/account-client.ts`.
2. Odstranit route handlery:
   - `src/app/api/account/profile/route.ts`
   - `src/app/api/account/avatar/route.ts`
   - `src/app/api/account/email-change/request/route.ts`
   - `src/app/api/account/password/route.ts`
   - `src/app/api/account/delete/route.ts`
3. Vycistit mrtve importy a nepouzivane utility.
4. Lint + typecheck + build.

### Phase 1D: Verifikace (po mergnuti vsech PR)

Manual smoke test:
1. Uprava jmena — ulozeni, toast, zobrazeni v UI.
2. Upload avataru (~1MB soubor) + remove avataru.
3. Email change request — dialog, odeslani, success alert.
4. Zmena hesla — validace, success/error alert.
5. Delete account — potvrzeni, redirect na sign-in.
6. Unauthorized scenar — expired session → spravne cisti cookies, redirect.
7. Overit, ze `/api/account/*` endpointy neexistuji (404).
8. Cross-tab session sync stale funguje pres `/api/auth/session`.

## 8. Dulezite technicke poznamky

1. Avatar upload:
   - `serverActions.bodySizeLimit: "2mb"` v `next.config.ts` (povinny krok v Phase 0).
   - Action pouziva `FormData` podpis — ne plain object s File (serializace File nefunguje).
   - Zachovat client-side image processing pred odeslanim.

2. CSRF/origin:
   - `hasValidOrigin` guard z `/api/account/*` po migraci odpadne.
   - Server actions maji vlastni Next.js CSRF ochranu (Origin header check).
   - Zod validace vstupu zustava povinna v kazde action.

3. Cookie handling:
   - Centralni `applyServerAuthCookies` helper (ne lokalni logika v kazde action).
   - `cookies()` musi byt awaited (Next.js 16).
   - Pri `UNAUTHORIZED` a `delete account` — clear auth cookies.

4. Session sync:
   - Cross-tab auth sync zustava pres `auth-client` + `GET /api/auth/session`.
   - Tento plan to NEMENI — resi se az v Phase 2.

5. Form framework:
   - `@tanstack/react-form` zustava ve vsech komponentach.
   - `useActionState` se NEPOUZIVA — zachovavame jednotny form handling.

## 9. Rizika a mitigace

1. **Upload souboru pres action selze na body limit.**
   Mitigace: explicitni `serverActions.bodySizeLimit: "2mb"` v next.config.ts + test s realnym 1MB souborem.

2. **Rozdilne cookie chovani oproti API route.**
   Mitigace: centralni `applyServerAuthCookies` helper + explicitni test unauthorized/delete flow.

3. **Regrese v error mapovani po refaktoru mapper funkci (Phase 0).**
   Mitigace: refaktor mapperu je ciste interni zmena; `AuthResponse` shape a `AuthErrorCode` hodnoty se nemeni. Typecheck odchyti nesrovnalosti.

4. **Phase 0 refaktor rozbije existujici auth flow.**
   Mitigace: Phase 0 je ciste presun funkci + zmena importu, zadna zmena logiky. Build + lint musi projit pred pokracovanim.

## 10. Akceptacni kriteria

1. `next.config.ts` obsahuje `serverActions.bodySizeLimit`.
2. `src/server/pocketbase/pocketbase-utils.ts` existuje se sdílenymi utilitami.
3. `auth-service.ts` a `account-service.ts` nepouzivaji lokalni kopie sdilenych funkci.
4. Zadna account komponenta neimportuje `account-client`.
5. Route skupina `/api/account/*` neexistuje.
6. Vsech 5 account mutaci funguje pres server actions se stejnym UX.
7. Unauthorized a delete flow korektne cisti auth cookies.
8. Lint/typecheck/build probehnou bez chyb.
9. Phase 2 muze stavet na sdilene infrastrukture bez dalsich prep kroku.

## 11. Doporucene poradi realizace

1. Phase 0: service deduplication + cookie helper + next.config.ts (PR #0).
2. Phase 1A: account-actions.ts (PR #1A).
3. Phase 1B: migrace komponent — poradi: display-name → password → email-change → avatar → delete (PR #1B).
4. Phase 1C: odstraneni account-client.ts + /api/account/* (PR #1C).
5. Phase 1D: smoke test + verifikace.
6. Pokracovat na Phase 2 (`phase-2-auth-server-actions.md`).
# Phase 2: Auth Server Actions Migration

Datum: 12. 3. 2026
Aktualizovano: sjednoceni s vysledky code review a verdiktem

Predpoklad: **Phase 1 (Account Server Actions)** je dokoncena a otestovana.
Viz: `phase-1-account-server-actions.md`

## 1. Cil

1. Migrovat auth mutacni flow z `client fetch -> /api/auth/* -> auth-service` na `client -> server action -> auth-service`.
2. Zachovat `auth-client.ts` jako session orchestrator (`useSession`, cross-tab sync, `refreshSession`).
3. Zachovat jednotny response kontrakt `AuthResponse<T>` (`ok: true/false`, `data`/`errorCode`).
4. Nezavadet behavioral regressions v sign-in/sign-up/sign-out a navazanych flow.
5. Zachovat `@tanstack/react-form` pro vsechny formularove flow.

## 2. Scope

In scope — auth mutace:
- sign-in
- sign-up
- sign-out
- verify-email (token)
- request-password-reset
- reset-password (token)
- request-email-verification
- confirm-email-change

Out of scope (zustava beze zmen):
- `GET /api/auth/session` — pouziva `useSession`, cross-tab sync, visibility/online refetch
- `GET /api/pocketbase/email-link` — entrypoint z PocketBase emailu
- Workspace routes/menu/nav
- Marketing API endpointy
- Account mutace (dokonceny v Phase 1)

## 3. Predpoklady z Phase 1

Phase 2 navazuje na infrastrukturu vytvorenou v Phase 1:

1. Centralni cookie helper (`applyServerAuthCookies` nebo ekvivalent) jiz existuje a je otestovany.
2. Sdilene service utility v `src/server/pocketbase/pocketbase-utils.ts` jiz existuji (Phase 0 prep).
3. `AuthResponse<T>` response kontrakt je overeny v production provozu na account flow.
4. `serverActions.bodySizeLimit` je nastaven v `next.config.ts`.
5. `account-client.ts` a `/api/account/*` route handlery jiz neexistuji.

## 4. Namerene LOC baseline (auth-only)

| Soubor/skupina | LOC | Poznamka |
|---|---|---|
| `src/app/api/auth/[...all]/route.ts` (POST cast) | ~56 | sign-in/sign-up/sign-out |
| `src/app/api/auth/confirm-email-change/route.ts` | 30 | |
| `src/app/api/auth/request-email-verification/route.ts` | 13 | |
| `src/app/api/auth/request-password-reset/route.ts` | 29 | |
| `src/app/api/auth/reset-password/route.ts` | 40 | |
| `src/app/api/auth/verify-email/route.ts` | 28 | |
| **Auth mutation routes celkem** | **~196** | |
| `src/features/auth/auth-client.ts` — mutacni wrappery | ~200 | Z celkovych 524 LOC; session orchestrace (~324 LOC) zustava |
| `src/server/auth/auth-api-route.ts` — bridge modul | ~53 | `getAuthApiStatusCode` + `createAuthApiResponse` |
| **Auth transport vrstva celkem** | **~449** | |

## 5. Odhad uspor (Phase 2 only)

| Co se odstrani | LOC |
|---|---|
| Auth mutation route handlery (6 souboru) | ~196 |
| Mutacni wrappery v `auth-client.ts` (8 funkci + endpoint konstanty + infra) | ~200 |
| `auth-api-route.ts` (bridge modul — nepotrebny bez API routes) | ~53 |
| **Celkem odstraneno** | **~449** |

| Co se prida | LOC |
|---|---|
| `auth-actions.ts` (8 actions + Zod validace) | ~120–160 |
| **Celkem pridano** | **~120–160** |

| Scénar | Netto uspora |
|---|---|
| Konzervativni | **~-250** |
| Agresivni (s cistenim auth-client fetch infra) | **~-330** |

Dohromady s Phase 1 (account -130 az -190): **celkova uspora ~-400 az -500 LOC**.

## 6. Cilova architektura po Phase 2

```
UI komponenty (auth forms)
  |
  +-- @tanstack/react-form (validace, UX)
  |
  +-- server actions (src/features/auth/actions/auth-actions.ts)
  |     +-- Zod vstupni validace
  |     +-- volani auth-service
  |     +-- cookie helper (sdileny z Phase 1)
  |     +-- return AuthResponse<T>
  |
  +-- auth-client.ts (ZACHOVAN jako session orchestrator)
        +-- refreshSession() pres GET /api/auth/session
        +-- useSession() hook
        +-- cross-tab BroadcastChannel sync
        +-- signOut broadcast signal

API routes (zachovane):
  +-- GET /api/auth/session
  +-- GET /api/pocketbase/email-link

Sluzby (beze zmen):
  +-- src/server/auth/auth-service.ts
  +-- src/server/account/account-service.ts
```

## 7. Implementacni plan

### PR 2A: Auth server actions

1. Pridat `src/features/auth/actions/auth-actions.ts` s `"use server"`.
2. Exportovat pojmenovane action funkce:
   - `signInAction`
   - `signUpAction`
   - `signOutAction`
   - `verifyEmailAction`
   - `requestPasswordResetAction`
   - `resetPasswordAction`
   - `requestEmailVerificationAction`
   - `confirmEmailChangeAction`
3. Kazda action:
   - provede vstupni validaci (Zod schema)
   - zavola odpovidajici metodu v `auth-service`
   - aplikuje cookie side effects pres sdileny helper z Phase 1
   - vrati `AuthResponse<T>`
4. Auth-specific cookie handling:
   - sign-in/sign-up: set auth cookies (session creation)
   - sign-out: clear auth cookies
   - reset-password: clear auth cookies (aktualni chovani — po resetu se session NENASTAVI, uzivatel se musi znovu prihlasit)
   - verify-email: set cookies pokud service vraci session

### PR 2B: Migrace auth-client.ts

1. Mutacni funkce v `auth-client.ts` prepnout z `fetch("/api/auth/*")` na server actions.
2. Zachovat:
   - `refreshSession()` pres `GET /api/auth/session` (beze zmeny)
   - `useSession()` hook (beze zmeny)
   - Cross-tab sync pres `BroadcastChannel` (beze zmeny)
   - Session state management (beze zmeny)
3. Odstranit:
   - `requestAuthEndpoint` fetch wrapper (pouziva i `refreshSession` — bud zrefaktorovat na primy fetch, nebo ponechat zjednoduseny)
   - `parseJsonResponse` helper
   - `isAuthResponse` type guard
   - 8 endpoint path konstant (krome `SESSION_ENDPOINT_PATH`)
   - `ResetPasswordWithTokenInput` a `ConfirmEmailChangeInput` type exporty (presunout do action/schema pokud jsou potreba)
4. Migracni poradi (od nejnizsiho rizika):
   - sign-out (nejjednodussi — jen clear cookies + broadcast)
   - request-password-reset, request-email-verification (fire-and-forget)
   - verify-email, confirm-email-change (token-based, jednorazove)
   - reset-password (token + clear cookies — uzivatel se po resetu prihlasuje znovu)
   - sign-in, sign-up (kriticka cesta — migrovat nakonec)
5. Form komponenty zustanou funkcne stejne (`@tanstack/react-form`, minimalni UI diff).

### PR 2C: Route cleanup

1. Odstranit mutacni route handlery:
   - `src/app/api/auth/[...all]/route.ts` — **pozor**: obsahuje i GET (session). Bud rozdelit, nebo ponechat GET handler a odstranit POST.
   - `src/app/api/auth/confirm-email-change/route.ts`
   - `src/app/api/auth/request-email-verification/route.ts`
   - `src/app/api/auth/request-password-reset/route.ts`
   - `src/app/api/auth/reset-password/route.ts`
   - `src/app/api/auth/verify-email/route.ts`
2. Zachovat:
   - `GET /api/auth/session` (presunout do vlastniho souboru pokud byl v catch-all)
   - `GET /api/pocketbase/email-link`
3. Odstranit `src/server/auth/auth-api-route.ts` (`getAuthApiStatusCode`, `createAuthApiResponse`, `createAuthApiErrorResponse` — jiz nepotrebne).
4. Vycistit mrtve importy a nepouzivane typy.

## 8. Dulezite technicke poznamky

### Catch-all route `[...all]/route.ts`

Dnes obsahuje GET (session refresh) i POST (sign-in/sign-up/sign-out) v jednom souboru.
Pri migraci POST na server actions:
- Varianta A: Ponechat soubor jen s GET handlerem, odstranit POST.
- Varianta B: Presunout GET do dedicovane session route `src/app/api/auth/session/route.ts` a smazat catch-all uplne.
- **Doporuceni**: Varianta B — cistejsi, eliminuje catch-all routing overhead.

### Cookie propagation

Sdileny cookie helper z Phase 1 pokryva zakladni flow (clear on unauthorized, clear on delete).
Pro auth actions je treba rozsirit o:
- Set auth cookies pri sign-in/sign-up (session creation)
- Clear auth cookies pri reset-password (aktualni chovani — zadny auto-login)
- Clear auth cookies pri sign-out
Tyto extensions pridat do existujiciho helperu, ne vytvorit novy.

### Session sync po sign-in/sign-up

Po uspesnem sign-in/sign-up pres server action:
1. Action nastavi auth cookies (server-side).
2. Klient zavola `refreshSession()` pro aktualizaci `useSession` stavu.
3. Cross-tab broadcast `"session-changed"` signal (ne `"signed-in"` — kod pouziva `"session-changed"` | `"signed-out"`, viz `auth-client.ts` L401).
Tento flow je stejny jako dnes, jen transport mutace je jiny.

### Sign-out broadcast

Po sign-out action:
1. Action clear auth cookies (server-side).
2. Klient broadcast `"signed-out"` signal pres `BroadcastChannel`.
3. Ostatni taby okamzite clearuji session state (bez server roundtripu).
Zadna zmena v logice, jen transport.

### Double HTTP status roundtrip — eliminace

Dnes: PB status → `mapXxxErrorCode` → `AuthErrorCode` → `getAuthApiStatusCode` → HTTP status.
Po migraci: PB status → `mapXxxErrorCode` → `AuthErrorCode` → primo v `AuthResponse<T>`.
`getAuthApiStatusCode` a cely `auth-api-route.ts` bridge modul se stava nepotrebnym.

## 9. Rizika a mitigace

1. **Riziko**: Sign-in/sign-up cookies se neprojevi v browseru.
   - Mitigace: explicitni test sign-in → kontrola `document.cookie` (httpOnly se neukaze, ale session refresh musi fungovat) → overit `useSession` stav.

2. **Riziko**: Cross-tab sync regrese.
   - Mitigace: test sign-out v jednom tabu → kontrola ze druhy tab clearuje session bez reload.

3. **Riziko**: Catch-all route refaktor rozbije session endpoint.
   - Mitigace: nejdrive vytvorit novou session route, overit ze funguje, pak teprve smazat catch-all.

4. **Riziko**: Rozdilne chovani cookies v server action vs API route.
   - Mitigace: Phase 1 uz overila cookie helper na account flow. Auth pouzije stejny helper s rozsirenim.

5. **Riziko**: Regrese v error mapovani auth flow.
   - Mitigace: `auth-service.ts` se nemeni. Mapovani errorCode zustava stejne. Jen transport vrstva se meni.

## 10. QA checklist

### Auth flow
- [ ] sign-in (email + password) → session created, redirect, useSession updated
- [ ] sign-up (email + password + name) → session created, redirect
- [ ] sign-out → cookies cleared, redirect, cross-tab broadcast
- [ ] verify-email (token z emailu) → email overena
- [ ] request-password-reset → email odeslan
- [ ] reset-password (token) → heslo zmeneno, cookies cleared, uzivatel se prihlasuje znovu
- [ ] request-email-verification → email odeslan
- [ ] confirm-email-change (token) → email zmenena

### Session sync
- [ ] `useSession()` vraci spravny stav po sign-in
- [ ] `useSession()` vraci `unauthenticated` po sign-out
- [ ] Cross-tab sign-out funguje (broadcast → immediate clear)
- [ ] Cross-tab session-changed funguje (broadcast `"session-changed"` → rate-limited refetch session)
- [ ] `GET /api/auth/session` funguje samostatne (po odstraneni catch-all)
- [ ] Visibility/online refetch funguje

### Error handling
- [ ] Neplatne credentials → `INVALID_CREDENTIALS` errorCode v UI
- [ ] Duplicitni email pri sign-up → `EMAIL_ALREADY_IN_USE`
- [ ] Slabe heslo → `WEAK_PASSWORD`
- [ ] Rate limit → `RATE_LIMITED`
- [ ] Neplatny/expiry token → spravny errorCode
- [ ] Expired session → `UNAUTHORIZED` → redirect na sign-in

### Infrastruktura
- [ ] Lint prochazi bez chyb
- [ ] Typecheck prochazi bez chyb
- [ ] Build prochazi bez chyb
- [ ] Zadna route pod `/api/auth/*` krome session endpointu
- [ ] `auth-api-route.ts` odstranen
- [ ] `auth-client.ts` neobsahuje zadny `fetch` na `/api/auth/*` mutacni endpointy

## 11. Akceptacni kriteria

1. Vsech 8 auth mutaci funguje pres server actions se stejnym UX.
2. `auth-client.ts` slouzi pouze jako session orchestrator (useSession, refreshSession, cross-tab sync).
3. Mutacni route handlery pod `/api/auth/*` neexistuji.
4. `GET /api/auth/session` funguje v dedicovanem route souboru.
5. `auth-api-route.ts` bridge modul odstranen.
6. Cookie handling pouziva sdileny helper z Phase 1 (rozsireny o auth-specific flow).
7. Cross-tab sync funguje bez regresi.
8. Lint/typecheck/build prochazi bez chyb.
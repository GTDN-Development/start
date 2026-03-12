# Auth Update Plan (Bez Workspace Cleanup)

Datum: 12. 3. 2026

## 1. Scope

Tento plan je zamerne omezeny pouze na zjednoduseni auth/account mutacnich flow pres server actions.

Vynechano na pozdeji:
- zadne mazani workspace rout/menu/nav
- zadne zmeny ve `src/config/menu.ts` / `src/i18n/routing.ts` v casti workspace

## 2. Cil

1. Zjednodusit mutacni auth/account flow (mene route-adapter boilerplate).
2. Zachovat soucasny session sync model (`useSession` + `GET /api/auth/session`).
3. Udrzet stejny response kontrakt (`ok: true/false`, `data`/`errorCode`).
4. Nezavadet behavioral regressions v sign-in/sign-up/sign-out a account settings flow.

## 3. Odhad uspor LOC (bez workspace casti)

Baseline pro zmenu:
- mutacni auth/account API route handlery: cca **437 LOC**
- klientske fetch wrapppery v auth/account mutacich: cca **250+ LOC**

Odhad netto:
1. Server actions vrstva + redukce mutacnich route handleru
- konzervativne: **-120 LOC**
- agresivne: **-240 LOC**

2. Deduplikace klientskych wrapperu + mapovani chyb
- konzervativne: **-60 LOC**
- agresivne: **-140 LOC**

Celkem bez workspace cleanup:
- konzervativne: **-180 LOC**
- agresivne: **-380 LOC**

## 4. Navrh architektury

1. Ponechat API endpointy:
- `GET /api/auth/session` (pro `useSession`, cross-tab sync, visibility/online refetch)
- `GET /api/pocketbase/email-link` (entrypoint z PocketBase emailu)

2. Presunout mutace na server actions:
- Auth:
  - sign-in
  - sign-up
  - sign-out
  - verify-email token
  - request-password-reset
  - reset-password token
  - request-email-verification
  - confirm-email-change
- Account:
  - update profile name
  - upload/remove avatar
  - request email change
  - update password
  - delete account

3. Sluzby zustanou beze zmeny jako source of truth:
- `src/server/auth/auth-service.ts`
- `src/server/account/account-service.ts`

## 5. Implementacni plan

### PR #1: Server actions foundation

1. Pridat `auth-actions.ts` a `account-actions.ts`.
2. V actions znovu validovat vstupy (zod schema).
3. Udrzet stejny `AuthResponse` shape jako dnesni API vrstva.
4. Zajistit spravne preneseni `set-cookie` z service vrstvy do browseru.

### PR #2: Client wiring

1. `src/features/auth/auth-client.ts`
- mutace prepnout z `fetch("/api/auth/*")` na server actions
- `refreshSession()` ponechat pres `GET /api/auth/session`

2. `src/features/account/account-client.ts`
- mutace prepnout z `fetch("/api/account/*")` na server actions

3. Form komponenty zustanou funkcne stejne (minimalni UI diff).

### PR #3: Route cleanup + deduplikace

1. Odebrat nepouzivane mutacni route handlery pod:
- `src/app/api/auth/*` (krome session endpointu)
- `src/app/api/account/*` (pokud nebude potreba pro externi konzumenty)

2. Deduplikovat validace/chybove mapovani tam, kde se opakuji.

## 6. Rizika a mitigace

1. Cookie propagation v server actions
- riziko: session se po mutaci neprojevi v browseru
- mitigace: explicitni test sign-in/sign-out/reset/delete + kontrola cookie chovani

2. Avatar upload pres action
- riziko: serializace `File` v action call
- mitigace: pokud bude problem, ponechat avatar endpoint jako API route fallback

3. Nechtene rozbiti session store
- mitigace: `auth-client` nechat jako session orchestrator; menit jen mutacni transport

## 7. QA checklist

1. Auth flow
- sign-in/sign-up/sign-out
- verify-email
- forgot/reset password
- request-email-verification
- confirm-email-change

2. Account flow
- profile name update
- avatar upload/remove
- email change request
- password change
- delete account

3. Session sync
- `useSession()` stale funguje pres `GET /api/auth/session`
- cross-tab sign-out a session refresh bez regresi

## 8. Rozhodnuti

Plan je pripraven pouze pro server-actions simplifikaci. Workspace cleanup zustava mimo scope podle zadani.

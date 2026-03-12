# Account Management Server Actions Plan

Datum: 12. 3. 2026  
Cil: zjednodusit account management flow tak, aby mutace nesly pres server actions misto `client fetch -> /api/account/* -> service`, pri zachovani stejne bezpecnosti a stejnych response/error kontraktu.

## 1. Rozhodnuti

1. PocketBase volat i nadale pouze na serveru.
2. Nevolat PocketBase napriamo z browser klienta.
3. Account mutace migrovat z `/api/account/*` na server actions.
4. Auth API (`/api/auth/*`) zatim ponechat, hlavne kvuli session refresh a cross-tab sync.

## 2. Proc tato varianta

1. Aktualni setup uz splnuje PB security baseline: per-request PB instance + cookie auth model.
2. Nejvetsi slozitost je duplicitni transport vrstva:
3. `src/features/account/account-client.ts` (client wrapper)
4. `src/app/api/account/*` (route adaptery)
5. `src/server/account/account-service.ts` (realna business logika)
6. Server actions odstrani jednu celou vrstvu boilerplate bez ztraty server-side kontrol.
7. Prime volani PB z klienta by zhorsilo security model (httpOnly cookie by prestala fungovat jako hlavni ochrana).

## 3. Scope

1. In scope:
2. `name` update
3. `avatar` upload/remove
4. `email change request`
5. `password update`
6. `delete account`
7. Out of scope:
8. Auth session endpoint (`/api/auth/session`)
9. Sign-in/sign-up/sign-out endpoints
10. Marketing API endpointy

## 4. Cilova architektura

1. UI komponenty v `src/features/account/*` budou volat server actions.
2. Server actions budou tenky adapter na `account-service`.
3. `account-service` zustane centralni domnova vrstva pro PB mutace, mapovani chyb a autorizaci.
4. API route `src/app/api/account/*` budou po migraci odstraneny.
5. `src/features/account/account-client.ts` bude po migraci odstraneny.

## 5. Implementacni faze

## Faze A: Priprava server actions vrstvy

1. Pridat `src/features/account/actions/account-actions.ts` s `"use server"`.
2. Exportovat pojmenovane action funkce:
3. `updateAccountProfileAction`
4. `uploadAccountAvatarAction`
5. `removeAccountAvatarAction`
6. `requestAccountEmailChangeAction`
7. `updateAccountPasswordAction`
8. `deleteAccountAction`
9. Kazda action:
10. provede vstupni validaci (Zod)
11. zavola odpovidajici metodu v `account-service`
12. vrati stejny `AuthResponse<T>` shape jako dosavadni klient.

## Faze B: Cookie side effects pro server actions

1. Dnes account-service vraci `setCookie` jako serialized header hodnoty.
2. U server actions neni vhodne prenaset HTTP header stringy.
3. Pridat helper, ktery aplikuje auth cookie side effects v action kontextu.
4. Minimalni varianta:
5. pri `UNAUTHORIZED` clear auth cookies
6. pri successful delete account clear auth cookies
7. Nezavlekavat duplicity do komponent; cookie handling drzet uvnitr action souboru.

## Faze C: Migrace UI komponent na actions

1. Upravit importy v:
2. `src/features/account/general/display-name-settings-item.tsx`
3. `src/features/account/general/avatar-settings-item.tsx`
4. `src/features/account/general/email-change-settings-item.tsx`
5. `src/features/account/general/delete-account-settings-item.tsx`
6. `src/features/account/security/password-settings-item.tsx`
7. Nahradit volani funkcemi ze server actions.
8. Zachovat stavajici UX:
9. stejne toasty
10. stejne inline chyby
11. stejne mapovani `errorCode`
12. Avatar flow:
13. zachovat existujici client-side image processing
14. na server action posilat finalni soubor
15. pri potrebe prejit na `FormData` podpis action (kvuli serializaci souboru).

## Faze D: Cleanup transport vrstvy

1. Odstranit `src/features/account/account-client.ts`.
2. Odstranit route handlery:
3. `src/app/api/account/profile/route.ts`
4. `src/app/api/account/avatar/route.ts`
5. `src/app/api/account/email-change/request/route.ts`
6. `src/app/api/account/password/route.ts`
7. `src/app/api/account/delete/route.ts`
8. Vycistit mrtve importy a utility usage.

## Faze E: Verifikace a regression check

1. Lint a typecheck celeho projektu.
2. Manual smoke test scenaru:
3. uprava jmena
4. upload + remove avatar
5. email change request
6. change password
7. delete account + redirect na sign-in
8. unauthorized scenar s neplatnou session
9. Overit, ze account pages funguji bez `/api/account/*`.

## 6. Dulezite technicke poznamky

1. Avatar upload limit:
2. Zkontrolovat `serverActions.bodySizeLimit` v `next.config.ts`.
3. Pro stabilitu uploadu nastavit rezervu (napr. `2mb`), protoze app limit je 1MB plus overhead.
4. CSRF/origin:
5. `hasValidOrigin` guard z `/api/account/*` po migraci odpadne.
6. Server actions maji vlastni ochranny model, ale validace inputu zustava povinna.
7. Session sync:
8. Cross-tab auth sync zustava pres `auth-client` a `/api/auth/session`, tento plan to nemen.

## 7. Rizika a mitigace

1. Riziko: upload souboru pres action selze na body limit.
2. Mitigace: explicitni `serverActions.bodySizeLimit`, test s realnym 1MB souborem.
3. Riziko: rozdilne cookie chovani oproti API route.
4. Mitigace: centralni helper pro auth cookie side effects + test unauthorized/delete flow.
5. Riziko: regress v error mapovani.
6. Mitigace: zachovat `AuthResponse` shape a mapovani v `account-service` beze zmen.

## 8. Akceptacni kriteria

1. Zadna account komponenta neimportuje `account-client`.
2. Route skupina `/api/account/*` neexistuje.
3. Vsech 5 account mutaci funguje pres server actions se stejnym UX.
4. Unauthorized a delete flow korektne cisti auth cookies.
5. Lint/typecheck/build probehnou bez chyb.

## 9. Odhad dopadu

1. Odstraneni zhruba 300+ radku adapter kodu (`account-client` + `api/account/*`).
2. Pridani jedne action vrstvy (~80-150 radku podle helperu).
3. Cisty vysledek:
4. mene transport boilerplate
5. mene mist s duplicitni validaci/parsingem
6. jednodussi maintenance account flow.

## 10. Doporucene poradi realizace

1. Implementovat actions + cookie helper.
2. Migrovat nejdrive `display-name` a `password` (nejmensi riziko).
3. Migrovat `email change`.
4. Migrovat `avatar`.
5. Migrovat `delete account`.
6. Odstranit `/api/account/*` a `account-client`.
7. Spustit smoke test + lint/typecheck/build.

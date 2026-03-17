# Auth Refactoring Plan

Status:
1. Tento dokument je jeden ze tří samostatných refaktoringových úkolů.
2. Je kompatibilní s `.plans/refactoring/workspaces-refactoring-plan.md` a `.plans/refactoring/user-devices-refactoring-plan.md`.
3. Může být realizován samostatně, pokud zůstanou zachované stabilní kontrakty ze sekce 4.

Datum: 17. 3. 2026
Vychází z: `AUDIT-WORKSPACES-AUTH-DEVICES.md`, `.plans/phase-2-auth-server-actions.md`

## 1. Cíl

1. Zjednodušit auth infrastrukturu bez rozbití stávajících auth flow.
2. Snížit komplexitu session resolverů, cookie glue a klientského session orchestration layeru.
3. Zachovat současný uživatelský UX standard pro sign-in, sign-up, sign-out, verify email, reset password a confirm email change.
4. Udržet kompatibilitu pro workspace bootstrap a user-devices guard flow.

## 2. Baseline

Aktuální odhad pro auditovaný scope:

- soubory: 39
- LOC: 4438

Největší hotspoty:

1. `src/server/auth/auth-service.ts` — 809 LOC
2. `src/features/auth/auth-client.ts` — 444 LOC
3. `src/features/auth/sign-up/sign-up-form.tsx` — 327 LOC
4. `src/features/auth/reset-password/reset-password-form.tsx` — 231 LOC
5. `src/features/auth/sign-in/sign-in-form.tsx` — 221 LOC
6. `src/features/auth/actions/auth-actions.ts` — 205 LOC

## 3. Hlavní problémy, které má tento task řešit

1. Dva session resolvery řeší velmi podobný problém (`getServerAuthSession`, `getApiAuthSession`).
2. `auth-client.ts` je robustní, ale na aktuální potřeby appky už příliš těžký.
3. Existuje příliš mnoho adapter vrstev pro response a cookie flow.
4. Některé malé auth soubory zvyšují file count bez významného architektonického přínosu.
5. Auth formuláře jsou ještě udržitelné, ale další růst by byl už drahý bez zjednodušení infrastruktury.

## 4. Stabilní kontrakty, které musí zůstat zachované

Tento task je samostatně nasaditelný jen tehdy, pokud zůstanou stabilní tyto veřejné kontrakty:

1. Typové a response kontrakty:
2. `AuthResponse<T>`
3. `AuthErrorCode`
4. `AuthSessionSnapshot`
5. Veřejné klientské entry pointy:
6. `signIn`
7. `signUp`
8. `signOut`
9. `verifyEmailToken`
10. `requestPasswordReset`
11. `resetPasswordWithToken`
12. `requestEmailVerification`
13. `confirmEmailChange`
14. `useSession`
15. `refreshSession`
16. Veřejné server action entry pointy:
17. `signInAction`
18. `signUpAction`
19. `signOutAction`
20. `verifyEmailAction`
21. `requestPasswordResetAction`
22. `resetPasswordAction`
23. `requestEmailVerificationAction`
24. `confirmEmailChangeAction`
25. Routy a redirecty:
26. `/sign-in`
27. `/sign-up`
28. `/forgot-password`
29. `/reset-password`
30. `/verify-email`
31. `/confirm-email-change`
32. `/api/auth/session`
33. Cookie názvy:
34. `pb_auth`
35. `pb_auth_persist`
36. Workspace a user-devices tasky musí dál fungovat na stejném auth základu:
37. `getServerAuthSession()` nebo jeho kompatibilní náhrada
38. `requireCurrentUser()` nebo jeho kompatibilní náhrada
39. `AUTH_REDIRECTS`

## 5. Scope

In scope:

1. Unifikace session resolver logiky v `auth-service.ts`.
2. Zjednodušení `auth-client.ts`.
3. Redukce malých auth helper/wrapper souborů.
4. Zjednodušení cookie/response glue tam, kde nepřidává jasnou hodnotu.
5. Zachování stávajících formulářů s minimálními behavior změnami.

Out of scope:

1. Přepis auth flow na jiného providera.
2. Změna URL struktury auth rout.
3. Změna workspace post-auth flow kontraktu.
4. Změna PocketBase integration modelu.
5. Velký redesign formulářů.
6. Změna device-session security modelu.

## 6. Co zůstane zachováno a o jaké feature přijdeme

### 6.1 Zachované feature

1. Sign-in.
2. Sign-up.
3. Sign-out.
4. Verify email.
5. Forgot/reset password.
6. Confirm email change.
7. Session sync přes `/api/auth/session`.
8. Základní cross-tab session synchronizace.
9. Workspace-aware post-auth redirect flow.

### 6.2 Záměrně ztracené nebo zjednodušené feature

1. Automatický session refetch při návratu do tabu přes `visibilitychange`.
2. Automatický session refetch při návratu online.
3. Část interního rate-limit/dedup glue v klientské session vrstvě.
4. Část malých helper modulů bude absorbována do větších, ale čitelnějších souborů.

Praktický dopad:

1. Auth UX zůstane standardní.
2. Session stav se bude aktualizovat hlavně po mutacích a explicitním refreshi, ne přes tolik background heuristik.
3. Chování bude jednodušší na debugging i maintenance.

## 7. Cílový stav po refaktoru

### 7.1 Server vrstva

Cílový směr:

1. Sloučit `getServerAuthSession()` a `getApiAuthSession()` nad jeden interní resolver.
2. Zachovat dvě veřejná entry point jména jen pokud to zjednoduší migraci; interně ale musí sdílet jednu logiku.
3. Zmenšit opakování v cookie clear/set flow.
4. Omezit počet response adapter vrstev.

### 7.2 Client vrstva

Cílový směr:

1. `auth-client.ts` ponechat jako jediný session client entry point.
2. Zjednodušit background sync mechaniky.
3. Zachovat optimistic update po auth akcích.
4. Zachovat `useSession()` bez potřeby velkého přepisu formulářů.

### 7.3 Malé moduly

Kandidáti na sloučení:

1. `auth-routes.ts` -> přímo do `config/auth.ts` nebo `auth-contract.ts`
2. `email-verification.ts` + `use-email-verification.ts` -> jeden soubor
3. `sign-in-flash-toast.tsx` -> k sign-in feature boundary
4. `finalize-auth-action.ts` -> do `auth-actions.ts` nebo sdíleného auth helperu
5. podle výsledku i `auth-layout.tsx` + `auth-page-shell.tsx`

## 8. Navržené konkrétní změny po PR krocích

## PR A1: Session resolver unifikace

1. Vytvořit jeden interní resolver v `src/server/auth/auth-service.ts`:
2. například `resolveAuthSession({ mode: "server" | "api" })`
3. Zachovat kompatibilní veřejné wrappery, pokud to zmenší diff do zbytku appky.
4. Sdílet uvnitř:
5. validaci PocketBase auth cookie
6. validaci device session
7. refresh/fetch logiku
8. stale-session fallback rozhodnutí
9. cookie clearing logiku

Výsledek:

1. Méně duplikace.
2. Menší riziko divergence mezi server a API režimem.

## PR A2: Zjednodušení auth-client.ts

1. Zachovat:
2. `useSession()`
3. `refreshSession()`
4. optimistic state updates po auth akcích
5. `BroadcastChannel` sync pro změnu session
6. Odebrat:
7. `visibilitychange` refresh
8. `online` recovery refresh
9. část rate-limit glue kolem background refetchů
10. Udržet jednoduché pravidlo:
11. session se aktualizuje po mutaci
12. session se aktualizuje při explicitním `refreshSession()`
13. session se aktualizuje přes cross-tab signal

Výsledek:

1. Menší runtime magie.
2. Menší počet těžko debuggovatelných větví.

## PR A3: Sloučení malých auth modulů

1. Sloučit malé wrapper/helper moduly tam, kde nepřinášejí samostatnou architektonickou hodnotu.
2. Zachovat jen ty soubory, které jsou opravdu stabilní feature boundaries.
3. Nepřidávat nové mezivrstvy jen kvůli „čistotě“.

Výsledek:

1. Menší file count.
2. Lepší orientace v auth doméně.

## PR A4: Lehký cleanup formulářového glue

1. Nechat stávající formuláře strukturálně podobné.
2. Jen sjednotit a případně zjednodušit opakovaný error handling tam, kde je to levné.
3. Nepřepisovat všechny formuláře do nové abstrakce.

Výsledek:

1. Menší riziko regressí.
2. Nižší mentální overhead bez velkého redesignu.

## 9. Odhad snížení počtu souborů a LOC

### 9.1 Konzervativní varianta

- soubory: z 39 na 35 až 36
- čistá úspora: minus 3 až 4 soubory
- LOC: z 4438 na cca 4160 až 4270
- čistá úspora: minus cca 170 až 280 LOC

### 9.2 Doporučená varianta

- soubory: z 39 na 32 až 34
- čistá úspora: minus 5 až 7 souborů
- LOC: z 4438 na cca 3910 až 4150
- čistá úspora: minus cca 290 až 530 LOC

### 9.3 Agresivnější varianta

- soubory: z 39 na 31 až 33
- čistá úspora: minus 6 až 8 souborů
- LOC: z 4438 na cca 3810 až 4040
- čistá úspora: minus cca 400 až 630 LOC

Doporučení:

1. Jít doporučenou variantou.
2. Zachovat cross-tab sync, ale ořezat background refetch heuristiky.
3. Nesahat agresivně na formuláře, protože největší zisk je v infrastruktuře, ne v UI.

## 10. Rizika a mitigace

1. Riziko: jednodušší session sync způsobí stale UI stav v některých edge casích.
2. Mitigace: zachovat explicitní `refreshSession()` a cross-tab signal.
3. Riziko: sloučení resolverů rozbije `GET /api/auth/session` behavior.
4. Mitigace: ponechat wrapper jména a testovat server vs API mód odděleně.
5. Riziko: přehnané slučování souborů zhorší čitelnost.
6. Mitigace: slučovat jen malé wrappery, ne celé feature boundaries.

## 11. Definice hotového stavu

1. Auth flow zůstává uživatelsky stejný nebo lepší.
2. `auth-service.ts` už neduplikuje session resolver logiku ve dvou velkých větvích.
3. `auth-client.ts` je znatelně jednodušší a méně magický.
4. File count auth domény klesne bez zavedení nové infra vrstvy.
5. Workspace a user-devices task nad tímto refaktorem dál fungují bez nutnosti současného release.

## 12. Doporučené pořadí vůči ostatním taskům

1. Tento task je nejlepší kandidát na první refaktor.
2. Workspaces i user-devices z něj budou profitovat, ale nejsou na něm blokovaně závislé.
3. Pokud půjde až po workspaces tasku, je potřeba jen zachovat kompatibilní auth entry pointy pro `/overview`, invite flow a account security.

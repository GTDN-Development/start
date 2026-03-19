# Auth Refactoring Plan

Status:
1. Tento dokument po reevaluaci zustava spis referencnim auditem nez doporucenym samostatnym refaktoringovym taskem.
2. Je kompatibilní s `.plans/refactoring/auth-workspaces/workspaces-refactoring-plan.md` a `.plans/refactoring/auth-workspaces/user-devices-refactoring-plan.md`.
3. Muze byt realizovan samostatne, ale aktualne se to nedoporucuje bez noveho produktoveho nebo architektonickeho triggeru.

Datum: 19. 3. 2026
Vychází z: `AUDIT-WORKSPACES-AUTH-DEVICES.md`, `.plans/phase-2-auth-server-actions.md`, `.plans/refactoring/use-effect/use-effect-refactoring-plan.md`

## 1. Cíl

1. Zjednodušit auth infrastrukturu bez rozbití stávajících auth flow.
2. Snížit komplexitu session resolverů, cookie glue a klientského session orchestration layeru.
3. Zachovat současný uživatelský UX standard pro sign-in, sign-up, sign-out, verify email, reset password a confirm email change.
4. Udržet kompatibilitu pro workspace bootstrap a user-devices guard flow.

## 2. Baseline

Aktuální odhad pro auditovaný scope:

- soubory: 34
- LOC: 4174

Největší hotspoty:

1. `src/server/auth/auth-service.ts` — 809 LOC
2. `src/features/auth/auth-client.ts` — 434 LOC
3. `src/features/auth/sign-up/sign-up-form.tsx` — 326 LOC
4. `src/features/auth/reset-password/reset-password-form.tsx` — 228 LOC
5. `src/features/auth/sign-in/sign-in-form.tsx` — 220 LOC
6. `src/features/auth/actions/auth-actions.ts` — 204 LOC

## 2.1 Dopad merge useEffect refaktoru

1. `src/features/auth/auth-client.ts` uz nema komponentovy `useEffect`; `useSession()` bezi pres `useSyncExternalStore` a bootstrap session store resi subscription lifecycle.
2. Background sync (`BroadcastChannel`, `visibilitychange`, `online`) zustal zachovany, ale uz neni navazany na komponentovy effect choreography.
3. Auth flash mezivrstva byla odstranena; `src/features/auth/sign-in/sign-in-flash-toast.tsx` uz neni kandidat dalsiho refaktoru.
4. Invite auth-required redirect uz je server-first flow; `src/features/auth/invite/token/invite-token-auth-required-redirect.tsx` byl odstraneny.
5. Z pohledu tohoto planu tedy odpadly useEffect-motivovane quick wins a zustava hlavne architektonicke zjednoduseni auth service a session klienta.

## 3. Hlavní problémy, které má tento task řešit

1. `auth-service.ts` je nejvetsi hotspot, ale `getServerAuthSession()` a `getApiAuthSession()` maji zamerne rozdilne chovani a nejsou vhodny kandidat na mechanicke slouceni pres `mode` flag.
2. `auth-client.ts` je po useEffect refaktoru relativne kompaktnim session managerem, ne akutnim architektonickym problemem.
3. Cast malych auth souboru ma nizky prinos, ale vetsina boundary je legitimni kvuli server/client oddeleni.
4. Formularovy glue ma jen omezeny cleanup potential; nejde o hlavni zdroj complexity.
5. Nejvetsi cast puvodne planovanych quick wins uz absorboval useEffect refaktor.

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

1. Jen oportunisticke cisteni auth vrstvy pri souvisejicich zmenach v auth domene.
2. Sdilene male helpery v `auth-service.ts`, pokud zmensi duplikaci bez sjednocovani odlisneho behavior.
3. Redukce jednotlivych low-value helper/wrapper souboru tam, kde nevznika horsi boundary.
4. Lehky cleanup opakovaneho formularoveho glue bez behavior zmen.

Out of scope:

1. Přepis auth flow na jiného providera.
2. Změna URL struktury auth rout.
3. Změna workspace post-auth flow kontraktu.
4. Změna PocketBase integration modelu.
5. Velký redesign formulářů.
6. Změna device-session security modelu.
7. Mechanicka unifikace `getServerAuthSession()` a `getApiAuthSession()` pres `mode` flag.
8. Samostatny refactor `auth-client.ts`, pokud se nemeni produktove pozadavky na session sync.

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

1. Cast interniho rate-limit/dedup glue v klientske session vrstve.
2. Cast malych helper modulu bude absorbovana do vetsich, ale citelnejsich souboru.

Praktický dopad:

1. Auth UX zůstane standardní.
2. Zachovani nebo omezeni `visibilitychange` a `online` refreshu uz neni nutna soucast useEffect cleanupu; jde o samostatne produktove/runtime rozhodnuti.
3. Chování bude jednodušší na debugging i maintenance.

## 7. Cílový stav po refaktoru

### 7.1 Server vrstva

Cílový směr:

1. Zachovat oddelene `getServerAuthSession()` a `getApiAuthSession()`, protoze jejich behavior neni identicky.
2. Sdilet jen male interni helpery tam, kde to nesmaze rozdily mezi pasivnim read a aktivnim refresh flow.
3. Zmensit opakovani v cookie clear/set flow jen pokud tim nevznikne dalsi conditional complexity.
4. Omezit response adapter vrstvy pouze u lokalnich low-risk mist.

### 7.2 Client vrstva

Cílový směr:

1. `auth-client.ts` ponechat jako jediný session client entry point.
2. Zachovat `useSyncExternalStore` + store lifecycle model; nevracet komponentovy mount bootstrap pres effect.
3. Background sync mechaniky (`BroadcastChannel`, `visibilitychange`, `online`) brat jako samostatnou optimalizacni otazku, ne jako povinny cil tohoto tasku.
4. Zachovat optimistic update po auth akcich.
5. Zachovat `useSession()` bez potreby velkeho prepisu formularu.

### 7.3 Malé moduly

Kandidáti na sloučení:

1. `auth-routes.ts` -> přímo do `config/auth.ts` nebo `auth-contract.ts`
2. `auth-flow-token.ts` -> k nejblizsi feature boundary nebo auth helperu
3. `email-verification.ts` + `use-email-verification.ts` -> jeden soubor, jen pokud zustane citelna boundary
4. `finalize-auth-action.ts` -> do `auth-actions.ts` nebo sdíleného auth helperu

## 8. Navržené konkrétní změny po PR krocích

## PR A1: Session resolver unifikace

Status: nedoporuceno jako samostatny krok.

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

1. Potencialne mene duplikace.
2. Zaroven vyssi riziko conditional complexity a rozmazani zamerne odlisneho behavior mezi server a API rezimem.
3. Aktualni doporuceni: nerealizovat, maximalne vytahnout jednotlive helpery bez sjednoceni resolveru.

## PR A2: Zjednodušení auth-client.ts

Status: nedoporuceno jako samostatny krok.

1. Zachovat:
2. `useSession()`
3. `refreshSession()`
4. optimistic state updates po auth akcích
5. `BroadcastChannel` sync pro změnu session
6. store-lifecycle bootstrap bez komponentoveho `useEffect`
7. Nevracet:
8. mount-triggered fetch/bootstrap pres komponentovy effect
9. `sessionStorage -> mount effect -> toast` auth flash choreografii
10. Zvážit zvlášť:
11. jestli `visibilitychange` a `online` refresh porad davaji hodnotu po zjednoduseni session vrstvy
12. cast rate-limit glue kolem background refetchu
13. Udržet jednoduché pravidlo:
14. session se aktualizuje po mutaci
15. session se aktualizuje při explicitním `refreshSession()`
16. session se aktualizuje přes cross-tab signal

Výsledek:

1. Teoreticky mene runtime magie.
2. Prakticky ale maly zisk, protoze soubor uz je po useEffect refaktoru pomerne kompaktnim session managerem.
3. Aktualni doporuceni: ponechat, pokud nevznikne novy konkretni produktovy problem.

## PR A3: Sloučení malých auth modulů

Status: volitelne, jen oportunisticky.

1. Sloučit malé wrapper/helper moduly tam, kde nepřinášejí samostatnou architektonickou hodnotu.
2. Zachovat jen ty soubory, které jsou opravdu stabilní feature boundaries.
3. Nepřidávat nové mezivrstvy jen kvůli „čistotě“.

Výsledek:

1. Maly pokles file countu.
2. Omezena architektonicka hodnota; vyplati se jen u jednotlivych low-value souboru.

## PR A4: Lehký cleanup formulářového glue

Status: volitelne, low ROI.

1. Nechat stávající formuláře strukturálně podobné.
2. Jen sjednotit a případně zjednodušit opakovaný error handling tam, kde je to levné.
3. Nepřepisovat všechny formuláře do nové abstrakce.

Výsledek:

1. Menší riziko regressí.
2. Nižší mentální overhead bez velkého redesignu.

## 9. Odhad snížení počtu souborů a LOC

1. Protoze plan uz neni doporuceny jako samostatny task, nema smysl drzet agresivni LOC/file-count target.
2. Realisticky oportunisticky cleanup znamena spis jednotky souboru a desitky nizke stovky LOC.
3. Hlavni prinos by byl udrzbovy, ne transformacni.

## 10. Rizika a mitigace

1. Riziko: refactor bude resit neakutni problem a spotrebuje kapacitu bez odpovidajiciho zisku.
2. Mitigace: auth menit jen opportunisticky pri navazujici praci.
3. Riziko: slouceni resolveru rozbije `GET /api/auth/session` behavior nebo heartbeat semantics.
4. Mitigace: resolver unifikaci nedelat; sdilet jen male helpery.
5. Riziko: prehnane slucovani souboru zhorsi server/client boundary.
6. Mitigace: sahat jen na jednotlive low-value soubory.

## 11. Definice hotového stavu

1. Auth flow zustava uzivatelsky stejny nebo lepsi.
2. Pokud probehne cleanup, nedela to kompromis v rozdilnem behavior server/API auth resolution.
3. Oportunisticky cleanup snizi lokalni dluh bez zavedeni nove infra vrstvy.
4. Workspace a user-devices task nad timto refaktorem dal funguji bez nutnosti soucasneho release.

## 12. Doporučené pořadí vůči ostatním taskům

1. Tento task uz neni doporucen jako samostatny refaktor.
2. Pokud se auth domena otevre v jinem tasku, dava smysl jen oportunisticky cleanup typu A3/A4.
3. Workspaces ani user-devices na nem nejsou blokovane zavisle.

## 13. Aktualni doporuceni

1. A1 a A2 se aktualne nedoporucuji.
2. A3 a A4 davat jen jako opportunisticky cleanup pri souvisejici auth praci.
3. Samostatny auth refactoring task po useEffect vlne nedava dobry pomer effort/benefit.

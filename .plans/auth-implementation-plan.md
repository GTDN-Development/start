# Auth Implementation Plan (No Workspaces)

Datum: 11. 3. 2026
Cil: sepsat implementacni plan pro znovu-vybudovani cele auth vrstvy od nuly do aktualne funkcniho stavu, ale bez workspace konceptu (jako by v aplikaci nikdy neexistoval).

## 0. Vstupni reference a baseline

1. `AUTH-IMPLEMENTATION.md`
2. `AUTH-SESSION-SYNC.md`
3. `POCKETBASE-INTEGRATION.md`
4. Aktualni kod v:
5. `src/features/auth/*`
6. `src/server/auth/*`
7. `src/server/pocketbase/pocketbase-server.ts`
8. `src/app/api/auth/*`
9. `src/app/[locale]/(application)/layout.tsx`
10. `src/app/[locale]/(auth)/(guest)/layout.tsx`
11. `src/app/[locale]/(marketing)/layout.tsx`
12. `src/features/account/*` (navazane account/security flow)

Poznamka k rozsahu: tento plan bere jako cilovy stav auth a account auth flows, ktere dnes realne funguji, ale explicitne vynechava workspace domenu, workspace routy a workspace UI prvky.

## 1. Cile a ne-cile

1. Cile:
2. PocketBase `users` kolekce jako jediny source of truth pro auth.
3. Per-request PocketBase instance na serveru (zadna sdilena globalni user instance).
4. Jednotny auth API kontrakt (`ok: true/false`, stabilni `errorCode`).
5. Kompletni flows:
6. sign-in
7. sign-up
8. sign-out
9. session read/refresh
10. verify email
11. forgot password request
12. reset password
13. request email verification
14. request email change + confirm email change
15. account profile/password/avatar/delete navazane na auth session
16. Route guarding pres `proxy.ts` + SSR fallback guard v layoutu.
17. Lokalizovane routy pres `next-intl` bez manualniho skladani URL.

18. Ne-cile:
19. Workspace membership, workspace switcher, workspace settings, workspace invites.
20. OAuth2 auth.
21. Device sessions plugin (samostatny plan).
22. 2FA backend (UI muze zustat placeholder, bez backend integrace).

## 2. Cistota bez workspaces (hard requirement)

1. Canonical aplikacni route po prihlaseni je `/overview`.
2. Chranene route prefixy pouze:
3. `/overview`
4. `/account`
5. Guest-only route redirect cil je `/overview`.
6. V `src/config/menu.ts` bude aplikacni menu bez workspace polozek:
7. `/overview`
8. `/account`
9. `UserAccountMenu` pouzije odkaz na `/overview` (ne `/w/workspace/overview`).
10. `ApplicationLayout` nebude zavadet `WorkspaceSwitcher`.
11. V `src/i18n/routing.ts` nebudou `"/w/workspace/*"` pathnames.
12. Route `"/invite/[token]"` bude mimo auth scope, pokud je ciste workspace-only.

## 3. PocketBase model a predpoklady

1. Pouziva se default PB kolekce `users`.
2. Login je email + password (`authWithPassword`).
3. Dalsi PB auth operace:
4. `requestVerification`
5. `confirmVerification`
6. `requestPasswordReset`
7. `confirmPasswordReset`
8. `requestEmailChange`
9. `confirmEmailChange`
10. `authRefresh`
11. Povinne env:
12. `NEXT_PUBLIC_PB_URL`
13. `PB_SUPERUSER_EMAIL` (jen pro typegen tooling)
14. `PB_SUPERUSER_PASSWORD` (jen pro typegen tooling)
15. Typegen soubor `src/types/pocketbase.ts` je generated-only.

## 4. Cilova modularni struktura

1. Feature contracts + client:
2. `src/features/auth/auth-contract.ts`
3. `src/features/auth/auth-schemas.ts`
4. `src/features/auth/auth-client.ts`
5. `src/features/auth/auth-routes.ts`
6. `src/features/auth/auth-proxy.ts`
7. `src/features/auth/auth-flash.ts`
8. `src/features/auth/auth-flow-token.ts`

9. Server auth:
10. `src/server/pocketbase/pocketbase-server.ts`
11. `src/server/auth/auth-service.ts`
12. `src/server/auth/auth-api-route.ts`
13. `src/server/http/request-utils.ts`

14. API route adapters:
15. `src/app/api/auth/[...all]/route.ts`
16. `src/app/api/auth/verify-email/route.ts`
17. `src/app/api/auth/reset-password/route.ts`
18. `src/app/api/auth/request-password-reset/route.ts`
19. `src/app/api/auth/request-email-verification/route.ts`
20. `src/app/api/auth/confirm-email-change/route.ts`

21. Layouty/guardy:
22. `src/proxy.ts`
23. `src/app/[locale]/(application)/layout.tsx`
24. `src/app/[locale]/(auth)/(guest)/layout.tsx`
25. `src/app/[locale]/(marketing)/layout.tsx`

26. Auth UI:
27. `src/features/auth/sign-in/*`
28. `src/features/auth/sign-up/*`
29. `src/features/auth/forgot-password/*`
30. `src/features/auth/verify-email/*`
31. `src/features/auth/reset-password/*`
32. `src/features/auth/confirm-email-change/*`

33. Navazane account auth flows:
34. `src/features/account/account-client.ts`
35. `src/server/account/account-service.ts`
36. `src/app/api/account/*`

## 5. Session a cookie model

1. Pouzivane cookies:
2. `pb_auth` (JWT + user model)
3. `pb_auth_persist` (`"1"` persistent, `"0"` session-only)

4. `createPocketBaseServerClient()`:
5. vzdy nova PB instance per request
6. `cookies()` je awaited (Next.js 16)
7. nacte `pb_auth` + `pb_auth_persist`
8. pri invalid `pb_auth` vycisti `authStore`
9. vraci metadata: `hasAuthCookie`, `hadInvalidAuthCookie`, `shouldPersistSession`

10. Export cookie helper:
11. `exportPocketBaseAuthCookies(pb, { sessionOnly })`
12. vraci `set-cookie` pro obe cookies

13. Clear helper:
14. `createClearedPocketBaseAuthCookies()`
15. vymaze `pb_auth` i `pb_auth_persist`

16. Semantika persistence:
17. sign-in: ridi se `rememberMe`
18. sign-up: implicitne persistent login (`sessionOnly: false`)
19. session refresh: respektuje `pb_auth_persist`

## 6. Auth kontrakt a schema vrstva

1. Definovat `AuthErrorCode` a payload typy v `auth-contract.ts`.
2. Udrzet stabilni response shape:
3. success: `{ ok: true, data: ... }`
4. error: `{ ok: false, errorCode: ... }`
5. Definovat schema v `auth-schemas.ts`:
6. `signInInputSchema`
7. `signUpInputSchema`
8. sdileny password schema helper
9. form schema helpery pro UI validaci
10. Pouzit `z.email()` a `z.pipe(z.email())` pattern (bez deprecated `z.string().email()`).

## 7. Server auth service implementace

1. `signInWithPassword(input)`:
2. PB `authWithPassword(email, password)`
3. namapovat session model
4. exportovat cookies dle `rememberMe`
5. mapovat chyby na `INVALID_CREDENTIALS`, `RATE_LIMITED`, `UNKNOWN_ERROR`

6. `signUpWithPassword(input)`:
7. vytvorit user record
8. best-effort `requestVerification(email)` jako safety net
9. auto-auth po vytvoreni (`authWithPassword`)
10. vratit session + cookies
11. mapovat `EMAIL_ALREADY_IN_USE`, `WEAK_PASSWORD`, `VALIDATION_ERROR`

12. `signOutServerSession()`:
13. vzdy success + clear cookies

14. `getServerAuthSession()`:
15. SSR validace session bez cookie side effectu
16. pokud authStore invalid -> `session: null`
17. pokud authStore valid -> overit user `getOne(id)`
18. na transient backend chybe vratit stale session z JWT
19. na not-found/deleted user vratit `session: null`

20. `getApiAuthSession()`:
21. API varianta s `authRefresh()`
22. pri invalid cookie/session clear cookies
23. pri success refreshnout cookies (respekt `pb_auth_persist`)
24. pri transient chybe vratit stale session bez forced clear
25. jinak fail-closed na `session: null` + clear cookie

26. Token flows:
27. `confirmEmailVerificationToken(token)`
28. `requestPasswordResetForEmail(email)` (anti-enumeration: success i pri unknown email)
29. `confirmPasswordResetToken({ token, password, confirmPassword })`
30. `requestEmailVerificationForCurrentUser()`
31. `confirmEmailChangeToken({ token, password })`

32. Internal helpery:
33. `createAuthSession(pb, usersRecord)`
34. `map*ErrorCode(...)` pro vsechny flow
35. `isTransientError(...)`
36. centralizovane logovani s formatovanim

## 8. API route vrstva

1. `src/app/api/auth/[...all]/route.ts`:
2. `GET /api/auth/session`
3. `POST /api/auth/sign-in`
4. `POST /api/auth/sign-up`
5. `POST /api/auth/sign-out`
6. POST route musi kontrolovat origin (`hasValidOrigin`).
7. Body parsing pres `parseRequestJson`.

8. Samostatne flow endpointy:
9. `POST /api/auth/verify-email`
10. `POST /api/auth/reset-password`
11. `POST /api/auth/request-password-reset`
12. `POST /api/auth/request-email-verification`
13. `POST /api/auth/confirm-email-change`

14. `createAuthApiResponse()`:
15. mapuje error code -> HTTP status
16. appenduje vsechny `set-cookie` hlavicky

17. Status mapovani:
18. `BAD_REQUEST` -> 400
19. `INVALID_CREDENTIALS` -> 401
20. `UNAUTHORIZED` -> 401
21. `EMAIL_ALREADY_IN_USE` -> 409
22. `VALIDATION_ERROR` -> 400
23. `WEAK_PASSWORD` -> 400
24. `RATE_LIMITED` -> 429
25. `NOT_FOUND` -> 404
26. `UNKNOWN_ERROR` -> 500

## 9. Client auth vrstva

1. `auth-client.ts` poskytne:
2. `signIn`
3. `signUp`
4. `signOut`
5. `useSession`
6. `verifyEmailToken`
7. `requestPasswordReset`
8. `resetPasswordWithToken`
9. `requestEmailVerification`
10. `confirmEmailChange`
11. `refreshSession`

12. Session store:
13. externi store pres `useSyncExternalStore`
14. stavy: `idle`, `loading`, `authenticated`, `unauthenticated`
15. deduplikace paralelnich session refresh requestu

16. Sync infrastruktura:
17. BroadcastChannel signaly (`session-changed`, `signed-out`)
18. visibility refetch
19. online recovery refetch
20. rate limit 5 s (`REFETCH_RATE_LIMIT_MS`)
21. lazy init pouze pri prvnim mountu `useSession()`
22. zustava dormantni, pokud `useSession()` nikde neni mounted

23. Dulezite architekturicke rozhodnuti:
24. `ApplicationLayout` a `MarketingLayout` zustanou server-driven (session pres `getServerAuthSession()`),
25. nebudou primarne napojene na `useSession()` kvuli:
26. redundantnimu klientskemu fetchi po SSR renderu,
27. riziku hydration mismatch/flicker stavu `idle -> loading`,
28. a dvojimu zdroji pravdy (server props vs client session store).

## 10. Guarding a routing

1. `auth-routes.ts`:
2. `AUTH_PROTECTED_ROUTE_PREFIXES = ["/overview", "/account"]`
3. `AUTH_REDIRECTS.unauthenticatedTo = "/sign-in"`
4. `AUTH_REDIRECTS.authenticatedTo = "/overview"`

5. `auth-proxy.ts`:
6. rychly guard dle pritomnosti `pb_auth` cookie
7. locale-aware redirect pres `routing.pathnames`

8. `proxy.ts`:
9. auth guard pred `next-intl` middleware handlingem
10. zadne `middleware.ts`, pouze `proxy.ts`

11. SSR fallback guard:
12. `(application)/layout.tsx` vola `getServerAuthSession()`
13. bez validni session redirect na `/sign-in`
14. `(auth)/(guest)/layout.tsx` pri session redirect na `/overview`

15. Marketing shell:
16. `(marketing)/layout.tsx` nacte server session a preda `viewer`
17. header/footer podle `viewer` prepnou auth CTA vs account menu

## 11. Auth UI flows a behavior

1. Sign-in (`/sign-in`):
2. submit -> `signIn`
3. success -> `router.replace("/overview")`
4. invalid credentials -> lokalizovana form error hlaska

5. Sign-up (`/sign-up`):
6. submit -> `signUp`
7. success -> `router.replace("/overview")`
8. email exists / weak password -> cileny error mapping

9. Forgot password (`/forgot-password`):
10. submit -> `requestPasswordReset(email)`
11. anti-enumeration UX: success message i pri neexistujicim emailu

12. Verify email (`/verify-email?token=...`):
13. token parse pres `parseAuthFlowToken`
14. submit -> `verifyEmailToken(token)`
15. verified + aktivni session -> `/overview`
16. verified bez session -> flash + `/sign-in`

17. Reset password (`/reset-password?token=...`):
18. submit -> `resetPasswordWithToken`
19. success -> flash `password-reset` + `/sign-in`

20. Confirm email change (`/confirm-email-change?token=...`):
21. submit -> `confirmEmailChange({ token, password })`
22. success se session -> `/overview`
23. success bez session -> `/sign-in`

24. Sign-out:
25. `useSignOut()` vola `signOut`
26. success -> redirect `/sign-in`

27. Sign-in flash toast:
28. cte `sessionStorage` flagy (`email-verified`, `password-reset`)
29. zobrazi jednorazovy toast na sign-in strance

30. Email verification banner:
31. render na zaklade `user.verified === false`
32. resend akce -> `/api/auth/request-email-verification`

## 12. Account flows navazane na auth

1. `account-service.ts` zavadi `requireCurrentUser()` nad PB authStore.
2. Pri unauthorized stavech vraci `UNAUTHORIZED` a pripadne clear cookie.

3. Profile endpointy:
4. `PATCH /api/account/profile` (display name)
5. `POST /api/account/avatar` (upload avatar)
6. `DELETE /api/account/avatar` (remove avatar)

7. Security endpointy:
8. `POST /api/account/password` (change password)
9. `POST /api/account/email-change/request` (request email change)
10. `POST /api/account/delete` (delete account)

11. Client account API:
12. `src/features/account/account-client.ts` stejne response schema jako auth client.
13. UI mutace propagovat pres `AccountProfileContext` (name/avatar/verified state).

## 13. Security a stabilita pravidla

1. Zadna globalni PB instance pro bezne user requesty.
2. Vsechny server cally na PB pres no-store fetch (`beforeSend` override).
3. Origin check na vsech mutacnich auth/account API routech.
4. Fail-closed behavior pro invalid auth tokeny.
5. Cookie clear pri stale/invalid auth situacich.
6. `signIn` pri beznych/chvili trvajicich chybach nema preventivne mazat auth cookie.
7. Cookie clear pri sign-in chybe pouze pokud request zacinal s prokazatelne invalid cookie (`hadInvalidAuthCookie`).
8. Transient PB outage:
9. session endpoint vraci stale session z JWT (kdyz to je bezpecne mozne)
10. nezpusobovat okamzite forced logout pri kratkem vypadku PB

## 14. Implementacni etapy (from scratch)

### Etapa A: Foundation

1. Vytvorit `auth-contract.ts` + `auth-schemas.ts`.
2. Vytvorit `pocketbase-server.ts` s cookie import/export helpery.
3. Overit env dokumentaci a `NEXT_PUBLIC_PB_URL`.

### Etapa B: Server auth core

1. Implementovat `auth-service.ts` (vsechny metody z kapitoly 7).
2. Implementovat `auth-api-route.ts` helper.
3. Implementovat `request-utils.ts`.

### Etapa C: API route adapters

1. Implementovat `[...all]/route.ts`.
2. Implementovat vsechny token-flow auth endpointy.
3. Otestovat `set-cookie` propagation.

### Etapa D: Client auth + session store

1. Implementovat `auth-client.ts`.
2. Implementovat `auth-routes.ts`, `auth-proxy.ts`, `proxy.ts`.
3. Implementovat `auth-flash.ts` + `auth-flow-token.ts`.

### Etapa E: Layout guardy + UI flows

1. Implementovat `(application)/(guest)/(marketing)` layout behavior.
2. Napojit sign-in/sign-up/forgot/reset/verify/confirm forms.
3. Napojit `useSignOut`.

### Etapa F: Account navazane flow

1. Implementovat `account-service.ts`.
2. Implementovat `api/account/*` route handlery.
3. Implementovat `account-client.ts` a settings komponenty.

### Etapa G: No-workspace hardening

1. Odstranit workspace vazby z menu, user menu, app shell a routing configu.
2. Overit, ze vsechny auth redirecty konci na `/overview` nebo `/sign-in`.
3. Overit, ze v auth domene nezustal zadny `/w/*` odkaz.

### Etapa H: Docs a QA signoff

1. Aktualizovat `AUTH-IMPLEMENTATION.md`.
2. Aktualizovat `AUTH-SESSION-SYNC.md` podle realneho consumer stavu.
3. Aktualizovat README auth status sekci.

## 15. Test plan (must-pass)

1. Sign-up success:
2. user se vytvori
3. session je aktivni
4. redirect na `/overview`

5. Sign-in success:
6. rememberMe=true -> persistent cookie
7. rememberMe=false -> session cookie

8. Sign-in fail:
9. invalid credentials -> spravny error code + bez crash

10. Sign-out:
11. clear obou cookies
12. redirect `/sign-in`

13. Session endpoint:
14. valid token -> refreshed session + cookie sync
15. invalid token -> session null + cleared cookies
16. transient PB fail -> stale session fallback

17. Verify email:
18. valid token se session -> `/overview`
19. valid token bez session -> flash + `/sign-in`
20. invalid token -> BAD_REQUEST UX

21. Forgot/reset password:
22. request reset anti-enumeration
23. valid reset token -> password reset + forced sign-out
24. invalid token -> BAD_REQUEST UX

25. Request email verification:
26. authenticated user -> sent true
27. unauthorized -> UNAUTHORIZED + clear cookie dle stavu

28. Email change:
29. request email change -> sent true
30. confirm email change valid token+password -> email updated, session refresh

31. Account profile updates:
32. display name patch funguje
33. avatar upload/remove funguje
34. unauthorized account requesty failuji konzistentne

35. Account password change:
36. wrong old password -> INVALID_CREDENTIALS
37. weak new password -> WEAK_PASSWORD
38. success -> passwordUpdated true

39. Delete account:
40. valid password -> account smazan + clear cookies + redirect sign-in

41. Guard matrix:
42. unauth request na `/overview` a `/account/*` redirect `/sign-in`
43. authenticated request na guest routes redirect `/overview`
44. locale varianty (`/cs/*`, `/en/*`) maji spravne redirecty

45. Cross-tab/session sync:
46. pokud je mounted `useSession()`, funguje BroadcastChannel sync
47. pokud mounted neni, aplikace funguje server-driven bez regresi

## 16. Definition of Done

1. Vsechny endpointy z kapitol 8 a 12 vraci stabilni auth response kontrakt.
2. Zadna workspace route ani workspace komponenta neni nutna pro auth tok.
3. Proxy + SSR guard chovani odpovida matici v kapitole 15.
4. Lokalne overene manualni flows z kapitoly 15 jsou zelene.
5. Dokumentace je aktualni a odpovida realnemu kodu.

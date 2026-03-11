# Test Implementation Plan (Gold Standard, Cost/Value)

Datum: 11. 3. 2026
Cil: postupne zavest testy do projektu tak, aby byl pokryty kriticky business behavior, API kontrakty a nejdulezitejsi user flows, ale bez pretestovani celeho UI.

## 0. Baseline a vstupni fakta

1. Projekt je Next.js 16 + React 19 + TypeScript.
2. Aktulane neni nastaveny test runner ani test skripty v `package.json`.
3. Kodova baza ma silnou serverovou vrstvu:
4. `src/server/auth/auth-service.ts` (789 radku)
5. `src/server/account/account-service.ts` (571 radku)
6. API vrstva obsahuje 14 route handleru v `src/app/api/*`.
7. V projektu je vice externich zavislosti, ktere je potreba v testech izolovat:
8. PocketBase
9. Cloudflare Turnstile
10. Nodemailer
11. next-intl routing + localized paths

## 1. Strategicke principy

1. Test pyramid:
2. 70 % unit testy (pure funkce + mapovani chyb + helpery)
3. 20 % integration testy (route handlery + service adaptery)
4. 10 % E2E smoke testy (critical user journeys)
5. Fokus na business riziko, ne na vizualni snapshoty.
6. Kazdy novy endpoint nebo server service musi mit test ve stejnem PR.
7. Testy musi byt deterministicke a bez realnych volani na PocketBase/Turnstile/email.

## 2. Doporuceny stack a balicky

1. Unit + integration:
2. `vitest`
3. `@vitest/coverage-v8`
4. `jsdom` (pro UI testy)
5. `@testing-library/react`
6. `@testing-library/user-event`
7. `@testing-library/jest-dom`
8. Mocking:
9. Primarne `vi.mock` a `vi.fn`
10. `msw` pro pohodlne mockovani HTTP ve frontend testech
11. E2E:
12. `@playwright/test`

Poznamka k volbe:
1. Vitest je v tomto stacku levnejsi na setup i beh nez Jest.
2. Playwright ma lepsi DX a stabilitu nez Cypress pro Next.js App Router flows.
3. Neni potreba zavadet dalsi test framework.

## 3. Rozsah testovani

### 3.1 P0 (kriticke, prvni vlna)

1. Server auth/account business logika.
2. API route kontrakty (status, validace, response shape).
3. Bezpecnostni guardy a request parsing/origin check.
4. Turnstile verification helper.
5. Locale redirect logika v email-link route.

### 3.2 P1 (druha vlna)

1. Auth schemas a utility funkce.
2. Cookie consent serialization/parsing.
3. Vybrane kriticke formulare (sign-in/sign-up/reset-password).
4. i18n parity test mezi `messages/en.json` a `messages/cs.json`.

### 3.3 P2 (treti vlna)

1. E2E smoke suite (4-6 scenaru).
2. Pouze happy path + nejdrazsi failure path na flow.

### 3.4 Explicitne mimo rozsah

1. Snapshot testy celeho UI.
2. Testovani `src/components/ui/*` primitiv bez business logiky.
3. Testovani statickeho marketing copy.

## 4. Struktura souboru a naming

1. Unit/integration testy colocate k souborum:
2. `src/server/auth/auth-service.test.ts`
3. `src/server/account/account-service.test.ts`
4. `src/app/api/marketing/contact/route.test.ts`
5. Frontend component testy:
6. `src/features/auth/sign-in/sign-in-form.test.tsx`
7. E2E testy v root slozce:
8. `e2e/auth-smoke.spec.ts`
9. `e2e/marketing-forms.spec.ts`
10. Spolecne test utility:
11. `test/setup/vitest.setup.ts`
12. `test/setup/render-with-intl.tsx`
13. `test/setup/msw-server.ts`

## 5. Konfigurace a skripty

1. Pridat konfiguracni soubory:
2. `vitest.config.ts`
3. `playwright.config.ts`
4. `test/setup/vitest.setup.ts`
5. Upravit `package.json` skripty:
6. `test`: `vitest`
7. `test:run`: `vitest run`
8. `test:coverage`: `vitest run --coverage`
9. `test:e2e`: `playwright test`
10. `test:e2e:ui`: `playwright test --ui`
11. `test:ci`: `npm run lint && npm run test:coverage && npm run test:e2e`

## 6. Faze implementace

## 6.1 Faze A: Foundation setup (0.5-1 den)

1. Nainstalovat test dependencies.
2. Nastavit `vitest.config.ts`:
3. project `node` pro server testy
4. project `jsdom` pro UI testy
5. alias `@/*` podle `tsconfig.json`
6. `coverage provider: v8`
7. Nastavit `vitest.setup.ts`:
8. `@testing-library/jest-dom`
9. cleanup hooks
10. mock `window.matchMedia` (pokud potreba)
11. Nastavit `playwright.config.ts`:
12. webServer (`npm run dev` nebo `npm run start` pro CI)
13. browser matrix: Chromium (MVP), volitelne Firefox/WebKit pozdeji
14. retry v CI = 1

Acceptance criteria:
1. `npm run test:run` probiha bez erroru.
2. `npm run test:e2e -- --list` vypise suite.

## 6.2 Faze B: P0 server unit tests (2-3 dny)

### B1: Auth service

Soubor: `src/server/auth/auth-service.test.ts`

1. `signInWithPassword`:
2. success vraci session + cookies
3. invalid credentials mapuji na `INVALID_CREDENTIALS`
4. rate limit mapuje na `RATE_LIMITED`
5. `hadInvalidAuthCookie` vraci clear cookies i pri erroru
6. `signUpWithPassword`:
7. `EMAIL_ALREADY_IN_USE` mapovani
8. `WEAK_PASSWORD` mapovani
9. `requestVerification` fail je best-effort a nezhodi flow
10. `requestPasswordResetForEmail`:
11. anti-enumeration vraci success i pro 400/404
12. 429 vraci `RATE_LIMITED`
13. `getServerAuthSession`:
14. no session -> `session: null`
15. transient PB chyba -> stale session fallback
16. 404 user not found -> `session: null`
17. `getApiAuthSession`:
18. invalid cookie -> clear cookies
19. success refreshuje cookies dle persistence
20. transient chyba drzi stale session

### B2: Account service

Soubor: `src/server/account/account-service.test.ts`

1. `updateCurrentUserProfileName` validace max delky.
2. `updateCurrentUserAvatar`:
3. reject non-image
4. reject soubor > 1 MB
5. success vraci updated profile
6. `updateCurrentUserPassword`:
7. invalid current password -> `INVALID_CREDENTIALS`
8. weak password -> `WEAK_PASSWORD`
9. unauthorized chyby vraci clear cookies
10. `deleteCurrentUserAccountWithPassword`:
11. prazdne heslo -> `BAD_REQUEST`
12. verify hesla fail -> `INVALID_CREDENTIALS`
13. uspesne smazani -> clear cookies

### B3: Supporting server helpers

1. `src/server/auth/auth-api-route.test.ts`:
2. mapovani status kodu pro vsechny `AuthErrorCode`
3. append vice `set-cookie` hodnot
4. `src/server/http/request-utils.test.ts`:
5. `hasValidOrigin` true/false varianty
6. `parseRequestJson` valid/invalid json
7. `src/server/captcha/turnstile.test.ts`:
8. missing secret
9. missing token
10. token too long
11. success/failure mapovani error codes
12. timeout branch
13. `getClientIP` precedence headeru
14. `src/server/pocketbase/pocketbase-server.test.ts`:
15. export cookie variant session/persistent
16. clear cookies
17. throw pri missing `NEXT_PUBLIC_PB_URL`

Acceptance criteria:
1. Pokryti `src/server/*` min. 80 % lines, 80 % branches.
2. Vsechny P0 server testy stabilni (zadny random/flicker).

## 6.3 Faze C: P0 API integration tests (1.5-2 dny)

Pristup:
1. Volat exportovane `GET/POST/PATCH/DELETE` funkce route handleru primo.
2. Mockovat zavisle service funkce (`vi.mock`) a overovat HTTP kontrakt.

Cilove route testy:
1. `src/app/api/auth/[...all]/route.test.ts`
2. `src/app/api/account/profile/route.test.ts`
3. `src/app/api/account/password/route.test.ts`
4. `src/app/api/account/avatar/route.test.ts`
5. `src/app/api/account/delete/route.test.ts`
6. `src/app/api/account/email-change/request/route.test.ts`
7. `src/app/api/auth/request-password-reset/route.test.ts`
8. `src/app/api/auth/reset-password/route.test.ts`
9. `src/app/api/auth/verify-email/route.test.ts`
10. `src/app/api/auth/request-email-verification/route.test.ts`
11. `src/app/api/auth/confirm-email-change/route.test.ts`
12. `src/app/api/marketing/contact/route.test.ts`
13. `src/app/api/marketing/newsletter/route.test.ts`
14. `src/app/api/pocketbase/email-link/route.test.ts`

Minimalni scenare na route:
1. invalid origin -> 400 (kde plati)
2. invalid body -> 400
3. success path -> 200
4. service error mapping -> odpovidajici status
5. `email-link` action/token/locale fallback kombinace

Acceptance criteria:
1. Pokryti `src/app/api/*` min. 75 % lines, 70 % branches.
2. Route contract testy blokuji regresi status kodu.

## 6.4 Faze D: P1 utility + vybrane UI testy (1.5-2 dny)

### D1: Pure utility testy

1. `src/features/auth/auth-schemas.test.ts`
2. `src/features/auth/email-verification.test.ts`
3. `src/features/cookies/cookie-consent.test.ts`
4. `src/lib/utils.test.ts`
5. `src/lib/device-environment.test.ts` (minimalne `detectDeviceType`)
6. `src/features/auth/auth-proxy.test.ts` (route guard + locale matching)
7. `src/features/auth/auth-flow-token.test.ts`

### D2: UI component testy (jen critical)

1. `src/features/auth/sign-in/sign-in-form.test.tsx`
2. `src/features/auth/sign-up/sign-up-form.test.tsx`
3. `src/features/auth/reset-password/reset-password-form.test.tsx`

Minimalni UI scenare:
1. validacni error pri invalid input
2. submit success/failure branch
3. spravna redirect akce (mock `useRouter`)

Acceptance criteria:
1. Frontend testy bez flaky timeoutu.
2. Maximalni runtime unit/integration suite do cca 60-90 sekund na lokalu.

## 6.5 Faze E: P2 E2E smoke suite (1-1.5 dne)

E2E soubory:
1. `e2e/auth-guard-and-sign-in.spec.ts`
2. `e2e/password-reset.spec.ts`
3. `e2e/marketing-forms.spec.ts`
4. `e2e/cookie-consent.spec.ts`

Smoke scenare:
1. guest pristup na protected route -> redirect na sign-in
2. sign-in form validation + error branch
3. reset-password flow s token query
4. newsletter/contact submit success/failure branch
5. cookie consent accept/reject a persistence po reloadu

Test data/mocking:
1. Preferovat API mock pres Playwright route intercept.
2. Nezaviset na realnem PocketBase ani realnem Turnstile.

Acceptance criteria:
1. E2E smoke sada stabilni lokalne i v CI.
2. Runtime E2E smoke do cca 3-6 minut.

## 6.6 Faze F: CI integrace a quality gates (0.5-1 den)

1. Pridat CI workflow:
2. `npm ci`
3. `npm run lint`
4. `npm run test:coverage`
5. `npx playwright install --with-deps chromium`
6. `npm run test:e2e`
7. Upload Playwright report artifact pri failu.

Quality gates:
1. Block merge pri failu unit/integration/E2E smoke.
2. Coverage thresholdy v prve iteraci:
3. global: 60 % lines / 55 % branches
4. `src/server/*`: 80 % lines / 80 % branches
5. `src/app/api/*`: 75 % lines / 70 % branches

Poznamka:
1. Thresholdy jsou startovni.
2. Zvysovat po stabilizaci suite, ne hned v prvnim PR.

## 7. Detailni backlog podle priority

### 7.1 Must-have backlog (MVP)

1. Setup Vitest + Playwright.
2. Testy pro `auth-service`.
3. Testy pro `account-service`.
4. Testy pro `auth-api-route`, `request-utils`, `turnstile`.
5. Integration testy pro vsechny auth/account route handlery.
6. `email-link` route test.
7. E2E smoke: auth redirect + sign-in + cookie consent.

### 7.2 Should-have backlog

1. Marketing route integration testy (`contact`, `newsletter`).
2. Utility testy (`cookie-consent`, `auth-schemas`, `email-verification`).
3. UI testy sign-in/sign-up/reset-password.

### 7.3 Could-have backlog

1. Rozsireni E2E na verify-email/confirm-email-change.
2. Rozsireni coverage na `metadata` helpery.
3. Dalsi browsery v E2E matrix (Firefox/WebKit).

## 8. Rizika a mitigace

1. Riziko: flaky E2E kvuli zavislosti na externich sluzbach.
2. Mitigace: striktni mockovani API a third-party endpointu.
3. Riziko: slozite mockovani PocketBase klienta.
4. Mitigace: centralni test helper pro fake PB client + jednotny factory.
5. Riziko: pomaly test runtime.
6. Mitigace: oddelit heavy E2E od unit/integration, omezit smoke suite.
7. Riziko: vysoka udrzba UI testu.
8. Mitigace: testovat jen business interaction a submit outcome, ne markup detaily.

## 9. Definition of Done

1. V projektu je nastavena test infrastruktura (`vitest`, `playwright`, setup files, skripty).
2. P0 test backlog je implementovan a zelene prochazi.
3. E2E smoke sada obsahuje min. 4 kriticke scenare.
4. CI pipeline blokuje mergovani pri failu testu.
5. Pokryti dosahuje minimalnich prahu definovanych v sekci 6.6.
6. Dokumentace v `README.md` obsahuje sekci jak testy spoustet lokalne.

## 10. Doporuceny rollout po PR

1. PR 1: Foundation setup + 2-3 ukazkove server testy.
2. PR 2: Auth service + auth API integration testy.
3. PR 3: Account service + account API integration testy.
4. PR 4: Marketing route testy + utility tests.
5. PR 5: E2E smoke + CI gates.

## 11. Odhad pracnosti

1. Faze A: 0.5-1 den
2. Faze B: 2-3 dny
3. Faze C: 1.5-2 dny
4. Faze D: 1.5-2 dny
5. Faze E: 1-1.5 dne
6. Faze F: 0.5-1 den
7. Celkem: cca 7-10 pracovnich dnu (podle rozsahu UI/E2E testu)

## 12. Prvni konkretni deliverable po schvaleni planu

1. Vytvorit test toolchain a skripty.
2. Implementovat prvnich 10-15 P0 testu:
3. `auth-service` top risk vetve
4. `account-service` top risk vetve
5. `auth-api-route` status mapping
6. `request-utils` + `turnstile`
7. `auth/[...all]` route integration scenare

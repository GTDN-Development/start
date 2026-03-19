# OAuth2 Implementation Plan

Datum: 19. 3. 2026
Predpoklad: auth-implementation-plan.md a phase-2-auth-server-actions.md jsou dokonceny a v produkci.

Zdroje (vyhradne oficiální dokumentace):

- PocketBase OAuth2: https://pocketbase.io/docs/authentication/#authenticate-with-oauth2
- Next.js Authentication: https://nextjs.org/docs/pages/guides/authentication
- Google Identity Platform: https://developers.google.com/identity/protocols/oauth2/web-server
- Apple Sign in with Apple: https://developer.apple.com/documentation/sign_in_with_apple
- Meta / Facebook Login: https://developers.facebook.com/docs/facebook-login/web

## 1. Cil

- Pridat social login providery Google, Apple a Facebook jako aditivni rozsireni existujiciho auth flow.
- Vyuzit nativni PocketBase SDK metodu authWithOAuth2 — zadna manualni implementace code exchange.
- Zachovat jednotny AuthResponse<T> kontrakt shodny s existujicim email/password flow.
- Zachovat cookie model (auth cookie z `authConfig.cookies.authCookieName`, persist cookie z `authConfig.cookies.persistCookieName`, device session cookie z `DEVICE_SESSION_COOKIE_NAME`) a httpOnly bezpecnostni nastaveni.
- Zachovat device session integraci — OAuth login musi registrovat device session stejne jako email/password login.
- Zadny existujici flow se nemodifikuje — pouze rozsiruje.

## 2. Ne-cile

- Nativni mobilni OAuth (iOS/Android SDK) — pouze web popup flow.
- Manualni PKCE implementace — PocketBase JS SDK zajistuje automaticky.
- Manualni state parametr — PocketBase JS SDK generuje a overuje automaticky.
- Odlinkovani provideru z uctu (Account Security Settings) — samostatny plan.
- 2FA po OAuth2 loginu — bez backend integrace v tomto planu.
- Workspace membership pri prvnim OAuth2 loginu.

## 3. Jak PocketBase OAuth2 funguje (dle oficiální dokumentace)

Dle https://pocketbase.io/docs/authentication/#authenticate-with-oauth2:

- pb.collection("users").authWithOAuth2({ provider }) — spusti se vyhradne na klientu (browser).
- SDK automaticky otevre popup s OAuth URL vcetne automaticky generovanych state a code_challenge parametru.
- PocketBase server obsluhuje celý code exchange s providerem — klient nikdy nevidi access_token providera.
- Endpoint pro navrat: {PB_URL}/api/oauth2-redirect — PocketBase zpracuje code a vrati do authStore.
- Account linking: pokud uzivatel se stejnym emailem jiz existuje, PocketBase jej automaticky propoji pres externalAuths zaznam. Zadna extra logika na aplikacni vrstve.
- Novy uzivatel: PocketBase vytvoří novy zaznam v users kolekci.
- Vysledkem je pb.authStore.token a pb.authStore.model — stejny tvar jako po authWithPassword.

Dle https://nextjs.org/docs/pages/guides/authentication:

- Session stav se spravuje pres httpOnly cookies nastavovanych Server Actions.
- Klient preda token serveru, ktery jej vzdy validuje a teprve pote nastavi cookie.

Bezpecnostni invariant (konzistentni s .rules/pocketbase-integration.md):

- syncOAuth2SessionAction musi provest serverovou validaci pres pb.authRefresh() — nikdy neduverat raw klientskemu tokenu.
- Zadne OAuth credentials (Client Secret, Apple Private Key) nesmi byt v NEXT_PUBLIC_* env promennych.

## 4. Pre-requisites — konzolove konfigurace

### 4.1 Google Cloud Console

Dle https://developers.google.com/identity/protocols/oauth2/web-server:

- Google Cloud Console → projekt → APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID, typ Web application.
- Authorized JavaScript origins:
  - `https://yourdomain.com` (production)
  - `http://localhost:8090` (lokalni PocketBase pro vyvoj)
- Authorized redirect URIs:
  - `https://pb.yourdomain.com/api/oauth2-redirect`
  - `http://localhost:8090/api/oauth2-redirect`
- Ulozit Client ID (`*.apps.googleusercontent.com`) a Client Secret.
- OAuth consent screen: External; App name, Privacy Policy URL, Homepage URL.
- Scopes: `openid`, `email`, `profile` — zakladni, nevyzaduji Google OAuth verification.
- Pred production nasazenim: projit Google OAuth verification (pokud rozsireny scope).

### 4.2 Apple Developer Portal

Dle https://developer.apple.com/documentation/sign_in_with_apple:

Apple vyzaduje vice konfiguracnich objektu nez ostatni provideři:

1. **App ID**: Identifiers → New Identifier → App IDs; Bundle ID: `com.yourdomain.app`; Capability: Sign in with Apple — Enabled. Pozamenat si Team ID (10 znaku, pravy horni roh uctu).
2. **Services ID** (toto bude Client ID pro PocketBase): Identifiers → Services IDs; Identifier: `com.yourdomain.web`; Enable Sign in with Apple; Configure:
   - Primary App ID: App ID z kroku 1
   - Domains: `pb.yourdomain.com` (bez protokolu)
   - Return URLs: `https://pb.yourdomain.com/api/oauth2-redirect`
3. **Private Key**: Keys → New Key; Enable Sign in with Apple; priradit App ID. Stahnout `.p8` soubor (lze stahnout pouze jednou). Pozamenat si Key ID (10 znaku).

Bezpecne ulozit: Team ID, Client ID (`com.yourdomain.web`), Key ID, obsah `.p8` souboru.

Poznamka: Apple nevystavuje Client Secret klasicky. PocketBase generuje Client Secret dynamicky jako JWT podepsany private key — viz https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens. Proto Admin UI ocekava Team ID, Key ID a Private Key — nikoli hotovy Client Secret.

### 4.3 Meta for Developers (Facebook)

Dle https://developers.facebook.com/docs/facebook-login/web:

- Meta for Developers → My Apps → Create App → Consumer type.
- App Dashboard → Add Product → Facebook Login → Web.
- Valid OAuth Redirect URIs:
  - `https://pb.yourdomain.com/api/oauth2-redirect`
  - `http://localhost:8090/api/oauth2-redirect` (pouze Development mode)
- Settings → Basic: App ID, App Secret (viditelny po potvrzeni hesla), App Domains: `yourdomain.com`, Privacy Policy URL, Terms of Service URL, Data Deletion Instructions URL.
- Facebook Login → Settings: Client OAuth Login: ON; Web OAuth Login: ON; Enforce HTTPS: ON; Embedded Browser OAuth Login: OFF.
- Scopes: `email`, `public_profile` — zakladni, nevyzaduji Meta App Review.
- Pro produkci: prepnout App Mode z Development na Live.

## 5. PocketBase Admin UI konfigurace

Navigace: `/_/` → Collections → users → Settings → Auth → sekce OAuth2 providers.
Vyzaduje PocketBase v0.22+ (projekt pouziva `pocketbase@^0.26.8` — splneno).

### 5.1 Google

| Pole | Hodnota |
|---|---|
| Enabled | ON |
| Client ID | `*.apps.googleusercontent.com` |
| Client Secret | hodnota z Google Cloud Console |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect` — musi shodovat s Google Console |

### 5.2 Apple

| Pole | Hodnota |
|---|---|
| Enabled | ON |
| Client ID | `com.yourdomain.web` (Services ID) |
| Client Secret | ponechat prazdne — PocketBase generuje dynamicky |
| Team ID | 10-znakovy kod z Apple Developer uctu |
| Key ID | 10-znakovy kod z Apple Developer Portal |
| Private Key | obsah `.p8` souboru vcetne `-----BEGIN PRIVATE KEY-----` hlavicky |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect` |

### 5.3 Facebook

| Pole | Hodnota |
|---|---|
| Enabled | ON |
| Client ID | App ID z Meta Dashboard |
| Client Secret | App Secret z Meta Dashboard |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect` |

### 5.4 Collection pravidla

- `email` field v users collection: Unique constraint (default — overit).
- Auth rule / createRule: nesmi vylucovat OAuth2-created zaznamy (nemaji password).

## 6. Architektura flow

```
[Klient (Browser)]           [Next.js Server Action]      [PocketBase]        [OAuth Provider]
      |                               |                         |                      |
      |-- onClick "Sign in" (user gesture, sync)
      |
      |-- authWithOAuth2({ provider }) --- PocketBase JS SDK
      |          |                                             |                      |
      |          |--- popup otevren ---------------------------------> redirect na provider
      |          |                                             |                      |
      |          |                                             |<-- /api/oauth2-redirect (code)
      |          |                                             |-- code exchange ----->|
      |          |                                             |<-- access_token + id_token
      |          |                                             |
      |          |                                       Account linking:
      |          |                                       - existujici email -> propojit
      |          |                                       - novy email -> vytvorit uzivatele
      |          |                                             |
      |<-- pb.authStore.token + model (promise resolved)
      |
      |-- syncOAuth2SessionAction({ token, recordId }) ------> |
      |                               |-- new PocketBase (cista instance, bez cookies)
      |                               |-- pb.authStore.save(token, { id: recordId })
      |                               |-- pb.collection("users").authRefresh() (serverova validace)
      |                               |<-- cerstvy token + record
      |                               |-- createAuthSession(pb, record)
      |                               |-- generateDeviceSessionCookie(rememberMe)
      |                               |-- registerOrRefreshDeviceSession(...)
      |                               |-- exportPocketBaseAuthCookies(pb, ...) + deviceSessionCookie
      |                               |-- return ServerAuthResponse<AuthSessionPayload>
      |<-- AuthResponse<AuthSessionPayload> ok:true
      |
      |-- setSessionState({ status: "authenticated", session })
      |-- broadcastSessionChanged() (BroadcastChannel)
      |-- router.replace("/overview")
```

Klicove bezpecnostni body:

- authWithOAuth2() bezi vyhradne na klientu (PocketBase JS SDK).
- PocketBase server obsluhuje code exchange — klient nikdy nevidi OAuth access_token.
- PKCE a state spravuje PocketBase JS SDK automaticky.
- syncOAuth2SessionAction vzdy provede pb.authRefresh() jako serverovou validaci.
- Device session se registruje na serveru — bez ni by nasledny request (getServerAuthSession / getApiAuthSession) invalidoval session.
- Turnstile se u OAuth nepouziva — autentizace probehla pres providera, ktery ma vlastni anti-abuse mechanismy.

## 7. Rozsireni server vrstvy

### 7.1 auth-contract.ts — Rozsireni AuthErrorCode

Soubor: `src/features/auth/auth-contract.ts`

Pridat do union typu AuthErrorCode:

- `"OAUTH2_PROVIDER_ERROR"` — provider vraci chybu nebo uzivatel odmitl consent / zavrel popup.
- `"OAUTH2_EMAIL_MISSING"` — provider neposkytl email (Apple bez svoleni ke sdileni).

Poznamka: `AuthClient` typ (auth-contract.ts) se nerozsiruje — `signInWithOAuth2` neni soucasti `AuthClient` rozhrani, protoze vyzaduje browser-only PocketBase SDK (popup). Exportuje se jako standalone funkce z auth-client.ts.

### 7.2 auth-service.ts — Nova metoda syncOAuth2Session

Soubor: `src/server/auth/auth-service.ts`

Vstup: `{ token: string; recordId: string; rememberMe?: boolean }`

- `token` — JWT z klientskeho `pb.authStore.token` po uspesnem `authWithOAuth2`.
- `recordId` — ID uzivatele z klientskeho `pb.authStore.record.id`.
- `rememberMe` — implicitne `true` pro OAuth (viz sekce 10.5).

Sekvence:

1. Vytvorit cistou PocketBase instanci — **nepouzivat `createPocketBaseServerClient()`**, protoze ta nacita existujici auth cookie z requestu. Pro OAuth sync potrebujeme cistou instanci, do ktere vlozime klientsky token. Pouzit sdileny `getPocketBaseUrl()` (nebo novou helper funkci exportovanou z pocketbase-server.ts) pro konzistentni URL. Nastavit `pb.autoCancellation(false)`.
2. Nacist token do authStore: `pb.authStore.save(token, { id: recordId })`.
3. Serverova validace: `const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>()` — pokud selze → UNAUTHORIZED. Toto zaroven obnovi authStore s cerstvym tokenem a record.
4. Overit ze record je validni: `if (!isUsersRecord(refreshedAuth.record))` → UNAUTHORIZED.
5. Sestavit AuthSession: `const session = createAuthSession(pb, refreshedAuth.record)` — pouziva existujici private helper (auth-service.ts:663). Pokud vrati `null` → UNKNOWN_ERROR.
6. Registrovat device session (stejny vzor jako `signInWithPassword`, auth-service.ts:75–92):
   ```
   const rememberMe = input.rememberMe ?? true;
   const { token: deviceSessionToken, setCookie: deviceSessionCookie } =
     generateDeviceSessionCookie(rememberMe);

   try {
     const requestHeaders = await headers();
     await registerOrRefreshDeviceSession({
       pb,
       userId: session.user.id,
       sessionToken: deviceSessionToken,
       rememberMe,
       requestHeaders,
     });
   } catch (error) {
     console.warn(
       "[auth-service] syncOAuth2Session: device session registration failed, continuing",
       formatServiceError(error)
     );
   }
   ```
   Poznamka: device session registrace je non-blocking (try/catch) — selhani nezpusobi selhani celeho loginu, konzistentne s email/password flow.
7. Sestavit cookies: `[...exportPocketBaseAuthCookies(pb, { sessionOnly: !rememberMe }), deviceSessionCookie]`.
   - `exportPocketBaseAuthCookies` (pocketbase-server.ts:51–64) vraci `string[]` obsahujici auth cookie + persist cookie.
   - Device session cookie se prida jako treti polozka.
8. Vraci `ServerAuthResponse<AuthSessionPayload>`:
   ```
   return {
     ok: true,
     data: { session },
     setCookie: [...exportPocketBaseAuthCookies(pb, { sessionOnly: !rememberMe }), deviceSessionCookie],
   };
   ```
   - Navratovy typ je `ServerAuthResponse<AuthSessionPayload>` (ne `ServerAuthResponse<AuthSession>`), konzistentne s `signInWithPassword`.
   - `AuthSessionPayload = { session: AuthSession | null }`.

Mapovani chyb:

- authRefresh selze (401/403) → `{ ok: false, errorCode: "UNAUTHORIZED" }`
- record neni validni UsersRecord → `{ ok: false, errorCode: "UNAUTHORIZED" }`
- Transient error (status 0 nebo ≥500) → `{ ok: false, errorCode: "UNKNOWN_ERROR" }` (pouzit existujici `isTransientError` helper)
- Jina ClientResponseError → `{ ok: false, errorCode: "UNKNOWN_ERROR" }`, logovat pres `logAuthServiceError`

### 7.3 auth-actions.ts — Nova Server Action syncOAuth2SessionAction

Soubor: `src/features/auth/actions/auth-actions.ts`

Dle `.rules/server-actions-guideline.md` — Server Action je tenky adapter: validace → domain logika → uniformni response.

- `"use server"` direktiva jiz existuje v souboru.
- Vstupni Zod schema:
  ```
  const syncOAuth2SessionInputSchema = z.object({
    token: z.string().min(1),
    recordId: z.string().min(1),
    rememberMe: z.boolean().optional(),
  });
  ```
- Validace vstupu → pri selhani vraci `createBadRequestResponse<AuthSessionPayload>()` (existujici helper v souboru).
- Volat `syncOAuth2Session(parsedInput.data)` z auth-service.
- Aplikovat cookies pres existujici `finalizeAuthAction(response)` z `src/server/auth/finalize-auth-action.ts`.
  - `finalizeAuthAction` vola `applyServerAuthCookies(response.setCookie)` z `src/server/auth/auth-cookies.ts`, ktera parsuje Set-Cookie headery a aplikuje je pres Next.js `cookies()` API.
  - Pote vola `toAuthApiResponse(response)` ktery stripne `setCookie` a vraci cisty `AuthResponse<T>`.
- Vraci `Promise<AuthResponse<AuthSessionPayload>>`.
- Turnstile se nevyzaduje — OAuth flow je chraneny providerem.

## 8. Rozsireni client vrstvy

### 8.1 auth-client.ts — Nova funkce signInWithOAuth2

Soubor: `src/features/auth/auth-client.ts`

Dle https://pocketbase.io/docs/authentication/#authenticate-with-oauth2:

Novy typ (exportovany z auth-client.ts):

```
export type OAuthProvider = "google" | "apple" | "facebook";
```

Nova exportovana funkce:

```
export async function signInWithOAuth2(
  provider: OAuthProvider,
  options?: { rememberMe?: boolean }
): Promise<SignInResponse>
```

Poznamka: navratovy typ je `SignInResponse` (= `AuthResponse<AuthSessionPayload>`), konzistentne s existujici `signIn()` funkci.

Sekvence:

1. Vytvorit docasnou PocketBase instanci pro popup flow: `const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)`. Tato instance se pouzije jen pro `authWithOAuth2` a pak se zahodi.
2. Volat `pb.collection("users").authWithOAuth2({ provider })` — musi byt primo v onClick handleru (synchronne, bez predchazejicich await volani) — jinak prohlizece blokuji popup.
3. Cekani na popup vysledek (promise).
4. Popup zavre bez loginu → zachytit error → vratit `{ ok: false, errorCode: "OAUTH2_PROVIDER_ERROR" }`.
5. Uspech → volat `syncOAuth2SessionAction({ token: pb.authStore.token, recordId: pb.authStore.record.id, rememberMe: options?.rememberMe })`.
6. Action selze → propagovat error z action response.
7. Uspech → nastavit session state primo z response (ne pres `refreshSession()`):
   ```
   setSessionState({
     status: response.data.session ? "authenticated" : "unauthenticated",
     session: response.data.session,
   });
   broadcastSessionChanged();
   ```
   Toto je shodny vzor s existujici `signIn()` funkci (auth-client.ts:48–60). Pouziva `setSessionState` (ktery ma built-in deduplication pres `isSameSessionSnapshot`) a `broadcastSessionChanged` pro cross-tab sync pres BroadcastChannel.
8. Vratit response.

Import `syncOAuth2SessionAction` z `@/features/auth/actions/auth-actions`.

Poznamka: `signInWithOAuth2` se **neprida do `AuthClient` typu** v auth-contract.ts, protoze vyzaduje browser-only PocketBase SDK (popup). Zustava jako standalone export z auth-client.ts.

### 8.2 Popup vs Redirect fallback

PocketBase JS SDK podporuje oba mody:

- Popup je preferovany pro desktop — uzivatel neztraci stav aplikace.
- Redirect nutny pro prostredi kde popup neni mozny (Safari ITP, nektere mobilni prohlizece).

Fallback logika:

- Pokud `authWithOAuth2()` hodi popup-blocked chybu → informovat uzivatele toastem.
- Pro redirect flow: ulozt aplikacni stav do `sessionStorage` pred redirect, obnovit po navratu.

## 9. UI komponenty

### 9.1 oauth2-buttons.tsx

Soubor: `src/features/auth/components/oauth2-buttons.tsx`

Tri samostatne komponenty: `GoogleSignInButton`, `AppleSignInButton`, `FacebookSignInButton`.

Kazde tlacitko:

- Volat `signInWithOAuth2(provider)` primo v onClick handleru (synchronne — bez await pred tim).
- Loading stav behem popup flow.
- `OAUTH2_PROVIDER_ERROR` → zadny toast, pouze obnoveni tlacitka ze loading stavu.
- `OAUTH2_EMAIL_MISSING` → akcni dialog (viz sekce 10.1).
- Popup-blocked → sonner toast s lokalizovanou hlasou "Povolte pop-upy pro tento web a zkuste znovu."
- Jina chyba → lokalizovany error toast (sonner).
- Uspech → `router.replace("/overview")`.

Brand compliance (povinne dle officialnich brand guidelines):

- **Google**: official "Sign in with Google" button design dle Google Identity guidelines.
- **Apple**: cerny button, Apple symbol + text "Sign in with Apple" — povinne dle Apple HIG (https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple).
- **Facebook**: official Meta brand barvy a logo dle Meta Brand Resource Center.

### 9.2 Integrace do sign-in a sign-up stranek

Soubory: `src/features/auth/sign-in/sign-in-form.tsx`, `src/features/auth/sign-up/sign-up-form.tsx`

- Pridat vizualni oddelovac pod existujici formular (lokalizovany text `auth.oauth.divider`).
- Pridat skupinu OAuth tlacitek pod oddelovac.
- Pridat i18n kliche do `messages/*.json`: `auth.oauth.continueWithGoogle`, `auth.oauth.continueWithApple`, `auth.oauth.continueWithFacebook`.

## 10. Edge cases

### 10.1 Apple Private Email Relay

Dle https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms:

- Apple umoznuje skryt skutecny email — relay adresa tvaru `xxxx@privaterelay.appleid.com`.
- Relay email je platny unikatni identifikator — PocketBase jej prijme jako email uzivatele.
- Account linking: relay email a real email jsou ruzne identity — PocketBase je nespoji.
- Uzivatel odmitne sdilet email vubec → PocketBase neobdrzi email → OAUTH2_EMAIL_MISSING.
- UX: akcni dialog (ne genericke "Nastala chyba"): "Pro dokonceni registrace je nutny email. Pouzijte prihlaseni e-mailem nebo povolte sdileni emailu v nastaveni Apple ID."
- `name` field: Apple posilá jméno pouze pri prvnim loginu. Pri dalsich loginech Apple jmeno neodesila.

### 10.2 Zruseni loginu uzivatelem

- Uzivatel zavre popup bez dokonceni → PocketBase JS SDK promise resolvuje s chybou.
- `signInWithOAuth2` vraci `{ ok: false, errorCode: "OAUTH2_PROVIDER_ERROR" }`.
- UX: zadny error toast — uzivatel vedome popup zavrel. Pouze obnovit tlacitko ze loading stavu.

### 10.3 Account linking (shodny email)

Dle PocketBase dokumentace:

- PocketBase automaticky propojuje OAuth ucty s existujicimi ucty dle emailu.
- Existujici `user@gmail.com` pres email/password + Google login se stejnym emailem → PocketBase prida externalAuths zaznam a vrati existujici AuthModel.
- Zadna extra logika na aplikacni vrstve neni nutna.
- Uzivatel bez hesla (prvni login pres OAuth) muze pridat heslo pres account password flow.

### 10.4 State a PKCE (automaticke)

Dle PocketBase JS SDK:

- **state**: SDK generuje nahodnou hodnotu, uklada do `sessionStorage`, overuje pri navratu. Neshodny state → SDK vyhodi chybu.
- **PKCE**: SDK automaticky generuje `code_verifier` a `code_challenge`. `code_verifier` odesila PocketBase server pri code exchange. Aplikacni vrstva PKCE neimplementuje manualne.

### 10.5 Security rules

- `syncOAuth2SessionAction` vzdy provadi serverovou validaci tokenu pres `authRefresh` — never trust raw client input.
- OAuth access_token a code providera nikdy neprochazi aplikacni vrstvou — PocketBase handling internalne.
- Zadne OAuth credentials (Client Secret, Apple Private Key) nesmi byt v klientskem kodu nebo `NEXT_PUBLIC_*` env promennych.
- Apple `.p8` private key ulozit jako jednorádkový string (newlines jako `\n`) v secrets manageru nebo `.env.local` (nikdy v gitu).
- Cookies po OAuth2 loginu maji shodna bezpecnostni nastaveni jako email/password login — zajistuje existujici `exportPocketBaseAuthCookies` helper.
- Device session cookie se generuje a registruje na serveru — bez ni by `getServerAuthSession` / `getApiAuthSession` invalidovaly session pri dalsim requestu (oba validuji device session pres `validateDeviceSessionOrInvalidate`).
- `rememberMe`: implicitne `true` pro OAuth (uzivatel si vybral trusted provider). Klient muze prepsat pres `options.rememberMe`.
- Turnstile se u `syncOAuth2SessionAction` nepouziva — OAuth flow je chraneny providerem (na rozdil od `signUpAction`, ktery Turnstile vyzaduje).

## 11. Implementacni etapy

### Etapa A — Konzolove konfigurace a PocketBase Admin UI

1. Dokoncit konzolove konfigurace pro vsechny 3 providery (sekce 4).
2. Ulozit credentials bezpecne: `.env.local` pro vyvoj, secrets manager pro produkci, nikdy do gitu.
3. Konfigurovat PocketBase Admin UI pro vsechny 3 providery (sekce 5).
4. Rucne overit redirect URI round-trip pro kazdy provider.

### PR B1 — Server vrstva

1. Rozsirit `AuthErrorCode` v `src/features/auth/auth-contract.ts` o 2 nove hodnoty.
2. Implementovat `syncOAuth2Session()` v `src/server/auth/auth-service.ts` vcetne device session registrace.
3. Pridat `syncOAuth2SessionAction` do `src/features/auth/actions/auth-actions.ts` s Zod validaci.
4. Typecheck + lint musi projit.

### PR B2 — Client vrstva

1. Implementovat `signInWithOAuth2()` a `OAuthProvider` typ v `src/features/auth/auth-client.ts`.
2. Pouzit vzor `setSessionState` + `broadcastSessionChanged` (shodny s existujici `signIn()`).
3. Overit popup flow lokalne pro vsechny 3 providery.
4. Overit cookie propagaci pres `syncOAuth2SessionAction` (auth + persist + device session cookies).
5. Overit ze `useSession` hook reaguje na zmenu stavu po OAuth loginu.

### PR B3 — UI komponenty a integrace

1. Implementovat `src/features/auth/components/oauth2-buttons.tsx` s brand-compliant tlacitky.
2. Integrovat na `/sign-in` a `/sign-up` stranky.
3. Pridat i18n kliche do `messages/` souboru.
4. Overit loading/error stavy per-button.
5. Overit Apple Private Email chybovy dialog.
6. Overit popup-blocker detekci a informativni toast.

### PR B4 — Edge cases a production readiness

1. Otestovat account linking (existujici email/password ucet + OAuth se stejnym emailem).
2. Overit redirect fallback flow pro Safari.
3. Otestovat ze device session se spravne registruje po OAuth loginu (viditelna v /account/sessions).
4. Otestovat ze signOut po OAuth loginu spravne revokuje device session.
5. Facebook App: Development → Live.
6. Google OAuth consent screen: overit stav In Production.
7. Apple Services ID Return URL: overit na produkci.
8. Bezpecnostni audit: overit ze zadny OAuth token neopousti PocketBase server (Network tab).
9. Aktualizovat Privacy Policy a Terms of Service (vyzadovano vsemi providery).

## 12. Kritické soubory

| Soubor | Zmena |
|---|---|
| `src/features/auth/auth-contract.ts` | +2 AuthErrorCode hodnoty (`OAUTH2_PROVIDER_ERROR`, `OAUTH2_EMAIL_MISSING`) |
| `src/server/auth/auth-service.ts` | +`syncOAuth2Session()` vcetne device session registrace |
| `src/features/auth/actions/auth-actions.ts` | +`syncOAuth2SessionAction` + Zod schema |
| `src/features/auth/auth-client.ts` | +`signInWithOAuth2()`, +`OAuthProvider` typ |
| `src/features/auth/components/oauth2-buttons.tsx` | novy soubor |
| `src/features/auth/sign-in/sign-in-form.tsx` | +oddelovac + OAuth tlacitka |
| `src/features/auth/sign-up/sign-up-form.tsx` | +oddelovac + OAuth tlacitka |
| `messages/*.json` | +i18n kliche pro OAuth |

Soubory beze zmen:

- `src/server/pocketbase/pocketbase-server.ts` — `exportPocketBaseAuthCookies` se pouzije beze zmen
- `src/server/auth/finalize-auth-action.ts` — `finalizeAuthAction` se pouzije beze zmen (vola `applyServerAuthCookies` z auth-cookies.ts a `toAuthApiResponse` z auth-service.ts)
- `src/server/auth/auth-cookies.ts` — `applyServerAuthCookies` se pouzije beze zmen (parsuje Set-Cookie headery a aplikuje pres Next.js cookies() API)
- `src/server/device-sessions/device-sessions-service.ts` — `registerOrRefreshDeviceSession` se pouzije beze zmen
- `src/server/device-sessions/device-sessions-cookie.ts` — `generateDeviceSessionCookie` se pouzije beze zmen

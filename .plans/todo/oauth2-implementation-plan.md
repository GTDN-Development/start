# OAuth2 Implementation Plan

Date: March 19, 2026
Assumption: `auth-implementation-plan.md` and `phase-2-auth-server-actions.md` are complete and in production.

Sources (official documentation only):

- PocketBase OAuth2: https://pocketbase.io/docs/authentication/#authenticate-with-oauth2
- Next.js Authentication: https://nextjs.org/docs/pages/guides/authentication
- Google Identity Platform: https://developers.google.com/identity/protocols/oauth2/web-server
- Apple Sign in with Apple: https://developer.apple.com/documentation/sign_in_with_apple
- Meta / Facebook Login: https://developers.facebook.com/docs/facebook-login/web

## 1. Goal

- Add Google, Apple, and Facebook social login providers as an additive extension of the existing auth flow.
- Use the native PocketBase SDK `authWithOAuth2` method, with no manual code exchange implementation.
- Keep a unified `AuthResponse<T>` contract consistent with the existing email/password flow.
- Keep the cookie model unchanged: auth cookie from `authConfig.cookies.authCookieName`, persist cookie from `authConfig.cookies.persistCookieName`, device session cookie from `DEVICE_SESSION_COOKIE_NAME`, and existing `httpOnly` security settings.
- Keep device session integration: OAuth login must register a device session the same way email/password login does.
- Do not modify any existing flow; only extend it.

## 2. Non-goals

- Native mobile OAuth (iOS/Android SDK), only the web popup flow.
- Manual PKCE implementation, because the PocketBase JS SDK already handles it automatically.
- Manual `state` parameter handling, because the PocketBase JS SDK already generates and validates it automatically.
- Unlinking providers from an account (Account Security Settings), which should be handled in a separate plan.
- 2FA after OAuth2 login, without backend integration in this plan.
- Workspace membership behavior on the first OAuth2 login.

## 3. How PocketBase OAuth2 works (based on the official documentation)

According to https://pocketbase.io/docs/authentication/#authenticate-with-oauth2:

- `pb.collection("users").authWithOAuth2({ provider })` runs only on the client (browser).
- The SDK automatically opens a popup with the OAuth URL, including automatically generated `state` and `code_challenge` parameters.
- The PocketBase server handles the full code exchange with the provider, so the client never sees the provider access token.
- Return endpoint: `{PB_URL}/api/oauth2-redirect` - PocketBase processes the code there and writes the result into `authStore`.
- Account linking: if a user with the same email already exists, PocketBase automatically links it through an `externalAuths` record. No extra app-layer logic is needed.
- New user: PocketBase creates a new record in the `users` collection.
- The result is `pb.authStore.token` and `pb.authStore.model`, with the same shape as after `authWithPassword`.

According to https://nextjs.org/docs/pages/guides/authentication:

- Session state should be managed through `httpOnly` cookies set by Server Actions.
- The client passes the token to the server, which always validates it first and only then sets cookies.

Security invariant, consistent with `.rules/pocketbase-integration.md`:

- `syncOAuth2SessionAction` must perform server validation through `pb.authRefresh()`. Never trust a raw client token.
- No OAuth credentials (Client Secret, Apple Private Key) may live in `NEXT_PUBLIC_*` env vars.

## 4. Pre-requisites: console configuration

### 4.1 Google Cloud Console

According to https://developers.google.com/identity/protocols/oauth2/web-server:

- Google Cloud Console -> project -> APIs & Services -> Credentials -> Create Credentials -> OAuth 2.0 Client ID, type Web application.
- Authorized JavaScript origins:
  - `https://yourdomain.com` (production)
  - `http://localhost:8090` (local PocketBase for development)
- Authorized redirect URIs:
  - `https://pb.yourdomain.com/api/oauth2-redirect`
  - `http://localhost:8090/api/oauth2-redirect`
- Save the Client ID (`*.apps.googleusercontent.com`) and Client Secret.
- OAuth consent screen: External; App name, Privacy Policy URL, Homepage URL.
- Scopes: `openid`, `email`, `profile` - basic scopes, no Google OAuth verification required.
- Before production rollout: complete Google OAuth verification if expanded scopes are added.

### 4.2 Apple Developer Portal

According to https://developer.apple.com/documentation/sign_in_with_apple:

Apple requires more configuration objects than the other providers:

1. **App ID**: Identifiers -> New Identifier -> App IDs; Bundle ID: `com.yourdomain.app`; Capability: Sign in with Apple enabled. Note the Team ID (10 characters, top right corner of the account UI).
2. **Services ID** (this becomes the Client ID for PocketBase): Identifiers -> Services IDs; Identifier: `com.yourdomain.web`; enable Sign in with Apple; Configure:
   - Primary App ID: the App ID from step 1
   - Domains: `pb.yourdomain.com` (without protocol)
   - Return URLs: `https://pb.yourdomain.com/api/oauth2-redirect`
3. **Private Key**: Keys -> New Key; enable Sign in with Apple; assign the App ID. Download the `.p8` file. It can only be downloaded once. Note the Key ID (10 characters).

Store these securely: Team ID, Client ID (`com.yourdomain.web`), Key ID, and the contents of the `.p8` file.

Note: Apple does not issue a classic Client Secret. PocketBase generates the Client Secret dynamically as a JWT signed by the private key. See https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens. That is why the Admin UI expects Team ID, Key ID, and Private Key rather than a pre-generated Client Secret.

### 4.3 Meta for Developers (Facebook)

According to https://developers.facebook.com/docs/facebook-login/web:

- Meta for Developers -> My Apps -> Create App -> Consumer type.
- App Dashboard -> Add Product -> Facebook Login -> Web.
- Valid OAuth Redirect URIs:
  - `https://pb.yourdomain.com/api/oauth2-redirect`
  - `http://localhost:8090/api/oauth2-redirect` (development mode only)
- Settings -> Basic: App ID, App Secret (shown after password confirmation), App Domains: `yourdomain.com`, Privacy Policy URL, Terms of Service URL, Data Deletion Instructions URL.
- Facebook Login -> Settings: Client OAuth Login ON; Web OAuth Login ON; Enforce HTTPS ON; Embedded Browser OAuth Login OFF.
- Scopes: `email`, `public_profile` - basic scopes, no Meta App Review required.
- For production: switch App Mode from Development to Live.

## 5. PocketBase Admin UI configuration

Navigation: `/_/` -> Collections -> users -> Settings -> Auth -> OAuth2 providers section.
Requires PocketBase v0.22+ (the project uses `pocketbase@^0.26.8`, so this is satisfied).

### 5.1 Google

| Field                    | Value                                                      |
| ------------------------ | ---------------------------------------------------------- |
| Enabled                  | ON                                                         |
| Client ID                | `*.apps.googleusercontent.com`                             |
| Client Secret            | value from Google Cloud Console                            |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect` - must match Google Console |

### 5.2 Apple

| Field                    | Value                                                                         |
| ------------------------ | ----------------------------------------------------------------------------- |
| Enabled                  | ON                                                                            |
| Client ID                | `com.yourdomain.web` (Services ID)                                            |
| Client Secret            | leave empty - PocketBase generates it dynamically                             |
| Team ID                  | 10-character code from the Apple Developer account                            |
| Key ID                   | 10-character code from Apple Developer Portal                                 |
| Private Key              | contents of the `.p8` file including the `-----BEGIN PRIVATE KEY-----` header |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect`                                                |

### 5.3 Facebook

| Field                    | Value                          |
| ------------------------ | ------------------------------ |
| Enabled                  | ON                             |
| Client ID                | App ID from Meta Dashboard     |
| Client Secret            | App Secret from Meta Dashboard |
| Redirect URL (read-only) | `{PB_URL}/api/oauth2-redirect` |

### 5.4 Collection rules

- The `email` field in the `users` collection must keep its unique constraint (default, but verify it).
- `authRule` / `createRule` must not block OAuth2-created records, which do not have a password.

## 6. Flow architecture

```text
[Client (Browser)]          [Next.js Server Action]      [PocketBase]        [OAuth Provider]
      |                               |                         |                      |
      |-- onClick "Sign in" (user gesture, sync)
      |
      |-- authWithOAuth2({ provider }) --- PocketBase JS SDK
      |          |                                             |                      |
      |          |--- popup opens ------------------------------------> redirect to provider
      |          |                                             |                      |
      |          |                                             |<-- /api/oauth2-redirect (code)
      |          |                                             |-- code exchange ----->|
      |          |                                             |<-- access_token + id_token
      |          |                                             |
      |          |                                       Account linking:
      |          |                                       - existing email -> link
      |          |                                       - new email -> create user
      |          |                                             |
      |<-- pb.authStore.token + model (promise resolved)
      |
      |-- syncOAuth2SessionAction({ token, recordId }) ------> |
      |                               |-- new PocketBase (clean instance, no cookies)
      |                               |-- pb.authStore.save(token, { id: recordId })
      |                               |-- pb.collection("users").authRefresh() (server validation)
      |                               |<-- fresh token + record
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

Key security points:

- `authWithOAuth2()` runs only on the client through the PocketBase JS SDK.
- The PocketBase server handles the code exchange; the client never sees the OAuth access token.
- PKCE and `state` are handled automatically by the PocketBase JS SDK.
- `syncOAuth2SessionAction` always performs `pb.authRefresh()` as server validation.
- The device session is registered on the server. Without it, the next request (`getServerAuthSession` / `getApiAuthSession`) would invalidate the session.
- Turnstile is not used for OAuth because authentication already happened through a provider with its own anti-abuse mechanisms.

## 7. Server layer extension

### 7.1 `auth-contract.ts` - extend `AuthErrorCode`

File: `src/features/auth/auth-contract.ts`

Add these values to the `AuthErrorCode` union:

- `"OAUTH2_PROVIDER_ERROR"` - the provider returns an error or the user denies consent / closes the popup.
- `"OAUTH2_EMAIL_MISSING"` - the provider does not supply an email (Apple without email sharing).

Note: the `AuthClient` type in `auth-contract.ts` is not extended. `signInWithOAuth2` should not be part of the `AuthClient` interface because it requires the browser-only PocketBase SDK popup flow. It should be exported as a standalone function from `auth-client.ts`.

### 7.2 `auth-service.ts` - new `syncOAuth2Session` method

File: `src/server/auth/auth-service.ts`

Input: `{ token: string; recordId: string; rememberMe?: boolean }`

- `token` - JWT from client-side `pb.authStore.token` after successful `authWithOAuth2`.
- `recordId` - user ID from client-side `pb.authStore.record.id`.
- `rememberMe` - defaults to `true` for OAuth, see section 10.5.

Sequence:

1. Create a clean PocketBase instance. **Do not use `createPocketBaseServerClient()`**, because that loads the existing auth cookie from the request. For OAuth sync we need a clean instance into which we inject the client token. Use the shared `getPocketBaseUrl()` helper or export a new helper from `pocketbase-server.ts` for URL consistency. Set `pb.autoCancellation(false)`.
2. Load the token into authStore: `pb.authStore.save(token, { id: recordId })`.
3. Perform server validation: `const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>()`. If this fails, return `UNAUTHORIZED`. This also refreshes the authStore with a fresh token and record.
4. Verify the record is valid: `if (!isUsersRecord(refreshedAuth.record))` -> `UNAUTHORIZED`.
5. Build `AuthSession`: `const session = createAuthSession(pb, refreshedAuth.record)`. Use the existing private helper in `auth-service.ts:663`. If it returns `null`, return `UNKNOWN_ERROR`.
6. Register the device session, using the same pattern as `signInWithPassword` (`auth-service.ts:75-92`):

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

   Note: device session registration is non-blocking (`try/catch`). Failure should not fail the login, consistent with the email/password flow.

7. Build cookies: `[...exportPocketBaseAuthCookies(pb, { sessionOnly: !rememberMe }), deviceSessionCookie]`.
   - `exportPocketBaseAuthCookies` (`pocketbase-server.ts:51-64`) returns a `string[]` containing the auth cookie and persist cookie.
   - The device session cookie is added as the third item.
8. Return `ServerAuthResponse<AuthSessionPayload>`:

   ```
   return {
     ok: true,
     data: { session },
     setCookie: [...exportPocketBaseAuthCookies(pb, { sessionOnly: !rememberMe }), deviceSessionCookie],
   };
   ```

   - The return type is `ServerAuthResponse<AuthSessionPayload>`, not `ServerAuthResponse<AuthSession>`, consistent with `signInWithPassword`.
   - `AuthSessionPayload = { session: AuthSession | null }`.

Error mapping:

- `authRefresh` fails (`401`/`403`) -> `{ ok: false, errorCode: "UNAUTHORIZED" }`
- record is not a valid `UsersRecord` -> `{ ok: false, errorCode: "UNAUTHORIZED" }`
- Transient error (`status 0` or `>=500`) -> `{ ok: false, errorCode: "UNKNOWN_ERROR" }` using the existing `isTransientError` helper
- Any other `ClientResponseError` -> `{ ok: false, errorCode: "UNKNOWN_ERROR" }`, log through `logAuthServiceError`

### 7.3 `auth-actions.ts` - new Server Action `syncOAuth2SessionAction`

File: `src/features/auth/actions/auth-actions.ts`

According to `.rules/server-actions-guideline.md`, the Server Action should remain a thin adapter: validation -> domain logic -> uniform response.

- The `"use server"` directive already exists in the file.
- Input Zod schema:
  ```
  const syncOAuth2SessionInputSchema = z.object({
    token: z.string().min(1),
    recordId: z.string().min(1),
    rememberMe: z.boolean().optional(),
  });
  ```
- Validate the input. On failure, return `createBadRequestResponse<AuthSessionPayload>()`, using the existing helper in the file.
- Call `syncOAuth2Session(parsedInput.data)` from `auth-service`.
- Apply cookies through the existing `finalizeAuthAction(response)` from `src/server/auth/finalize-auth-action.ts`.
  - `finalizeAuthAction` calls `applyServerAuthCookies(response.setCookie)` from `src/server/auth/auth-cookies.ts`, which parses `Set-Cookie` headers and applies them through the Next.js `cookies()` API.
  - It then calls `toAuthApiResponse(response)`, which strips `setCookie` and returns a clean `AuthResponse<T>`.
- Return `Promise<AuthResponse<AuthSessionPayload>>`.
- Turnstile is not required because the OAuth flow is protected by the provider.

## 8. Client layer extension

### 8.1 `auth-client.ts` - new `signInWithOAuth2` function

File: `src/features/auth/auth-client.ts`

According to https://pocketbase.io/docs/authentication/#authenticate-with-oauth2:

New type, exported from `auth-client.ts`:

```ts
export type OAuthProvider = "google" | "apple" | "facebook";
```

New exported function:

```ts
export async function signInWithOAuth2(
  provider: OAuthProvider,
  options?: { rememberMe?: boolean }
): Promise<SignInResponse>;
```

Note: the return type is `SignInResponse` (`AuthResponse<AuthSessionPayload>`), consistent with the existing `signIn()` function.

Sequence:

1. Create a temporary PocketBase instance for the popup flow: `const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL)`. This instance is used only for `authWithOAuth2` and then discarded.
2. Call `pb.collection("users").authWithOAuth2({ provider })`. This must happen directly in the `onClick` handler, synchronously, with no preceding `await`, otherwise browsers may block the popup.
3. Wait for the popup result.
4. If the popup closes without login, catch the error and return `{ ok: false, errorCode: "OAUTH2_PROVIDER_ERROR" }`.
5. On success, call `syncOAuth2SessionAction({ token: pb.authStore.token, recordId: pb.authStore.record.id, rememberMe: options?.rememberMe })`.
6. If the action fails, propagate the error from the action response.
7. On success, set session state directly from the response, not through `refreshSession()`:
   ```ts
   setSessionState({
     status: response.data.session ? "authenticated" : "unauthenticated",
     session: response.data.session,
   });
   broadcastSessionChanged();
   ```
   This matches the existing `signIn()` pattern in `auth-client.ts:48-60`. It uses `setSessionState`, which already has built-in deduplication through `isSameSessionSnapshot`, and `broadcastSessionChanged` for cross-tab sync through `BroadcastChannel`.
8. Return the response.

Import `syncOAuth2SessionAction` from `@/features/auth/actions/auth-actions`.

Note: `signInWithOAuth2` should **not** be added to the `AuthClient` type in `auth-contract.ts`, because it requires the browser-only PocketBase SDK popup flow. It remains a standalone export from `auth-client.ts`.

### 8.2 Popup vs redirect fallback

The PocketBase JS SDK supports both modes:

- Popup is preferred on desktop because the user keeps app state.
- Redirect is required in environments where popup is not viable, such as Safari ITP or some mobile browsers.

Fallback logic:

- If `authWithOAuth2()` throws a popup-blocked error, inform the user with a toast.
- For redirect flow, save app state to `sessionStorage` before redirect and restore it after return.

## 9. UI components

### 9.1 `oauth2-buttons.tsx`

File: `src/features/auth/components/oauth2-buttons.tsx`

Three separate components: `GoogleSignInButton`, `AppleSignInButton`, `FacebookSignInButton`.

Each button should:

- Call `signInWithOAuth2(provider)` directly inside the `onClick` handler, synchronously, with no `await` before it.
- Show a loading state during the popup flow.
- For `OAUTH2_PROVIDER_ERROR`, show no toast, only reset the button out of the loading state.
- For `OAUTH2_EMAIL_MISSING`, show an action dialog, see section 10.1.
- For popup-blocked behavior, show a localized Sonner toast: "Allow pop-ups for this site and try again."
- For any other error, show a localized error toast with Sonner.
- On success, call `router.replace("/overview")`.

Brand compliance, required by official brand guidelines:

- **Google**: official "Sign in with Google" button design according to Google Identity guidelines.
- **Apple**: black button, Apple symbol, and text "Sign in with Apple", required by Apple HIG: https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple
- **Facebook**: official Meta brand colors and logo according to the Meta Brand Resource Center.

### 9.2 Integrate into sign-in and sign-up pages

Files: `src/features/auth/sign-in/sign-in-form.tsx`, `src/features/auth/sign-up/sign-up-form.tsx`

- Add a visual divider below the existing form, with localized text `auth.oauth.divider`.
- Add the OAuth button group below the divider.
- Add i18n keys to `messages/*.json`: `auth.oauth.continueWithGoogle`, `auth.oauth.continueWithApple`, `auth.oauth.continueWithFacebook`.

## 10. Edge cases

### 10.1 Apple Private Email Relay

According to https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js/incorporating_sign_in_with_apple_into_other_platforms:

- Apple allows users to hide the real email address behind a relay address like `xxxx@privaterelay.appleid.com`.
- The relay email is a valid unique identifier. PocketBase should accept it as the user email.
- Account linking: relay email and real email are different identities, so PocketBase will not merge them.
- If the user does not share an email at all, PocketBase will not receive one, which should map to `OAUTH2_EMAIL_MISSING`.
- UX should use an action dialog, not a generic "Something went wrong": "An email address is required to finish sign-up. Use email sign-in instead or allow email sharing in your Apple ID settings."
- Apple sends the `name` field only on the first login. On later logins Apple no longer sends it.

### 10.2 User cancels login

- If the user closes the popup before finishing, the PocketBase JS SDK promise resolves with an error.
- `signInWithOAuth2` returns `{ ok: false, errorCode: "OAUTH2_PROVIDER_ERROR" }`.
- UX should show no error toast because the user intentionally closed the popup. Only reset the button out of the loading state.

### 10.3 Account linking (same email)

According to PocketBase documentation:

- PocketBase automatically links OAuth accounts to existing accounts by email.
- Existing `user@gmail.com` account created through email/password plus Google login with the same email -> PocketBase adds an `externalAuths` record and returns the existing `AuthModel`.
- No extra application-layer logic is needed.
- A user who first logged in through OAuth and has no password can later add a password through the account password flow.

### 10.4 State and PKCE (automatic)

According to the PocketBase JS SDK:

- **state**: the SDK generates a random value, stores it in `sessionStorage`, and validates it on return. If the state does not match, the SDK throws an error.
- **PKCE**: the SDK automatically generates `code_verifier` and `code_challenge`. The `code_verifier` is sent by the PocketBase server during code exchange. The app layer does not implement PKCE manually.

### 10.5 Security rules

- `syncOAuth2SessionAction` always validates the token on the server through `authRefresh`. Never trust raw client input.
- The provider OAuth access token and code never pass through the application layer. PocketBase handles them internally.
- No OAuth credentials, including Client Secret and Apple Private Key, may exist in client code or `NEXT_PUBLIC_*` env vars.
- Store the Apple `.p8` private key as a single-line string, with newlines encoded as `\n`, in a secrets manager or `.env.local`, never in git.
- Cookies after OAuth2 login must use the same security settings as email/password login, handled by the existing `exportPocketBaseAuthCookies` helper.
- The device session cookie must be generated and registered on the server. Without it, `getServerAuthSession` / `getApiAuthSession` would invalidate the session on the next request because both validate the device session through `validateDeviceSessionOrInvalidate`.
- `rememberMe` defaults to `true` for OAuth because the user picked a trusted provider. The client can override it through `options.rememberMe`.
- Turnstile is not used for `syncOAuth2SessionAction` because the OAuth flow is protected by the provider, unlike `signUpAction`, which requires Turnstile.

## 11. Implementation stages

### Stage A - console configuration and PocketBase Admin UI

1. Finish console configuration for all 3 providers, see section 4.
2. Store credentials securely: `.env.local` for development, a secrets manager for production, never in git.
3. Configure PocketBase Admin UI for all 3 providers, see section 5.
4. Manually verify redirect URI round-trip for each provider.

### PR B1 - server layer

1. Extend `AuthErrorCode` in `src/features/auth/auth-contract.ts` with the 2 new values.
2. Implement `syncOAuth2Session()` in `src/server/auth/auth-service.ts`, including device session registration.
3. Add `syncOAuth2SessionAction` to `src/features/auth/actions/auth-actions.ts` with Zod validation.
4. Typecheck and lint must pass.

### PR B2 - client layer

1. Implement `signInWithOAuth2()` and the `OAuthProvider` type in `src/features/auth/auth-client.ts`.
2. Reuse the `setSessionState` + `broadcastSessionChanged` pattern, the same as the existing `signIn()`.
3. Verify popup flow locally for all 3 providers.
4. Verify cookie propagation through `syncOAuth2SessionAction` for auth, persist, and device session cookies.
5. Verify that the `useSession` hook reacts to the state change after OAuth login.

### PR B3 - UI components and integration

1. Implement `src/features/auth/components/oauth2-buttons.tsx` with brand-compliant buttons.
2. Integrate it into the `/sign-in` and `/sign-up` pages.
3. Add i18n keys to `messages/`.
4. Verify loading and error states per button.
5. Verify the Apple Private Email error dialog.
6. Verify popup blocker detection and the informational toast.

### PR B4 - edge cases and production readiness

1. Test account linking: existing email/password account plus OAuth with the same email.
2. Verify redirect fallback flow in Safari.
3. Test that the device session is properly registered after OAuth login and visible in `/account/sessions`.
4. Test that sign-out after OAuth login properly revokes the device session.
5. Switch Facebook App from Development to Live.
6. Verify that the Google OAuth consent screen is in production state.
7. Verify the Apple Services ID Return URL in production.
8. Run a security audit to verify that no OAuth token leaves the PocketBase server, using the Network tab.
9. Update Privacy Policy and Terms of Service, required by all providers.

## 12. Critical files

| File                                              | Change                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/features/auth/auth-contract.ts`              | +2 `AuthErrorCode` values (`OAUTH2_PROVIDER_ERROR`, `OAUTH2_EMAIL_MISSING`) |
| `src/server/auth/auth-service.ts`                 | +`syncOAuth2Session()` including device session registration                |
| `src/features/auth/actions/auth-actions.ts`       | +`syncOAuth2SessionAction` + Zod schema                                     |
| `src/features/auth/auth-client.ts`                | +`signInWithOAuth2()`, +`OAuthProvider` type                                |
| `src/features/auth/components/oauth2-buttons.tsx` | new file                                                                    |
| `src/features/auth/sign-in/sign-in-form.tsx`      | +divider + OAuth buttons                                                    |
| `src/features/auth/sign-up/sign-up-form.tsx`      | +divider + OAuth buttons                                                    |
| `messages/*.json`                                 | +i18n keys for OAuth                                                        |

Files used unchanged:

- `src/server/pocketbase/pocketbase-server.ts` - `exportPocketBaseAuthCookies` is reused as-is
- `src/server/auth/finalize-auth-action.ts` - `finalizeAuthAction` is reused as-is; it calls `applyServerAuthCookies` from `auth-cookies.ts` and `toAuthApiResponse` from `auth-service.ts`
- `src/server/auth/auth-cookies.ts` - `applyServerAuthCookies` is reused as-is; it parses `Set-Cookie` headers and applies them through the Next.js `cookies()` API
- `src/server/device-sessions/device-sessions-service.ts` - `registerOrRefreshDeviceSession` is reused as-is
- `src/server/device-sessions/device-sessions-cookie.ts` - `generateDeviceSessionCookie` is reused as-is

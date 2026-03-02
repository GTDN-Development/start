# Auth Implementation Details

## Cíl
Tato implementace zavádí jednoduchou a rozšiřitelnou auth vrstvu nad PocketBase pro Next.js 16 App Router.

Hlavní principy:
- PocketBase je source of truth pro auth/session.
- Na serveru se vždy vytváří nová PB instance per request (žádná sdílená globální user instance).
- Auth API je sjednocené v jedné catch-all route.
- DX na klientu je přes `authClient` (`signIn`, `signUp`, `useSession`, `signOut`).

## Klíčové soubory
- `src/features/auth/auth-contract.ts`: typy session, response a error kódů.
- `src/features/auth/auth-schemas.ts`: sdílené Zod schéma pro client/server validaci.
- `src/server/pocketbase/pocketbase-server.ts`: SSR-safe PB client factory + cookie import/export.
- `src/server/auth/auth-service.ts`: business logika auth operací.
- `src/app/api/auth/[...all]/route.ts`: auth endpoint dispatcher.
- `src/features/auth/auth-client.ts`: klientské DX API + session store.
- `src/features/auth/auth-routes.ts`: centralizovaný source of truth pro protected/guest-only route policy.
- `src/features/auth/auth-proxy.ts`: proxy guard nad route policy.

## API endpointy
Vše je přes `src/app/api/auth/[...all]/route.ts`:
- `POST /api/auth/sign-in`
- `POST /api/auth/sign-up`
- `POST /api/auth/sign-out`
- `GET /api/auth/session`

`GET /api/auth/session` používá `getApiAuthSession()` (refreshuje token přes PB a vrací `Set-Cookie` při refresh/clear).

## Server session vs API session
V `auth-service.ts` jsou záměrně dvě cesty:
- `getServerAuthSession()`
  - Používá se v Server Components/layout guardech.
  - Validuje session proti PB (aktuální user record), ale nevrací cookie side effects pro SSR layout response.
- `getApiAuthSession()`
  - Používá se v API route.
  - Dělá `authRefresh()` a vrací `setCookie` při refreshi/cleanu.

Tím je oddělené SSR čtení session od HTTP cookie synchronizace.

## Guardy a redirecty
### Proxy guard
- `src/proxy.ts` volá `evaluateAuthProxyGuard()`.
- Guard řeší rychlé UX redirecty na základě přítomnosti `pb_auth` cookie.
- Route policy je centralizovaná v `src/features/auth/auth-routes.ts`.

### SSR fallback guard
- `src/app/[locale]/(platform)/layout.tsx`
  - Pokud není validní session, redirect na login.
- `src/app/[locale]/(auth)/(guest)/layout.tsx`
  - Pokud session existuje, redirect na dashboard.

## Marketing shell auth-aware chování
- `src/app/[locale]/(marketing)/layout.tsx` načítá server session a předává `viewer` do `MarketingLayout`.
- `marketing-header` při přihlášení zobrazuje avatar + user dropdown.
- `marketing-footer` při přihlášení ukazuje account/dashboard odkazy a reálný `signOut()`.

## Klientské DX API
Použití:

```ts
import { authClient } from "@/features/auth/auth-client";

const { signIn, signUp, useSession, signOut } = authClient;
```

`useSession()` drží lehký externí store se stavy:
- `idle`
- `loading`
- `authenticated`
- `unauthenticated`

## Jak rozšiřovat
1. Nové auth flow (např. reset/verify):
- přidat schéma do `auth-schemas.ts`
- přidat service funkci do `auth-service.ts`
- přidat action do `[...all]/route.ts`
- přidat metodu do `auth-client.ts`

2. Nové chráněné/guest-only routy:
- upravit pouze `src/features/auth/auth-routes.ts`

3. UI mapování errorů:
- formuláře mapují `errorCode` -> i18n message.

## Poznámky
- `pb_auth` cookie se čistí při neplatné session/token situaci.
- `signIn` už nemaže cookie při každé chybě (např. transient error).
- Autorizace je fail-closed: při nevalidní server session je uživatel považován za odhlášeného.

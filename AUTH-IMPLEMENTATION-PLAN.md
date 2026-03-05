# Auth + PocketBase Integration Plan (Phase 1)

## Overview

Cílem je zavést moderní, jednoduchou a rozšiřitelnou auth vrstvu nad PocketBase pro Next.js 16 SSR aplikaci.

Tato fáze se soustředí na:

- spolehlivou komunikaci s PocketBase jako hlavní source of truth,
- základní auth flow (`signIn`, `signUp`, `signOut`, `useSession`),
- SSR-safe práci se session podle doporučení PocketBase (#5313),
- čisté DX API ve stylu `authClient`.

Principy:

- KISS, ale full-featured základ,
- žádná sdílená globální PocketBase instance pro běžné uživatele na serveru,
- jednotný auth kontrakt a sdílená validace mezi klientem a serverem,
- `proxy.ts` jako hlavní redirect autorita pro missing-cookie case,
- layout guard jako bezpečnostní fallback pro neplatný token.

## Scope (Phase 1)

- `email + password` sign-in
- `email + password` sign-up
- session read endpoint
- sign-out
- napojení sign-in/sign-up UI
- proxy + SSR guard pro chráněné routy

Mimo scope (později): OAuth2, forgot/reset password, verify email, confirm email change, advanced account mutations.

## Implementation Steps

1. Vytvořit auth kontrakty a error codes v `src/features/auth/auth-contract.ts`.
2. Vytvořit sdílená Zod schémata v `src/features/auth/auth-schemas.ts` (jeden source of truth pro klient i server).
3. Přidat SSR-safe PocketBase factory do `src/server/pocketbase/pocketbase-server.ts`:
   - per-request instance,
   - načtení `pb_auth` z cookies,
   - invalid token fallback (`authStore.clear()`),
   - helper pro export auth cookie.
4. Přidat auth service do `src/server/auth/auth-service.ts`:
   - `signIn`, `signUp`, `signOut`, `getSession`,
   - mapování PocketBase chyb na interní stabilní `errorCode`.
5. Přidat jednotný catch-all endpoint `src/app/api/auth/[...all]/route.ts`:
   - `POST /api/auth/sign-in`,
   - `POST /api/auth/sign-up`,
   - `POST /api/auth/sign-out`,
   - `GET /api/auth/session`.
6. Přidat client DX vrstvu `src/features/auth/auth-client.ts` a exportovat API:
   - `signIn`, `signUp`, `useSession`, `signOut`.
7. Přepojit formuláře:
   - `src/features/auth/sign-in/sign-in-form.tsx`,
   - `src/features/auth/sign-up/sign-up-form.tsx`,
     z mock submitu na `authClient`.
8. Upravit `src/proxy.ts`:
   - ponechat next-intl behavior,
   - přidat auth redirect autoritu pro protected routy při chybějící `pb_auth` cookie.
9. Upravit SSR fallback guard v `src/app/[locale]/(application)/layout.tsx`:
   - načíst session ze server auth vrstvy,
   - pokud cookie existuje, ale session je neplatná/nepoužitelná, redirect na sign-in,
   - nahradit statický profil daty session usera.
10. Aktualizovat `README.md` sekci Auth/Account status podle nové implementace.

## Routing Strategy for Auth Guarding

- Primární guard: `proxy.ts` (rychlé rozhodnutí podle existence `pb_auth` cookie).
- Sekundární guard: server layout/service validace (token může být přítomen, ale již neplatný).

Tím získáme:

- lepší UX bez zbytečného render/redirect flickeru,
- bezpečnostní fallback tam, kde cookie existence sama nestačí.

## DX Target API

```ts
export const { signIn, signUp, useSession, signOut } = authClient;
```

## Notes

- `src/types/pocketbase.ts` je již vygenerovaný a používá se jako typový základ.
- Žádný `middleware.ts`; pouze `proxy.ts`.

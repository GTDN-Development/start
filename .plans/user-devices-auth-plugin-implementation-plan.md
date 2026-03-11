# User Devices Auth Plugin Implementation Plan

Datum: 11. 3. 2026
Cíl: převést statické `Your Devices` na produkční backend jako plugin nad existující auth flow, bez vazby na workspaces.

## 1. Principy návrhu (KISS + DX)

1. Device sessions jsou samostatný plugin nad současným auth (`pb_auth`), ne přepis auth vrstvy.
2. Žádná vazba na workspaces doménu; vše je čistě user-scoped.
3. Jediný zdroj pravdy je server (`src/server/*`), UI je pouze projekce server stavu.
4. Jedna kolekce v PocketBase + jedna service doména, žádné zbytečné abstraction vrstvy.
5. Omezování počtu aktivních zařízení je konfigurovatelné přes env, aby šel limit později snížit na 3 bez rewritu.
6. Bezpečnostní pravidla se vynucují serverově i datově (PB rules + indexy + idempotentní service flow).

## 2. Co se nemění

1. Auth provider zůstává PocketBase (`users`, `pb_auth` cookie).
2. Auth payload kontrakty (`/api/auth/sign-in`, `/sign-up`, `/sign-out`, `/session`) se nemění.
3. Workspace implementace z `.plans/multi-workspace-backend-implementation-plan.md` zůstává oddělená.
4. Stávající auth guardy a redirect flow se pouze rozšíří o plugin check, nebudou přepisované.

## 3. Cílová modulární struktura

1. `src/server/device-sessions/device-sessions-service.ts`
2. `src/server/device-sessions/device-sessions-types.ts`
3. `src/server/device-sessions/device-sessions-cookie.ts`
4. `src/server/device-sessions/device-sessions-ua-parser.ts`
5. `src/server/device-sessions/device-sessions-auth-check.ts`
6. `src/server/device-sessions/device-sessions-plugin.ts`
7. `src/features/account/security/device-sessions-contract.ts`
8. `src/features/account/security/device-sessions-client.ts`
9. `src/app/api/account/devices/route.ts` (`GET` list)
10. `src/app/api/account/devices/sign-out-others/route.ts` (`POST` sign-out-others)
11. `src/app/api/account/devices/[deviceSessionId]/route.ts` (`DELETE` sign-out konkrétního zařízení)

Poznámka:
1. `device-sessions-auth-check.ts` je sdílený helper pro obě auth-check cesty (`auth-service.ts` i `account-service.ts`), aby logika nebyla duplicitní.
2. `device-sessions-ua-parser.ts` je lightweight server-side parser `User-Agent` pro `device_label`, `device_type`, `browser`, `os`.

## 4. PocketBase kolekce

## 4.1 Název kolekce

1. `user_device_sessions`

## 4.2 Pole (doporučený minimální model)

1. `user` (relation -> `users`, required, maxSelect=1)
2. `session_id_hash` (text, required, max 64)
3. `device_label` (text, required, max 120) - např. `"Mac OS · Safari"`
4. `device_type` (select: `desktop | phone | tablet | unknown`, required)
5. `browser` (text, optional, max 60)
6. `os` (text, optional, max 60)
7. `user_agent` (text, optional, max 500)
8. `ip_masked` (text, optional, max 64) - např. `"89.24.xx.xx"`
9. `ip_hash` (text, optional, max 64) - SHA-256(salt + ip)
10. `location_label` (text, optional, max 120)
11. `last_seen_at` (date, required)
12. `expires_at` (date, required)
13. `revoked_at` (date, optional)
14. `revoked_reason` (select: `signed_out | signed_out_others | capped | expired | admin`, optional)
15. `remember_me` (bool, required, default `false`)

Doporučení:
1. `session_id_hash` a `ip_hash` nikdy neposílat do klienta.
2. `user_agent` držet pro diagnostiku, ale v UI použít uživatelsky čitelné `device_label`.
3. `location_label` je Phase 2; v první fázi se neplní, dokud nebude vybraný geolocation provider.

## 4.3 Indexy

1. `CREATE UNIQUE INDEX idx_user_device_sessions_session_hash ON user_device_sessions (session_id_hash);`
2. `CREATE INDEX idx_user_device_sessions_user_active_last_seen ON user_device_sessions ("user", revoked_at, last_seen_at);`
3. `CREATE INDEX idx_user_device_sessions_user_revoked_at ON user_device_sessions ("user", revoked_at);`
4. `CREATE INDEX idx_user_device_sessions_expires_at ON user_device_sessions (expires_at);`

## 4.4 PocketBase API Rules (nastavit v kolekci)

List rule:

```txt
@request.auth.id != "" && user = @request.auth.id
```

View rule:

```txt
@request.auth.id != "" && user = @request.auth.id
```

Create rule:

```txt
@request.auth.id != "" && @request.data.user = @request.auth.id
```

Update rule:

```txt
@request.auth.id != "" && user = @request.auth.id && @request.data.user = user
```

Delete rule:

```txt
@request.auth.id != "" && user = @request.auth.id
```

Pracovní pravidlo:
1. Přes app client nikdy nevolat PocketBase přímo; všechny operace jdou přes `api/account/devices*`.
2. Rules jsou fallback ochrana, hlavní business pravidla vynucuje server service.

## 5. Pravidla práce s daty (produkční lifecycle)

## 5.1 Session identita zařízení

1. Zavést HttpOnly cookie `app_device_session` (opaque random value, 32+ bytes).
2. V DB ukládat pouze `sha256(app_device_session + DEVICE_SESSION_PEPPER)` jako `session_id_hash`.
3. Cookie životnost:
4. `rememberMe=true`: persistent (např. 90 dní)
5. `rememberMe=false`: session cookie
6. Sign-up flow aktuálně nemá `rememberMe`; v první fázi bude `app_device_session` při sign-up persistent, aby byl v souladu se stávajícím auth chováním.

## 5.2 Registrace/obnova session

1. Po úspěšném `sign-in` a `sign-up` volat plugin hook `registerOrRefreshDeviceSession`.
2. Hook vytvoří nebo aktualizuje record podle `session_id_hash` + `user`.
3. Vždy nastaví `last_seen_at = now`, `expires_at`, metadata zařízení.
4. Metadata se parsují na serveru z request headers (`User-Agent`, IP) přes `device-sessions-ua-parser.ts`.
5. Následně hook spustí `enforceDeviceLimit(userId)`.

## 5.3 Kontrola session při auth guardu (dvě cesty)

1. Zavést sdílený helper `validateDeviceSessionOrInvalidate` v `device-sessions-auth-check.ts`.
2. Cesta A: API/route handlers (`getApiAuthSession`, `requireCurrentUser`) při invalidní device session vrací `UNAUTHORIZED` a nastaví `setCookie` pro vyčištění `pb_auth`, `pb_auth_persist`, `app_device_session`.
3. Cesta B: server render (`getServerAuthSession`) při invalidní device session vrací `session: null` + `deviceInvalidated: true` a caller provede `redirect("/sign-in")`.
4. `getServerAuthSession` se nepoužije jako místo pro přímé mazání cookies; clearing zajišťuje API path při nejbližším auth requestu.
5. Migrační pravidlo při rolloutu (zásadní): pokud je validní `pb_auth`, ale chybí `app_device_session`, helper nesmí uživatele odhlásit.
6. V migračním režimu helper provede lazy registration:
7. API path: vytvoří `app_device_session` cookie + DB record on the fly a request pustí dál.
8. Server-render path: session neinvaliduje, vrátí `deviceBootstrapRequired: true`; bootstrap proběhne při nejbližším API auth requestu.
9. Po vypnutí migračního režimu (`AUTH_DEVICE_SESSIONS_ALLOW_LEGACY_BOOTSTRAP=false`) se chybějící `app_device_session` bere jako invalidní stav.

## 5.4 Heartbeat (debounce, serverless-safe)

1. Debounce není in-memory.
2. Mechanismus: načti record, pokud `last_seen_at < now - DEVICE_SESSION_HEARTBEAT_MIN_SECONDS`, proveď update, jinak write přeskoč.
3. Tento check běží v rámci shared auth-check helperu.

## 5.5 Sign-out chování

1. `sign-out` (current device) musí běžet v pořadí: načíst auth identitu + přečíst `app_device_session` -> revokovat session record (`revoked_at=now`, `revoked_reason=signed_out`) -> vyčistit cookie.
2. Revokace se provádí před `createClearedPocketBaseAuthCookies`, jinak není dostupná session identita.
3. `sign-out other devices`: revokuje všechny aktivní sessions uživatele kromě current (`signed_out_others`).
4. `sign-out specific device`: revokuje cílový record (blokovat revoke current).

## 5.6 Omezování počtu zařízení (future-proof na 3)

1. Env `AUTH_MAX_ACTIVE_DEVICE_SESSIONS` (doporučený start `5`).
2. `enforceDeviceLimit` drží max N aktivních sessions (`revoked_at IS NULL`, `expires_at > now`).
3. Pokud je aktivních víc než N, revokují se nejstarší podle `last_seen_at ASC` (nikdy current).
4. Při souběžných loginech je enforce best-effort; případný krátkodobý přesah limitu srovná další login/heartbeat.
5. Pro budoucí limit 3 stačí změna env na `3`; žádná změna schématu/API.

## 5.7 Čištění starých záznamů

1. Opportunistic cleanup spouštět při `sign-in`, `GET /api/account/devices` a `POST /api/account/devices/sign-out-others`.
2. Pravidla cleanupu:
3. hard-delete revoked records starší než `DEVICE_SESSION_REVOKED_RETENTION_DAYS` (např. 30)
4. hard-delete expired records starší než `DEVICE_SESSION_EXPIRED_RETENTION_DAYS` (např. 7)
5. Cíl: v kolekci držet jen reálně používané + krátká auditní stopa, ne desítky stale sessions.

## 6. API kontrakt (app server)

1. `GET /api/account/devices`
2. response: seznam aktivních sessions uživatele (max N), `isCurrentDevice` flag
3. `POST /api/account/devices/sign-out-others`
4. effect: revokace všech ostatních aktivních sessions
5. `DELETE /api/account/devices/[deviceSessionId]`
6. effect: revokace jedné session (blokovat revoke current)

Error codes (stejný styl jako auth):
1. `UNAUTHORIZED`
2. `NOT_FOUND`
3. `FORBIDDEN`
4. `CONFLICT`
5. `UNKNOWN_ERROR`

## 7. Frontend integrace (`YourDevicesSettingsItem`)

1. Nahradit `MOCK_DEVICES` daty z `device-sessions-client.ts`.
2. Zobrazit pouze aktivní sessions (`revoked_at = null`, `expires_at > now`).
3. `Sign out` tlačítko na řádku volá `DELETE /api/account/devices/[id]`.
4. `Sign out from all devices` volá `POST /api/account/devices/sign-out-others`.
5. UI copy přes `messages/en.json` + `messages/cs.json` (žádné hardcoded stringy).
6. Pokud po revokaci current session dojde k invalidaci, klient přesměruje na `/sign-in`.

## 8. Bezpečnost, stabilita, DX

1. `session_id_hash` a `ip_hash` nikdy nelogovat.
2. Metadata parsing držet KISS (best-effort parser; žádný heavy dependency parser v první fázi).
3. Feature flag `AUTH_DEVICE_SESSIONS_ENABLED` pro bezpečný rollout bez rizika pro auth.
4. Fail-safe mód:
5. při selhání device plugin write operace neblokovat sign-in/sign-up
6. při explicitních device akcích (`sign-out-others`, `revoke`) failnout s chybou
7. Service API držet malé a explicitní (max 6-8 veřejných metod).
8. Rotace `DEVICE_SESSION_PEPPER` je supported, ale invaliduje všechny existující device sessions.

## 9. Testovací strategie

1. Unit testy pro `device-sessions-service`:
2. upsert, enforce limit, revoke current/others, cleanup
3. API integration testy:
4. `GET /api/account/devices`
5. `DELETE /api/account/devices/[id]`
6. `POST /api/account/devices/sign-out-others`
7. Auth integration testy:
8. sign-in registruje session
9. sign-out current ji revokuje v pořadí revoke -> clear cookies
10. revoked/expired device session je na dalším requestu odhlášena
11. limit N funguje deterministicky (N+1 loginů -> nejvýš N aktivních po následném enforce)
12. server-render path při `deviceInvalidated` přesměruje na `/sign-in`
13. rollout test: validní legacy `pb_auth` bez `app_device_session` nevynutí globální logout a provede lazy bootstrap

## 10. Implementační etapy

## Etapa A: Data foundation

1. Vytvořit PB kolekci `user_device_sessions`.
2. Nastavit pole, indexy, rules.
3. Spustit `npm run pocketbase:typegen`.
4. Commitnout změny `src/types/pocketbase.ts`.

## Etapa B: Server plugin

1. Implementovat `device-sessions-cookie.ts`, `device-sessions-ua-parser.ts`, `device-sessions-service.ts`.
2. Přidat `device-sessions-auth-check.ts` a používat ho v `getApiAuthSession`, `getServerAuthSession`, `requireCurrentUser`.
3. Napojit hooky do `signInWithPassword`, `signUpWithPassword`, `signOutServerSession`.
4. V `signOutServerSession` zavést sekvenci `identify -> revoke -> clear cookies`.

## Etapa C: Account API + UI

1. Přidat endpointy `api/account/devices`, `api/account/devices/sign-out-others`, `api/account/devices/[deviceSessionId]`.
2. Napojit `your-devices-settings-item.tsx` na reálná data a akce.
3. Dodat i18n texty (`messages/en.json`, `messages/cs.json`).

## Etapa D: Hardening

1. Dodat logging/telemetrii pro revoke/cap/cleanup eventy.
2. Spustit regression test auth flow (sign-in, sign-up, session refresh, sign-out).
3. Ověřit kompatibilitu s workspace backend větví (žádné cross-dependency).
4. Rollout legacy migrace:
5. dočasně zapnout `AUTH_DEVICE_SESSIONS_ALLOW_LEGACY_BOOTSTRAP=true`
6. po stabilizačním okně přepnout na `false`

## 11. Doporučené výchozí hodnoty

1. `AUTH_DEVICE_SESSIONS_ENABLED=true` (po nasazení kolekce)
2. `AUTH_MAX_ACTIVE_DEVICE_SESSIONS=5` (později snadno `3`)
3. `DEVICE_SESSION_HEARTBEAT_MIN_SECONDS=300`
4. `DEVICE_SESSION_REVOKED_RETENTION_DAYS=30`
5. `DEVICE_SESSION_EXPIRED_RETENTION_DAYS=7`
6. `DEVICE_SESSION_PEPPER=<crypto-random-secret>`
7. `AUTH_DEVICE_SESSIONS_ALLOW_LEGACY_BOOTSTRAP=true` (jen po dobu rollout migrace)

Poznámka:
1. `DEVICE_SESSION_PEPPER` musí být dlouhý kryptograficky náhodný secret.
2. Jeho rotace invaliduje všechny existující device sessions.
3. `AUTH_DEVICE_SESSIONS_ALLOW_LEGACY_BOOTSTRAP` je dočasný rollout přepínač, ne trvalý security režim.

## 12. Vztah k multi-workspace plánu

1. Device sessions jsou čistě user-level bezpečnostní vrstva.
2. Workspace membership/role/invite logika na nich není závislá.
3. Integrace je pouze přes existující auth hook points, které už multi-workspace plán používá.
4. Výsledek: obě feature větve mohou běžet paralelně bez architektonického konfliktu.

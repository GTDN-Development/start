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
4. `src/server/device-sessions/device-sessions-plugin.ts`
5. `src/features/account/security/device-sessions-contract.ts`
6. `src/features/account/security/device-sessions-client.ts`
7. `src/app/api/account/devices/route.ts` (`GET` list + `POST` sign-out-others)
8. `src/app/api/account/devices/[deviceSessionId]/route.ts` (`DELETE` sign-out konkrétního zařízení)

Poznámka: volání pluginu bude jen z centrálních auth míst (`auth-service.ts`, `account-service.ts`, `api/account/devices/*`).

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
10. `location_label` (text, optional, max 120) - např. `"Prague, CZ"`
11. `last_seen_at` (date, required)
12. `expires_at` (date, required)
13. `revoked_at` (date, optional)
14. `revoked_reason` (select: `signed_out | signed_out_others | capped | expired | admin`, optional)
15. `remember_me` (bool, required, default `false`)

Doporučení:
1. `session_id_hash` a `ip_hash` nikdy neposílat do klienta.
2. `user_agent` držet pro diagnostiku, ale v UI použít uživatelsky čitelné `device_label`.

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
1. Přes app client nikdy nevolat PocketBase přímo; všechny operace jdou přes `api/account/devices`.
2. Rules jsou fallback ochrana, hlavní business pravidla vynucuje server service.

## 5. Pravidla práce s daty (produkční lifecycle)

## 5.1 Session identita zařízení

1. Zavést HttpOnly cookie `app_device_session` (opaque random value, 32+ bytes).
2. V DB ukládat pouze `sha256(app_device_session + DEVICE_SESSION_PEPPER)` jako `session_id_hash`.
3. Cookie životnost:
4. `rememberMe=true`: persistent (např. 90 dní)
5. `rememberMe=false`: session cookie

## 5.2 Registrace/obnova session

1. Po úspěšném `sign-in` a `sign-up` volat plugin hook `registerOrRefreshDeviceSession`.
2. Hook vytvoří nebo aktualizuje record podle `session_id_hash` + `user`.
3. Vždy nastaví `last_seen_at = now`, `expires_at`, metadata zařízení.
4. Následně spustí `enforceDeviceLimit(userId)`.

## 5.3 Kontrola session při auth guardu

1. V `getApiAuthSession`, `getServerAuthSession` a `requireCurrentUser` doplnit plugin check:
2. když `pb_auth` existuje, ale `app_device_session` chybí/neexistuje/revoked/expires => považovat session za neplatnou
3. vrátit unauthenticated a vyčistit auth cookies + device cookie
4. Na každém requestu dělat heartbeat s debounce (např. max 1x za 5 min na session).

## 5.4 Sign-out chování

1. `sign-out` (current device): nastaví `revoked_at=now`, `revoked_reason=signed_out`, vyčistí obě cookie.
2. `sign-out other devices`: revokuje všechny aktivní sessions uživatele kromě current (`signed_out_others`).
3. `sign-out specific device`: revokuje cílový record (pokud není current).

## 5.5 Omezování počtu zařízení (future-proof na 3)

1. Env `AUTH_MAX_ACTIVE_DEVICE_SESSIONS` (doporučený start `5`).
2. `enforceDeviceLimit` drží max N aktivních sessions (`revoked_at IS NULL`, `expires_at > now`).
3. Pokud je aktivních víc než N, revokují se nejstarší podle `last_seen_at ASC` (nikdy current).
4. Pro budoucí limit 3 stačí změna env na `3`; žádná změna schématu/API.

## 5.6 Čištění starých záznamů

1. Opportunistic cleanup spouštět při `sign-in`, `GET /api/account/devices` a `sign-out-others`.
2. Pravidla cleanupu:
3. hard-delete revoked records starší než `DEVICE_SESSION_REVOKED_RETENTION_DAYS` (např. 30)
4. hard-delete expired records starší než `DEVICE_SESSION_EXPIRED_RETENTION_DAYS` (např. 7)
5. Cíl: v kolekci držet jen reálně používané + krátká auditní stopa, ne desítky stale sessions.

## 6. API kontrakt (app server)

1. `GET /api/account/devices`
2. response: seznam aktivních sessions uživatele (max N), `isCurrentDevice` flag
3. `POST /api/account/devices`
4. action: `"sign-out-others"`
5. effect: revokace všech ostatních aktivních sessions
6. `DELETE /api/account/devices/[deviceSessionId]`
7. effect: revokace jedné session (blokovat revoke current)

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
4. `Sign out from all devices` volá `POST /api/account/devices` s akcí `sign-out-others`.
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

## 9. Testovací strategie

1. Unit testy pro `device-sessions-service`:
2. upsert, enforce limit, revoke current/others, cleanup
3. API integration testy:
4. `GET /api/account/devices`
5. `DELETE /api/account/devices/[id]`
6. `POST /api/account/devices` sign-out-others
7. Auth integration testy:
8. sign-in registruje session
9. sign-out current ji revokuje
10. revoked session je na dalším requestu odhlášena
11. limit N funguje deterministicky (N+1 loginů -> jen N aktivních)

## 10. Implementační etapy

## Etapa A: Data foundation

1. Vytvořit PB kolekci `user_device_sessions`.
2. Nastavit pole, indexy, rules.
3. Spustit `npm run pocketbase:typegen`.
4. Commitnout změny `src/types/pocketbase.ts`.

## Etapa B: Server plugin

1. Implementovat `device-sessions-cookie.ts` + `device-sessions-service.ts`.
2. Napojit hooky do `signInWithPassword`, `signUpWithPassword`, `signOutServerSession`.
3. Přidat guard check do `getApiAuthSession`, `getServerAuthSession`, `requireCurrentUser`.

## Etapa C: Account API + UI

1. Přidat `api/account/devices` endpointy.
2. Napojit `your-devices-settings-item.tsx` na reálná data a akce.
3. Dodat i18n texty (`messages/en.json`, `messages/cs.json`).

## Etapa D: Hardening

1. Dodat logging/telemetrii pro revoke/cap/cleanup eventy.
2. Spustit regression test auth flow (sign-in, sign-up, session refresh, sign-out).
3. Ověřit kompatibilitu s workspace backend větví (žádné cross-dependency).

## 11. Doporučené výchozí hodnoty

1. `AUTH_DEVICE_SESSIONS_ENABLED=true` (po nasazení kolekce)
2. `AUTH_MAX_ACTIVE_DEVICE_SESSIONS=5` (později snadno `3`)
3. `DEVICE_SESSION_HEARTBEAT_MIN_SECONDS=300`
4. `DEVICE_SESSION_REVOKED_RETENTION_DAYS=30`
5. `DEVICE_SESSION_EXPIRED_RETENTION_DAYS=7`

## 12. Vztah k multi-workspace plánu

1. Device sessions jsou čistě user-level bezpečnostní vrstva.
2. Workspace membership/role/invite logika na nich není závislá.
3. Integrace je pouze přes existující auth hook points, které už multi-workspace plán používá.
4. Výsledek: obě feature větve mohou běžet paralelně bez architektonického konfliktu.

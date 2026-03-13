# User Devices / Sessions Final Implementation Plan (Server Actions + Workspaces Era)

Status:
1. Tento dokument je jediný zdroj pravdy pro implementaci user devices/sessions.
2. Nahrazuje původní planning dokumenty k této feature.

Datum: 13. 3. 2026  
Historický kontext použitý při sestavení:
1. Původní plugin plán (nyní superseded).
2. Matějův reimplementation plán (nyní superseded).
3. Aktuální stav `dev` (server actions migrace, workspace doména, Next.js 16 async cookies/headers/params).

## 1. Cíl

1. Navázat na reálný stav, kde skončil Matěj, ale implementaci dokončit podle současné architektury.
2. Zachovat device sessions jako čistě user-scoped auth extension (bez vazby na workspace model).
3. Nepřidávat novou `/api/account/devices/*` vrstvu; mutace řešit přes server actions.
4. Integrovat device validaci napříč auth/account/workspace server flow, aby revokované zařízení nezůstalo autorizované přes server actions.
5. Udržet runtime implementaci v KISS režimu s LoC guardrailem kolem 1000 LoC.

## 1.1 LoC guardrail (KISS budget)

1. Budget policy:
2. target `<= 1000 LoC`
3. soft cap `<= 1100 LoC` (po schválení)
4. hard cap `<= 1200 LoC` jen pokud je to nutné pro correctness/security edge cases
5. Do budgetu se počítá:
6. `src/server/device-sessions/*`
7. změny v `src/server/auth/auth-service.ts`
8. změny v `src/server/account/account-service.ts`
9. změny v `src/server/workspaces/workspace-service.ts`
10. `src/features/account/security/*` a případné nové `src/features/account/actions/*` pro devices
11. Do budgetu se nepočítá:
12. generovaný `src/types/pocketbase.ts`
13. `messages/en.json`, `messages/cs.json`
14. testy

Pracovní odhad:
1. `src/server/device-sessions/*`: 450–550 LoC
2. integrace auth/account/workspace: 180–250 LoC
3. account security actions: 100–150 LoC
4. UI wiring (`your-devices-settings-item.tsx`): 120–180 LoC
5. Celkem: 850–1050 LoC

Když budget začne růst nad target:
1. nebudeme přidávat extra response kontrakty (pouze `AuthResponse<T>`)
2. rate limiting revoke akcí zůstane mimo v1 (až podle telemetry/abuse)
3. `ip_masked`, `ip_hash`, `location_label` zůstanou ve v1 nullable bez GeoIP
4. heartbeat optimalizace přes extra cookie přidáme jen při reálném load problému

## 2. Co je dnes v repu relevantní

1. Auth mutace běží přes server actions (`src/features/auth/actions/auth-actions.ts`) a `auth-service`.
2. Account a workspace mutace běží přes server actions a service vrstvu (`src/server/account/*`, `src/server/workspaces/*`).
3. `GET /api/auth/session` zůstává jako specializovaný session sync endpoint.
4. `src/types/pocketbase.ts` už obsahuje `UserDeviceSessionsRecord` a kolekci `user_device_sessions`.
5. `YourDevicesSettingsItem` je stále mock UI bez backend napojení.

## 3. Reuse Matějovy práce (co převzít / upravit / zahodit)

### 3.1 Převzít jako základ

1. `src/server/device-sessions/device-sessions-types.ts`
2. `src/server/device-sessions/device-sessions-cookie.ts`
3. `src/server/device-sessions/device-sessions-ua-parser.ts`
4. `src/server/device-sessions/device-sessions-service.ts` (s refaktorem podle bodu 3.2)
5. Auth hook v `signInWithPassword`, `signUpWithPassword`, `signOutServerSession` (sekvence register/revoke před clear cookies)

### 3.2 Upravit při převzetí

1. Nahradit endpoint-first části server-action flow.
2. Doplnit error mapping a logging na současný pattern (`logServiceError`, explicitní error kódy).
3. Dodržet současné cookie flow přes `applyServerAuthCookies` v action vrstvě.
4. Upravit UI na i18n copy z `messages/en.json` + `messages/cs.json` (bez hardcoded textů).
5. Dotáhnout validaci tak, aby helper nebyl „jen existující soubor“, ale byl skutečně zapojený v auth/session guard flow.

### 3.3 Nepřebírat

1. `src/app/api/account/devices/route.ts`
2. `src/app/api/account/devices/sign-out-others/route.ts`
3. `src/app/api/account/devices/[deviceSessionId]/route.ts`

Důvod:
1. V aktuálním směru jsou account mutace přes server actions.
2. Duplicita action + API route je explicitně nežádoucí.

### 3.4 Zdroj kódu z Matějovy práce

1. Soubory ze sekce 3.1 aktuálně nejsou na `dev` branch.
2. Převzetí znamená: vycházet z branch `matej/user-devices` (manual port/cherry-pick relevantních částí).
3. Nejde o copy-paste celých commitů; cílem je přepsat je do aktuální architektury.

## 4. Cílová architektura (aktualizovaná)

## 4.1 Server doména

1. `src/server/device-sessions/device-sessions-types.ts`
2. `src/server/device-sessions/device-sessions-cookie.ts`
3. `src/server/device-sessions/device-sessions-ua-parser.ts`
4. `src/server/device-sessions/device-sessions-service.ts`

## 4.2 Integrace do stávajících domén

1. `src/server/auth/auth-service.ts`
2. `src/server/account/account-service.ts` (`requireCurrentUser` větev)
3. `src/server/workspaces/workspace-service.ts` (`requireCurrentUser` větev)
4. `src/server/auth/current-user.ts` (sdílený helper `requireCurrentUser` se zachovaným API + interní device validace)

## 4.3 Feature/action vrstva

1. Nové account security actions:
2. `listDeviceSessionsAction` (query action pro UI inicializaci)
3. `signOutOtherDevicesAction`
4. `signOutDeviceAction`
5. UI:
6. `src/features/account/security/your-devices-settings-item.tsx`
7. `src/app/[locale]/(application)/account/security/page.tsx` (napojení na aktuální data flow)

Poznámka:
1. `GET /api/auth/session` zůstává a bude obsahovat device-session validaci/heartbeat pro session sync.

## 5. Auth/device pravidla

1. Cookie `app_device_session` je HttpOnly, `sameSite=lax`, `path=/`, `secure` v produkci.
2. Token generation: `crypto.randomBytes(32).toString("hex")` (64 hex chars); DB drží jen `session_id_hash = sha256(token)`.
3. `sign-in` a `sign-up` vždy registrují/refreshují device session.
4. `sign-out` pořadí: identifikace -> revoke current device -> clear PB + device cookies.
5. `sign-out` je fail-open: když revoke DB operace selže, cookies se stejně smažou a uživatel se lokálně odhlásí.
6. Device limit enforce je připravený pro budoucí zapnutí a používá LRU eviction (`last_seen_at ASC`), s akceptací eventual consistency při concurrent loginech; ve v1 je default no-limit.
7. Heartbeat update je debounce přes `last_seen_at` threshold (konstanta v kódu, bez in-memory throttle); v1 poběží jen v auth/session validačních tocích, ne na každém RSC read path.
8. Cleanup stale záznamů běží opportunistic při relevantních operacích.
9. `getServerAuthSession` v RSC při invalid device session vrací `session: null` (bez cookie write), čímž využije existující redirect logiku v layoutech.
10. Cookie convergence po RSC invalidaci: následný `GET /api/auth/session` nebo guarded server action vrátí `setCookie` clear, takže stav se sjednotí i v browseru.
11. V1 je defaultně strict (žádný bootstrap režim): chybějící/invalidní device session je `UNAUTHORIZED` + clear cookies.
12. `ip_masked`, `ip_hash`, `location_label` jsou ve v1 scope nepovinné; bez GeoIP integrace budou defaultně `null` (scope v2).
13. UA parser je záměrně hand-rolled heuristika bez externí dependency; v kódu bude explicitní komentář, že cílem je UX label, ne přesná fingerprint klasifikace.
14. `createClearedPocketBaseAuthCookies()` zůstává beze změny; pro device extension přidáme nový helper, který skládá `pb_auth` + `pb_auth_persist` + `app_device_session` clear cookies.
15. Cookie lifetime alignment:
16. `rememberMe=true`: `app_device_session` persistent (90 dní) + persistent PB auth flow.
17. `rememberMe=false`: `app_device_session` session cookie + session-only PB auth flow.
18. Pokud device cookie expiruje dřív než PB auth, uživatel je považován za neautorizovaného (security-first).

## 5.1 Launch a rollback

1. Projekt je greenfield (bez existujících uživatelů), takže bootstrap migrace není potřeba.
2. Nasazení je rovnou ve strict režimu.
3. Rollback: standardní revert/hotfix release; není potřeba runtime feature flag.

## 6. Milníky

## Milník A: Parita s Matějovým stavem v nové architektuře

1. Přidat server device-sessions modul (typy/cookie/parser/service).
2. Napojit `signInWithPassword`, `signUpWithPassword`, `signOutServerSession`.
3. Napojit `YourDevicesSettingsItem` na reálná data přes `listDeviceSessionsAction`.
4. Zobrazit reálný list zařízení + current badge.
5. Nechat UI revoke tlačítka zatím bez finální mutační logiky (funkční parita s tím, kde Matěj skončil).

DoD Milník A:
1. Po sign-in/sign-up vzniká/obnovuje se `user_device_sessions` záznam.
2. Po sign-out current device se session revokuje a cookie se smažou.
3. Security page zobrazuje reálná zařízení místo mock dat.

## Milník B: Dokončení feature

1. Doplnit server actions:
2. `signOutOtherDevicesAction`
3. `signOutDeviceAction(deviceSessionId)`
4. Doplnit server service operace pro revoke non-current sessions:
5. `revokeOtherDeviceSessions`
6. `revokeDeviceSessionById`
7. Napojit tlačítka v UI (row revoke + sign-out-all dialog confirm).
8. Lokálně aktualizovat state listu po úspěchu (optimistic nebo immediate patch).
9. Ošetřit `UNAUTHORIZED` fallback (redirect na sign-in).
10. Dopsat i18n texty pro devices sekci v obou locale souborech.

DoD Milník B:
1. Row `Sign out` revokuje cílové zařízení.
2. `Sign out from all devices` revokuje všechna non-current zařízení.
3. Current zařízení nejde omylem revokovat přes row akci.

## Milník C: Hardening a guard integrace napříč app

1. Zapojit `validateDeviceSessionOrInvalidate` do:
2. `getApiAuthSession`
3. `getServerAuthSession`
4. ověřit, že shared helper `requireCurrentUser` je použit ve všech account/workspace mutacích
5. Zajistit konzistentní clear cookies při invalid device session (`pb_auth`, `pb_auth_persist`, `app_device_session`).
6. Udržet fail-open jen tam, kde je to záměr:
7. sign-in/sign-up nesmí spadnout kvůli write chybě device extension vrstvy
8. sign-out nesmí spadnout kvůli revoke write chybě (fail-open)
9. explicitní device akce musí failnout s chybou
10. vyhodnotit potřebu heartbeat optimalizace (např. cooldown timestamp cookie) až podle reálné zátěže

DoD Milník C:
1. Revokované zařízení nemůže provádět account ani workspace mutace.
2. Session refresh endpoint vrací `session: null` při invalid device stavu.
3. Workspace flow zůstává beze změny v business doméně, jen respektuje device validaci.

## 7. Detailní implementační kroky

## 7.1 Data a typy

1. Ověřit PocketBase kolekci `user_device_sessions` (fieldy/indexy/rules dle původního plánu).
2. Spustit `npm run pocketbase:typegen`.
3. Potvrdit, že `src/types/pocketbase.ts` odpovídá finálnímu schématu (bez ručních editací).
4. Ověřit indexy:
5. unique index na `session_id_hash`
6. index na `("user", revoked_at, last_seen_at)`
7. index na `expires_at`
8. (volitelně) composite index `("user", session_id_hash)` pokud se ukáže výkonnostní přínos nad unique `session_id_hash`.

## 7.2 Server modul

1. Přidat `hashSessionToken`, `registerOrRefreshDeviceSession`, `validateDeviceSession`, `enforceDeviceLimit`.
2. Přidat list + DTO mapování pro UI.
3. Přidat `revokeCurrentDeviceSession` (Milník A).
4. Přidat `revokeOtherDeviceSessions`, `revokeDeviceSessionById` (Milník B).
5. Přidat cleanup operaci s retention konstantami v kódu.
6. Přidat interní helper pro auth-check result (`valid` / `invalid`) přímo do `device-sessions-service.ts`.
7. Device limit připravit jako budoucí hook:
8. v1 default `MAX_ACTIVE_SESSIONS = null` (no-limit, `enforceDeviceLimit` je no-op)
9. pro budoucí zapnutí stačí nastavit konstantu na konkrétní číslo (např. `3` nebo `5`) bez změny API/UI kontraktu.

## 7.3 Auth integrace

1. `signInWithPassword`: generate cookie + register/refresh + merged setCookie.
2. `signUpWithPassword`: totéž s persistent mode.
3. `signOutServerSession`: revoke current před clear cookies, ale při revoke chybě stejně dokončit clear cookies (fail-open).
4. `getApiAuthSession`: device validace + heartbeat.
5. `getServerAuthSession`: device validace bez přímého cookie write; při invalid device session vrátí `session: null`.
6. Přidat helper pro clear všech auth+device cookies (bez zásahu do `createClearedPocketBaseAuthCookies`).

## 7.4 Account/workspace guard integrace

1. Extrahovat sdílený helper `requireCurrentUser` do `src/server/auth/current-user.ts` (zachovat API vůči callerům).
2. V helperu sjednotit:
3. `hadInvalidAuthCookie` / `hasAuthCookie` handling
4. `isUsersRecord` guard
5. interní device-session validaci + cookie clear behavior
6. Přesměrovat `account-service` a `workspace-service` na tento helper.
7. Cíl: žádná další duplikace dvou variant `requireCurrentUser`.

## 7.5 Actions + UI

1. Přidat account security actions (list/revoke one/revoke others).
2. Upravit `YourDevicesSettingsItem`:
3. i18n texty
4. status/toast/error mapování
5. disable/loading states
6. row action napojení
7. dialog confirm napojení
8. Upravit security page dle potřebného data flow (server props nebo query action init).

## 8. Error kontrakt

1. Nepřidávat nový `DeviceSessionsResponse<T>`.
2. Použít existující `AuthResponse<T>` kontrakt bez globálních změn `AuthErrorCode`.
3. Device actions používají podmnožinu:
4. `BAD_REQUEST`
5. `UNAUTHORIZED`
6. `NOT_FOUND`
7. `UNKNOWN_ERROR`
8. `FORBIDDEN` v1 nepřidáváme, protože pro device use-cases není nutný samostatný konkrétní scénář.

## 9. Konfigurace (bez ENV ve v1)

1. V1 nepřidává žádné nové env proměnné pro sessions feature.
2. `MAX_ACTIVE_SESSIONS`, `HEARTBEAT_MIN_SECONDS`, retention hodnoty budou ve v1 jako konstanty v kódu.
3. `MAX_ACTIVE_SESSIONS` je ve v1 `null` (no-limit); kód zůstane připravený na budoucí zapnutí limitu.
4. V1 vědomě neobsahuje dedikovaný app-level rate limiting pro revoke akce; pokud telemetry ukáže abuse, přidá se v navazujícím ticketu.

## 10. Test/ověření checklist

1. Sign-in/sign-up vytváří device session record.
2. Sign-out current revokuje správný record a až potom čistí cookies.
3. Při v1 no-limit režimu nevzniká neočekávaná revoke-cap logika.
4. Pokud se budoucnu zapne limit přes konstantu, test N+1 loginů musí potvrdit max N aktivních non-revoked sessions.
5. Heartbeat nespamuje zápisy v rámci debounce okna.
6. `signOutOtherDevicesAction` revokuje pouze non-current sessions.
7. `signOutDeviceAction` nerevokuje current session.
8. Revokované zařízení je odhlášené z account/workspace akcí.
9. Security page je plně lokalizovaná (en + cs), bez hardcoded copy.
10. Žádné nové `/api/account/devices/*` route handlery nevzniknou.

## 11. Doporučené PR pořadí

1. PR 1: shared `requireCurrentUser` refactor + server device-sessions modul + auth hooks (sign-in/sign-up/sign-out + session checks + fail-open sign-out).
2. PR 2: UI list + revoke actions + i18n (Milník A + B).
3. PR 3: guard coverage hardening + perf tuning podle zátěže (Milník C).

## 12. Akceptační výstup

1. Máme stav „kde skončil Matěj“ v aktuální architektuře (server-actions-first, bez account API route vrstvy).
2. Máme navazující kroky pro dokončení feature bez architektonického dluhu.
3. Workspace refaktor zůstává oddělený doménově, ale auth/device validace je konzistentní napříč celou app.

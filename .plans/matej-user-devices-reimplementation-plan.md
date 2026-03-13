# Matej User Devices Reimplementation Plan

Date: 2026-03-13
Goal: reproducible, branch-independent reimplementation of work done by Matěj on `matej/user-devices`.

## 1. Source Baseline

1. Branch analyzed: `matej/user-devices`
2. Branch fork point: `9aafb10262d6f159cbdba4b0e321e0d3982d42eb` (forked from `origin/fanda/workspaces`)
3. Matěj commits in scope (chronological):
4. `3c25c947f796434aea99d8ef37676c9cc710bfce` - `Add device sessions server foundation (types, cookie, UA parser, service)`
5. `4572f6dd838d119d3ce6497210197e32f15fda29` - `Added API endpoints`
6. `85aa05995041d9e3581d10a0d47cff52d7be3537` - `first ui implementation`
7. Net diff from fork point: `11 files changed, 575 insertions(+), 124 deletions(-)`

## 2. Exact File Scope

### 2.1 New files

1. `src/server/device-sessions/device-sessions-auth-check.ts`
2. `src/server/device-sessions/device-sessions-cookie.ts`
3. `src/server/device-sessions/device-sessions-service.ts`
4. `src/server/device-sessions/device-sessions-types.ts`
5. `src/server/device-sessions/device-sessions-ua-parser.ts`
6. `src/app/api/account/devices/route.ts`
7. `src/app/api/account/devices/sign-out-others/route.ts`
8. `src/app/api/account/devices/[deviceSessionId]/route.ts`

### 2.2 Modified files

1. `src/server/auth/auth-service.ts`
2. `src/features/account/security/your-devices-settings-item.tsx`
3. `src/types/pocketbase.ts`

## 3. Implementation Intent (what this delivers)

1. Add per-device session tracking to auth lifecycle.
2. Add account APIs for listing and revoking device sessions.
3. Replace static mock "Your Devices" UI data with real API data.
4. Keep UI actions partially wired (list works, revoke buttons currently placeholder in UI).

## 4. Prerequisites

### 4.1 Environment variables (used by implementation)

1. `AUTH_MAX_ACTIVE_DEVICE_SESSIONS` (default `5`)
2. `DEVICE_SESSION_PEPPER` (default empty string, but should be set in production)
3. `DEVICE_SESSION_HEARTBEAT_MIN_SECONDS` (default `300`)
4. `DEVICE_SESSION_REVOKED_RETENTION_DAYS` (default `30`)
5. `DEVICE_SESSION_EXPIRED_RETENTION_DAYS` (default `7`)
6. `AUTH_DEVICE_SESSIONS_ALLOW_LEGACY_BOOTSTRAP` (`"true"` enables bootstrap-required branch in auth-check helper)

### 4.2 PocketBase schema assumptions

1. Collection `user_device_sessions` exists.
2. Record type fields expected by code:
3. `user`
4. `session_id_hash`
5. `device_label`
6. `device_type` (`desktop | phone | tablet | unknown`)
7. `browser`
8. `os`
9. `user_agent`
10. `ip_masked`
11. `ip_hash`
12. `location_label`
13. `last_seen_at`
14. `expires_at`
15. `revoked_at`
16. `revoked_reason` (`signed_out | signed_out_others | capped | expired | admin`)
17. `remember_me`

Note:
1. `src/types/pocketbase.ts` is generated-only. Re-generate via `npm run pocketbase:typegen` after schema changes.
2. Do not manually edit `src/types/pocketbase.ts`.

## 5. Step-by-step Reimplementation

## 5.1 Step A - Add device sessions server domain

Create directory:
1. `src/server/device-sessions`

Create `device-sessions-types.ts`:
1. Export env-backed constants:
2. `MAX_ACTIVE_DEVICE_SESSIONS`
3. `DEVICE_SESSION_PEPPER`
4. `HEARTBEAT_MIN_SECONDS`
5. `REVOKED_RETENTION_DAYS`
6. `EXPIRED_RETENTION_DAYS`
7. Export `DEVICE_SESSION_COOKIE_NAME = "app_device_session"`
8. Re-export `UserDeviceSessionsRecord` type from `@/types/pocketbase`
9. Define `ParsedDeviceInfo` with:
10. `deviceLabel`
11. `deviceType`
12. `browser`
13. `os`

Create `device-sessions-cookie.ts`:
1. Implement `generateDeviceSessionCookie(rememberMe)`:
2. random token via `crypto.randomBytes(32).toString("hex")`
3. cookie built with `cookieSerialize` from `pocketbase`
4. cookie options:
5. `path: "/"`
6. `httpOnly: true`
7. `sameSite: "lax"`
8. `secure: process.env.NODE_ENV === "production"`
9. `maxAge: 90 days` only when `rememberMe === true`
10. return `{ token, setCookie }`
11. Implement async `readDeviceSessionCookie()` using awaited `cookies()` from `next/headers`
12. Implement `createClearedDeviceSessionCookie()` with expired cookie (`maxAge: 0`, `expires: new Date(0)`)

Create `device-sessions-ua-parser.ts`:
1. Implement `parseDeviceInfo(userAgent: string)` using lowercased UA heuristics.
2. Browser resolution order:
3. Edge (`edg/`)
4. Chrome (contains `chrome` and not `edg/`)
5. Firefox (`firefox` or `fxios`)
6. Safari (contains `safari` and not `chrome`)
7. OS resolution order:
8. Windows
9. Android
10. iOS (`iphone`/`ipod`)
11. iPadOS (`ipad`)
12. Mac OS
13. Linux
14. Device type derivation:
15. Android/iOS -> `phone`
16. iPadOS -> `tablet`
17. Windows/Mac/Linux -> `desktop`
18. else -> `unknown`
19. `deviceLabel` format: `"${os} · ${browser}"`

Create `device-sessions-service.ts`:
1. `COLLECTION = "user_device_sessions"`
2. `hashSessionToken(token)`:
3. `sha256(token + DEVICE_SESSION_PEPPER)` in hex
4. `enforceDeviceLimit(userId, currentSessionHash, pb)`:
5. fetch active records (`revoked_at = null`, `expires_at > now`, sorted oldest by `+last_seen_at`)
6. if count > max, revoke oldest excluding current hash with `revoked_reason: "capped"`
7. `registerOrRefreshDeviceSession(userId, token, headers, rememberMe, pb)`:
8. derive hash + UA + parsed device info
9. `expiresAt = now + 90 days`
10. upsert by `session_id_hash`:
11. update existing record if found
12. create new record otherwise
13. call `enforceDeviceLimit(...)`
14. `validateDeviceSession(sessionIdHash)`:
15. load by hash
16. return `false` when missing/revoked/expired
17. heartbeat update: if `last_seen_at` older than threshold (`HEARTBEAT_MIN_SECONDS`), update it
18. return `true` when valid
19. `revokeCurrentDeviceSession(userId, sessionIdHash)`:
20. find by hash, no-op if missing/revoked/expired, else set `revoked_at` and `revoked_reason: "signed_out"`
21. `revokeOtherDeviceSessions(userId, sessionIdHash)`:
22. list active sessions for same user except current hash
23. mark each as revoked with reason `"signed_out_others"`
24. `revokeDeviceSessionById(sessionId, currentSessionHash)`:
25. get record by ID
26. no-op if missing/revoked/expired
27. no-op if target hash equals current hash
28. else revoke with reason `"signed_out"`
29. `listActiveDeviceSessions(userId, currentSessionHash)`:
30. list active sessions sorted by newest `-last_seen_at`
31. map to response DTO:
32. `id`, `deviceLabel`, `deviceType`, `browser`, `os`, `user_agent`, `ip_masked`, `location_label`, `isCurrentDevice`
33. `cleanUpExpiredSessions(userId)`:
34. compute retention cutoffs from env constants
35. delete stale revoked/expired records matching cleanup filter

Create `device-sessions-auth-check.ts`:
1. Add `ALLOW_LEGACY_BOOTSTRAP` toggle from env.
2. Define union status:
3. `valid`
4. `invalid` with `clearCookies: string[]`
5. `bootstrap-required`
6. Implement `validateDeviceSessionOrInvalidate(deviceSessionToken, _userId)`:
7. when token exists:
8. hash and validate
9. return `valid` or `invalid` with both cookie clear sets
10. when token missing:
11. return `bootstrap-required` only if env allows
12. otherwise return `invalid` + clear cookies

Important parity note:
1. In analyzed branch, this helper exists but is not wired into route guarding flow yet.

## 5.2 Step B - Integrate into auth service

Modify `src/server/auth/auth-service.ts`:
1. Import:
2. `generateDeviceSessionCookie`
3. `readDeviceSessionCookie`
4. `createClearedDeviceSessionCookie`
5. `registerOrRefreshDeviceSession`
6. `revokeCurrentDeviceSession`
7. `hashSessionToken`
8. `headers` from `next/headers`
9. In `signInWithPassword`:
10. after auth/session creation, generate device cookie based on `input.rememberMe`
11. get request headers via awaited `headers()`
12. call `registerOrRefreshDeviceSession(session.user.id, token, requestHeaders, input.rememberMe, pb)`
13. return `setCookie` as merged array:
14. exported PocketBase auth cookies
15. plus device cookie
16. In `signUpWithPassword`:
17. same logic, but with forced remember mode `true`
18. In `signOutServerSession`:
19. load device token from cookie
20. if token and auth context valid, hash and revoke current device session
21. clear both PB auth cookies and device cookie in response

## 5.3 Step C - Add account device API endpoints

Create `src/app/api/account/devices/route.ts`:
1. `GET` handler:
2. create PB server client
3. reject unauthorized when no valid auth store
4. read device cookie token
5. reject unauthorized if missing token
6. hash token and list sessions with `listActiveDeviceSessions(userId, sessionHash)`
7. response: `{ ok: true, data: deviceSessions }`

Create `src/app/api/account/devices/sign-out-others/route.ts`:
1. `POST` handler:
2. enforce CSRF origin check via `hasValidOrigin(request)` -> `400 BAD_REQUEST` on fail
3. enforce auth + device cookie presence (`401 UNAUTHORIZED`)
4. hash current token
5. call `revokeOtherDeviceSessions(userId, sessionHash)`
6. response: `{ ok: true, data: { signedOutOthers: true } }`

Create `src/app/api/account/devices/[deviceSessionId]/route.ts`:
1. `DELETE` handler with Next.js 16 async params signature:
2. `{ params }: { params: Promise<{ deviceSessionId: string }> }`
3. enforce origin validation (`hasValidOrigin`)
4. enforce auth + device token
5. await params and revoke by ID with current hash guard
6. response: `{ ok: true, data: { signedOut: true } }`

## 5.4 Step D - Replace mock UI with API-backed data

Modify `src/features/account/security/your-devices-settings-item.tsx`:
1. mark file client-side (`"use client"`)
2. add `useState` and `useEffect`
3. define `DeviceSession` UI type:
4. `id`, `deviceLabel`, `deviceType`, `browser`, `os`, `isCurrentDevice`
5. remove old `MOCK_DEVICES` payload and related `DeviceItemProps`
6. remove dependency on `detectDeviceType` helper
7. on mount, fetch `/api/account/devices`, parse JSON, update state when `data.ok`
8. render list from `deviceSessions.map(...)`
9. update icon resolver to accept `deviceType` directly
10. keep current-device badge (`This device`)
11. keep per-device `Sign out` button rendering only for non-current sessions
12. keep "Sign out from all devices" dialog structure

Important parity note:
1. In analyzed implementation, button actions are not connected yet:
2. per-device `Sign out` does not call `DELETE /api/account/devices/[deviceSessionId]`
3. dialog confirm `Sign out all` does not call `POST /api/account/devices/sign-out-others`

## 5.5 Step E - Type generation and schema parity

1. Ensure PB schema has `user_device_sessions`.
2. Run:

```bash
npm run pocketbase:typegen
```

3. Commit generated `src/types/pocketbase.ts`.

Important parity note:
1. Matěj's commit also included additional generated collection types unrelated to device sessions.
2. In a clean reimplementation, include whatever current schema generates; do not manually copy old generated diff.

## 6. Verification Checklist (manual, required)

## 6.1 Sign-in and sign-up lifecycle

1. Sign in with `rememberMe=false`:
2. PB auth cookie set as session-only
3. `app_device_session` set without persistent maxAge
4. one active `user_device_sessions` record created/updated
5. Sign in with `rememberMe=true`:
6. persistent `app_device_session` cookie present
7. `remember_me=true` in session record
8. Sign up flow:
9. new device session created with persistent cookie behavior (`remember=true`)

## 6.2 List and revoke endpoints

1. `GET /api/account/devices` returns `401` when no auth or no device cookie.
2. Authenticated request returns `{ ok: true, data: [...] }`.
3. Current session item has `isCurrentDevice=true`.
4. `POST /api/account/devices/sign-out-others`:
5. rejects invalid origin with `400`
6. revokes all non-current active sessions
7. returns `{ signedOutOthers: true }`
8. `DELETE /api/account/devices/[id]`:
9. rejects invalid origin with `400`
10. no-op for current session ID/hash
11. revokes target non-current session

## 6.3 Sign-out lifecycle

1. Calling sign-out revokes current device session (when token and auth are present).
2. Response clears both PB auth cookies and `app_device_session`.

## 6.4 Device cap and heartbeat behavior

1. With limit `N`, creating `N+1` active sessions revokes oldest non-current sessions with reason `"capped"`.
2. Repeated validation within heartbeat window does not spam `last_seen_at` updates.
3. Validation after heartbeat threshold updates `last_seen_at`.

## 7. Known Gaps Carried by Original Implementation

1. UI revoke buttons are present but not wired to API.
2. `device-sessions-auth-check.ts` helper is not yet integrated into global auth-guard/session-validation flow.
3. No dedicated tests were added in scoped commits.

## 8. Definition of Done for faithful reimplementation

1. All files from section 2 exist with equivalent behavior.
2. Auth lifecycle emits and clears `app_device_session` cookie as described.
3. Device endpoints behave exactly as in section 5.3.
4. Security page reads real backend device data instead of mock list.
5. Remaining known gaps match section 7 (do not silently "improve" if goal is strict parity).

## 9. Optional next patch after parity (outside Matěj scope)

1. Wire UI actions:
2. per-row revoke -> `DELETE /api/account/devices/[deviceSessionId]`
3. dialog confirm -> `POST /api/account/devices/sign-out-others`
4. Add optimistic UI update + retry/error toasts.
5. Integrate `validateDeviceSessionOrInvalidate` into server guard path.
6. Add integration tests for cookie + revoke flows.

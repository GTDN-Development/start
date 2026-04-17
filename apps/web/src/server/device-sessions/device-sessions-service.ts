import { createHash } from "node:crypto";
import { headers } from "next/headers";
import PocketBase, { ClientResponseError } from "pocketbase";
import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import { exportPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";
import {
  formatServiceError,
  isUsersRecord,
  logServiceError,
} from "@/server/pocketbase/pocketbase-utils";
import {
  createClearedAuthAndDeviceCookies,
  createDeviceSessionCookie,
  generateDeviceSessionCookie,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { parseDeviceInfo } from "@/server/device-sessions/device-sessions-ua-parser";
import {
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
  type DeviceSessionListItem,
  type RevokeDeviceSessionByIdResult,
} from "@/server/device-sessions/device-sessions-types";

const DEVICE_SESSIONS_COLLECTION = "user_device_sessions";

type ReadAuthDeviceSessionInput = {
  pb: PocketBase;
  userId: string;
  mode: "read";
};

type WriteAuthDeviceSessionInput = {
  pb: PocketBase;
  userId: string;
  mode: "write";
  shouldPersistSession: boolean;
};

type ResolveCurrentAuthDeviceSessionResult =
  | {
      status: "valid";
      sessionIdHash: string;
    }
  | {
      status: "invalid";
      setCookie?: string[];
    };

type CreateAuthAndDeviceCookiesResult =
  | {
      ok: true;
      setCookie: string[];
    }
  | {
      ok: false;
      errorCode: "UNKNOWN_ERROR";
      setCookie: string[];
    };

type UserDeviceSessionInventory = {
  active: UserDeviceSessionsRecord[];
  expired: UserDeviceSessionsRecord[];
};

type OwnedDeviceSessionState =
  | {
      status: "active";
      session: UserDeviceSessionsRecord;
      sessionIdHash: string;
      now: Date;
    }
  | {
      status: "invalid";
      reason: "missing_token" | "not_found" | "wrong_user" | "expired";
      session: UserDeviceSessionsRecord | null;
    };

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function resolveCurrentAuthDeviceSession(
  input: ReadAuthDeviceSessionInput | WriteAuthDeviceSessionInput
): Promise<ResolveCurrentAuthDeviceSessionResult> {
  const sessionState = await readOwnedDeviceSessionState(
    input.pb,
    input.userId,
    await readDeviceSessionCookie()
  );

  if (sessionState.status !== "active") {
    if (input.mode === "write") {
      await clearInvalidOwnedDeviceSessionIfNeeded(input.pb, input.userId, sessionState);

      return {
        status: "invalid",
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    return {
      status: "invalid",
    };
  }

  if (input.mode === "write") {
    await updateDeviceHeartbeatIfNeeded({
      pb: input.pb,
      session: sessionState.session,
      now: sessionState.now,
      shouldPersistSession: input.shouldPersistSession,
    });
  }

  return {
    status: "valid",
    sessionIdHash: sessionState.sessionIdHash,
  };
}

export async function createAuthAndDeviceCookies(input: {
  pb: PocketBase;
  userId: string;
  rememberMe: boolean;
  existingDeviceSessionToken?: string | null;
  logContext: string;
}): Promise<CreateAuthAndDeviceCookiesResult> {
  const normalizedExistingDeviceSessionToken = input.existingDeviceSessionToken?.trim() ?? "";
  const nextDeviceSession =
    normalizedExistingDeviceSessionToken.length > 0
      ? {
          token: normalizedExistingDeviceSessionToken,
          setCookie: createDeviceSessionCookie(
            normalizedExistingDeviceSessionToken,
            input.rememberMe
          ),
        }
      : generateDeviceSessionCookie(input.rememberMe);

  try {
    const requestHeaders = await headers();

    await registerOrRefreshDeviceSession({
      pb: input.pb,
      userId: input.userId,
      sessionToken: nextDeviceSession.token,
      shouldPersistSession: input.rememberMe,
      requestHeaders,
    });
  } catch (error) {
    console.error(
      `[auth-service] ${input.logContext}: device session registration failed`,
      formatServiceError(error)
    );

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  return {
    ok: true,
    setCookie: [
      ...exportPocketBaseAuthCookies(input.pb, {
        sessionOnly: !input.rememberMe,
      }),
      nextDeviceSession.setCookie,
    ],
  };
}

export async function registerOrRefreshDeviceSession(input: {
  pb: PocketBase;
  userId: string;
  sessionToken: string;
  shouldPersistSession: boolean;
  requestHeaders: Headers;
}): Promise<void> {
  const sessionIdHash = hashSessionToken(input.sessionToken);
  const now = new Date();
  const nowIso = now.toISOString();

  const userAgent = getUserAgent(input.requestHeaders);
  const parsedDeviceInfo = parseDeviceInfo(userAgent);

  const upsertPayload = {
    user: input.userId,
    session_id_hash: sessionIdHash,
    device_label: parsedDeviceInfo.deviceLabel,
    device_type: parsedDeviceInfo.deviceType,
    browser: parsedDeviceInfo.browser,
    os: parsedDeviceInfo.os,
    user_agent: userAgent,
    last_seen_at: nowIso,
    expires_at: createExpiresAt(now, input.shouldPersistSession),
  };

  const existingSession = await findDeviceSessionByHash(input.pb, sessionIdHash);

  if (existingSession) {
    await input.pb.collection(DEVICE_SESSIONS_COLLECTION).update(existingSession.id, upsertPayload);
  } else {
    await input.pb.collection(DEVICE_SESSIONS_COLLECTION).create(upsertPayload);
  }

  await enforceDeviceLimit({
    pb: input.pb,
    userId: input.userId,
    currentSessionIdHash: sessionIdHash,
  });

  try {
    await cleanUpExpiredDeviceSessions({
      pb: input.pb,
      userId: input.userId,
    });
  } catch (error) {
    logDeviceSessionsError("registerOrRefreshDeviceSession.cleanup", error);
  }
}

export async function listDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<DeviceSessionListItem[]> {
  const { active } = await getUserDeviceSessionInventory(input.pb, input.userId, "-last_seen_at");

  return active.map((session) => mapDeviceSessionListItem(session, input.currentSessionIdHash));
}

async function revokeCurrentDeviceSession(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<void> {
  const now = new Date();
  const session = await findDeviceSessionByHash(input.pb, input.currentSessionIdHash);

  if (!isActiveOwnedDeviceSession(session, input.userId, now)) {
    return;
  }

  await deleteDeviceSessionSafely(input.pb, session.id);
}

export async function revokeCurrentAuthDeviceSession(input: {
  pb: PocketBase;
  logContext: string;
}): Promise<void> {
  const deviceSessionToken = await readDeviceSessionCookie();

  if (
    !deviceSessionToken ||
    !input.pb.authStore.isValid ||
    !isUsersRecord(input.pb.authStore.record)
  ) {
    return;
  }

  try {
    await revokeCurrentDeviceSession({
      pb: input.pb,
      userId: input.pb.authStore.record.id,
      currentSessionIdHash: hashSessionToken(deviceSessionToken),
    });
  } catch (error) {
    console.warn(
      `[auth-service] ${input.logContext}: device session revoke failed, continuing`,
      formatServiceError(error)
    );
  }
}

export async function revokeOtherDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<number> {
  const { active } = await getUserDeviceSessionInventory(input.pb, input.userId, "-last_seen_at");

  return deleteDeviceSessionsAndCount(
    input.pb,
    active.filter((session) => session.session_id_hash !== input.currentSessionIdHash)
  );
}

export async function revokeAllDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
}): Promise<number> {
  const { active } = await getUserDeviceSessionInventory(input.pb, input.userId, "-last_seen_at");

  return deleteDeviceSessionsAndCount(input.pb, active);
}

export async function revokeDeviceSessionById(input: {
  pb: PocketBase;
  userId: string;
  deviceSessionId: string;
  currentSessionIdHash: string;
}): Promise<RevokeDeviceSessionByIdResult> {
  const now = new Date();
  const deviceSession = await findDeviceSessionById(input.pb, input.deviceSessionId);

  if (!isActiveOwnedDeviceSession(deviceSession, input.userId, now)) {
    return "not_found";
  }

  if (deviceSession.session_id_hash === input.currentSessionIdHash) {
    return "current_device";
  }

  await deleteDeviceSessionSafely(input.pb, deviceSession.id);

  return "revoked";
}

async function cleanUpExpiredDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
}): Promise<number> {
  const { expired } = await getUserDeviceSessionInventory(input.pb, input.userId);

  return deleteDeviceSessionsAndCount(input.pb, expired);
}

async function enforceDeviceLimit(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<void> {
  if (MAX_ACTIVE_SESSIONS === null) {
    return;
  }

  const { active } = await getUserDeviceSessionInventory(input.pb, input.userId, "+last_seen_at");

  if (active.length <= MAX_ACTIVE_SESSIONS) {
    return;
  }

  const sessionsToRevokeCount = active.length - MAX_ACTIVE_SESSIONS;
  const revokeCandidates = active.filter(
    (session) => session.session_id_hash !== input.currentSessionIdHash
  );

  for (const session of revokeCandidates.slice(0, sessionsToRevokeCount)) {
    await deleteDeviceSessionSafely(input.pb, session.id);
  }
}

async function readOwnedDeviceSessionState(
  pb: PocketBase,
  userId: string,
  deviceSessionToken: string | null
): Promise<OwnedDeviceSessionState> {
  if (!deviceSessionToken) {
    return {
      status: "invalid",
      reason: "missing_token",
      session: null,
    };
  }

  const sessionIdHash = hashSessionToken(deviceSessionToken);
  const session = await findDeviceSessionByHash(pb, sessionIdHash);

  if (!session) {
    return {
      status: "invalid",
      reason: "not_found",
      session: null,
    };
  }

  if (session.user !== userId) {
    return {
      status: "invalid",
      reason: "wrong_user",
      session,
    };
  }

  const now = new Date();

  if (!isActiveDeviceSession(session, now)) {
    return {
      status: "invalid",
      reason: "expired",
      session,
    };
  }

  return {
    status: "active",
    session,
    sessionIdHash,
    now,
  };
}

async function findDeviceSessionByHash(
  pb: PocketBase,
  sessionIdHash: string
): Promise<UserDeviceSessionsRecord | null> {
  return readDeviceSessionOrNull(() =>
    pb
      .collection(DEVICE_SESSIONS_COLLECTION)
      .getFirstListItem<UserDeviceSessionsRecord>(
        `session_id_hash = "${escapeFilterValue(sessionIdHash)}"`
      )
  );
}

async function findDeviceSessionById(
  pb: PocketBase,
  deviceSessionId: string
): Promise<UserDeviceSessionsRecord | null> {
  return readDeviceSessionOrNull(() =>
    pb.collection(DEVICE_SESSIONS_COLLECTION).getOne<UserDeviceSessionsRecord>(deviceSessionId)
  );
}

async function listDeviceSessionsForUser(
  pb: PocketBase,
  userId: string,
  sort?: string
): Promise<UserDeviceSessionsRecord[]> {
  return pb.collection(DEVICE_SESSIONS_COLLECTION).getFullList<UserDeviceSessionsRecord>({
    filter: `user = "${escapeFilterValue(userId)}"`,
    ...(sort ? { sort } : {}),
  });
}

async function getUserDeviceSessionInventory(
  pb: PocketBase,
  userId: string,
  sort?: string
): Promise<UserDeviceSessionInventory> {
  return partitionDeviceSessionsByActivity(await listDeviceSessionsForUser(pb, userId, sort));
}

async function readDeviceSessionOrNull(
  loadDeviceSession: () => Promise<UserDeviceSessionsRecord>
): Promise<UserDeviceSessionsRecord | null> {
  try {
    return await loadDeviceSession();
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function clearInvalidOwnedDeviceSessionIfNeeded(
  pb: PocketBase,
  userId: string,
  sessionState: Exclude<OwnedDeviceSessionState, { status: "active" }>
): Promise<void> {
  if (!sessionState.session || sessionState.session.user !== userId) {
    return;
  }

  try {
    await deleteDeviceSessionSafely(pb, sessionState.session.id);
  } catch (error) {
    logDeviceSessionsError("resolveCurrentAuthDeviceSession.deleteInvalid", error);
  }
}

async function updateDeviceHeartbeatIfNeeded(input: {
  pb: PocketBase;
  session: UserDeviceSessionsRecord;
  now: Date;
  shouldPersistSession: boolean;
}): Promise<boolean> {
  const lastSeenAtMs = parseDateToTimestamp(input.session.last_seen_at);
  const heartbeatThresholdMs = HEARTBEAT_MIN_SECONDS * 1000;

  if (lastSeenAtMs !== null && input.now.getTime() - lastSeenAtMs < heartbeatThresholdMs) {
    return false;
  }

  try {
    await input.pb.collection(DEVICE_SESSIONS_COLLECTION).update(input.session.id, {
      last_seen_at: input.now.toISOString(),
      expires_at: createExpiresAt(input.now, input.shouldPersistSession),
    });
    return true;
  } catch (error) {
    if (isExpectedHeartbeatError(error)) {
      return false;
    }

    console.warn(
      "[device-sessions-service] updateDeviceHeartbeatIfNeeded",
      formatServiceError(error)
    );
    return false;
  }
}

async function deleteDeviceSessionSafely(pb: PocketBase, deviceSessionId: string): Promise<void> {
  try {
    await pb.collection(DEVICE_SESSIONS_COLLECTION).delete(deviceSessionId);
  } catch (error) {
    if (isNotFoundError(error)) {
      return;
    }

    throw error;
  }
}

async function deleteDeviceSessionsAndCount(
  pb: PocketBase,
  sessions: Pick<UserDeviceSessionsRecord, "id">[]
): Promise<number> {
  if (sessions.length === 0) {
    return 0;
  }

  for (const session of sessions) {
    await deleteDeviceSessionSafely(pb, session.id);
  }

  return sessions.length;
}

function mapDeviceSessionListItem(
  session: UserDeviceSessionsRecord,
  currentSessionIdHash: string
): DeviceSessionListItem {
  return {
    id: session.id,
    deviceLabel: session.device_label,
    deviceType: session.device_type,
    browser: getNullableString(session.browser),
    os: getNullableString(session.os),
    userAgent: getNullableString(session.user_agent),
    lastSeenAt: session.last_seen_at,
    createdAt: session.created,
    isCurrentDevice: session.session_id_hash === currentSessionIdHash,
  };
}

function partitionDeviceSessionsByActivity(
  sessions: UserDeviceSessionsRecord[]
): UserDeviceSessionInventory {
  const now = new Date();
  const inventory: UserDeviceSessionInventory = {
    active: [],
    expired: [],
  };

  for (const session of sessions) {
    if (isActiveDeviceSession(session, now)) {
      inventory.active.push(session);
      continue;
    }

    inventory.expired.push(session);
  }

  return inventory;
}

function isActiveOwnedDeviceSession(
  session: UserDeviceSessionsRecord | null,
  userId: string,
  now: Date
): session is UserDeviceSessionsRecord {
  return Boolean(session && session.user === userId && isActiveDeviceSession(session, now));
}

function isActiveDeviceSession(session: UserDeviceSessionsRecord, now: Date): boolean {
  const expiresAtMs = parseDateToTimestamp(session.expires_at);

  if (expiresAtMs === null) {
    return false;
  }

  return expiresAtMs > now.getTime();
}

function parseDateToTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.getTime();
}

function createExpiresAt(now: Date, shouldPersistSession: boolean): string {
  const maxAgeSeconds = shouldPersistSession
    ? DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS
    : DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS;

  return new Date(now.getTime() + maxAgeSeconds * 1000).toISOString();
}

function getUserAgent(requestHeaders: Headers): string {
  return requestHeaders.get("user-agent")?.trim() ?? "";
}

function getNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return null;
  }

  return normalizedValue;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 404;
}

function isExpectedHeartbeatError(error: unknown): boolean {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  return error.status === 401 || error.status === 403 || error.status === 404;
}

function escapeFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function logDeviceSessionsError(context: string, error: unknown): void {
  logServiceError("device-sessions-service", context, error);
}

import { createHash } from "node:crypto";
import PocketBase, { ClientResponseError } from "pocketbase";
import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import { formatServiceError, logServiceError } from "@/server/pocketbase/pocketbase-utils";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import { parseDeviceInfo } from "@/server/device-sessions/device-sessions-ua-parser";
import {
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
  type DeviceSessionAuthCheckResult,
  type DeviceSessionReadOnlyCheckResult,
  type DeviceSessionRecord,
  type DeviceSessionListItem,
  type RevokeDeviceSessionByIdResult,
} from "@/server/device-sessions/device-sessions-types";

const DEVICE_SESSIONS_COLLECTION = "user_device_sessions";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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

export async function validateDeviceSessionOrInvalidate(input: {
  pb: PocketBase;
  userId: string;
  deviceSessionToken: string | null;
  shouldUpdateHeartbeat: boolean;
  shouldPersistSession: boolean;
}): Promise<DeviceSessionAuthCheckResult> {
  const sessionState = await readDeviceSessionAuthState(input);

  if (sessionState.status === "invalid") {
    if (sessionState.session && sessionState.session.user === input.userId) {
      try {
        await deleteDeviceSessionSafely(input.pb, sessionState.session.id);
      } catch (error) {
        logDeviceSessionsError("validateDeviceSessionOrInvalidate.deleteInvalid", error);
      }
    }

    return {
      status: "invalid",
      clearCookies: createClearedAuthAndDeviceCookies(),
    };
  }

  if (input.shouldUpdateHeartbeat) {
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

export async function checkDeviceSessionReadOnly(input: {
  pb: PocketBase;
  userId: string;
  deviceSessionToken: string | null;
}): Promise<DeviceSessionReadOnlyCheckResult> {
  const sessionState = await readDeviceSessionAuthState(input);

  if (sessionState.status === "invalid") {
    return {
      status: "invalid",
    };
  }

  return {
    status: "valid",
    sessionIdHash: sessionState.sessionIdHash,
  };
}

export async function listDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<DeviceSessionListItem[]> {
  const sessions = await listDeviceSessionsForUser(input.pb, input.userId, "-last_seen_at");
  const now = new Date();
  const activeSessions = sessions.filter((session) => isActiveDeviceSession(session, now));

  return activeSessions.map((session) =>
    mapDeviceSessionListItem(session, input.currentSessionIdHash)
  );
}

export async function revokeCurrentDeviceSession(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<void> {
  const session = await findDeviceSessionByHash(input.pb, input.currentSessionIdHash);

  if (!session || session.user !== input.userId || !isActiveDeviceSession(session, new Date())) {
    return;
  }

  await deleteDeviceSessionSafely(input.pb, session.id);
}

export async function revokeOtherDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<number> {
  const sessions = await listDeviceSessionsForUser(input.pb, input.userId, "-last_seen_at");
  const now = new Date();

  const sessionsToRevoke = sessions.filter(
    (session) =>
      session.session_id_hash !== input.currentSessionIdHash && isActiveDeviceSession(session, now)
  );

  if (sessionsToRevoke.length === 0) {
    return 0;
  }

  for (const session of sessionsToRevoke) {
    await deleteDeviceSessionSafely(input.pb, session.id);
  }

  return sessionsToRevoke.length;
}

export async function revokeAllDeviceSessions(input: {
  pb: PocketBase;
  userId: string;
}): Promise<number> {
  const sessions = await listDeviceSessionsForUser(input.pb, input.userId, "-last_seen_at");
  const now = new Date();
  const sessionsToRevoke = sessions.filter((session) => isActiveDeviceSession(session, now));

  if (sessionsToRevoke.length === 0) {
    return 0;
  }

  for (const session of sessionsToRevoke) {
    await deleteDeviceSessionSafely(input.pb, session.id);
  }

  return sessionsToRevoke.length;
}

export async function revokeDeviceSessionById(input: {
  pb: PocketBase;
  userId: string;
  deviceSessionId: string;
  currentSessionIdHash: string;
}): Promise<RevokeDeviceSessionByIdResult> {
  const deviceSession = await findDeviceSessionById(input.pb, input.deviceSessionId);

  if (
    !deviceSession ||
    deviceSession.user !== input.userId ||
    !isActiveDeviceSession(deviceSession, new Date())
  ) {
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
  const sessions = await listDeviceSessionsForUser(input.pb, input.userId);
  const now = new Date();
  const expiredSessions = sessions.filter((session) => !isActiveDeviceSession(session, now));

  if (expiredSessions.length === 0) {
    return 0;
  }

  for (const expiredSession of expiredSessions) {
    await deleteDeviceSessionSafely(input.pb, expiredSession.id);
  }

  return expiredSessions.length;
}

async function enforceDeviceLimit(input: {
  pb: PocketBase;
  userId: string;
  currentSessionIdHash: string;
}): Promise<void> {
  if (MAX_ACTIVE_SESSIONS === null) {
    return;
  }

  const sessions = await listDeviceSessionsForUser(input.pb, input.userId, "+last_seen_at");
  const now = new Date();
  const activeSessions = sessions.filter((session) => isActiveDeviceSession(session, now));

  if (activeSessions.length <= MAX_ACTIVE_SESSIONS) {
    return;
  }

  const sessionsToRevokeCount = activeSessions.length - MAX_ACTIVE_SESSIONS;
  const revokeCandidates = activeSessions.filter(
    (session) => session.session_id_hash !== input.currentSessionIdHash
  );

  for (const session of revokeCandidates.slice(0, sessionsToRevokeCount)) {
    await deleteDeviceSessionSafely(input.pb, session.id);
  }
}

async function readDeviceSessionAuthState(input: {
  pb: PocketBase;
  userId: string;
  deviceSessionToken: string | null;
}): Promise<
  | {
      status: "valid";
      session: DeviceSessionRecord;
      sessionIdHash: string;
      now: Date;
    }
  | {
      status: "invalid";
      session: DeviceSessionRecord | null;
    }
> {
  if (!input.deviceSessionToken) {
    return {
      status: "invalid",
      session: null,
    };
  }

  const sessionIdHash = hashSessionToken(input.deviceSessionToken);
  const now = new Date();
  const session = await findDeviceSessionByHash(input.pb, sessionIdHash);

  if (!session || session.user !== input.userId || !isActiveDeviceSession(session, now)) {
    return {
      status: "invalid",
      session,
    };
  }

  return {
    status: "valid",
    session,
    sessionIdHash,
    now,
  };
}

async function findDeviceSessionByHash(
  pb: PocketBase,
  sessionIdHash: string
): Promise<UserDeviceSessionsRecord | null> {
  try {
    return await pb
      .collection(DEVICE_SESSIONS_COLLECTION)
      .getFirstListItem<UserDeviceSessionsRecord>(
        `session_id_hash = "${escapeFilterValue(sessionIdHash)}"`
      );
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function findDeviceSessionById(
  pb: PocketBase,
  deviceSessionId: string
): Promise<UserDeviceSessionsRecord | null> {
  try {
    return await pb
      .collection(DEVICE_SESSIONS_COLLECTION)
      .getOne<UserDeviceSessionsRecord>(deviceSessionId);
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

async function listDeviceSessionsForUser(
  pb: PocketBase,
  userId: string,
  sort?: string
): Promise<UserDeviceSessionsRecord[]> {
  const options: {
    filter: string;
    sort?: string;
  } = {
    filter: `user = "${escapeFilterValue(userId)}"`,
  };

  if (sort) {
    options.sort = sort;
  }

  return pb.collection(DEVICE_SESSIONS_COLLECTION).getFullList<UserDeviceSessionsRecord>(options);
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

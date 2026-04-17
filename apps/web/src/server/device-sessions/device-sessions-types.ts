import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import { securityConfig } from "@/config/security";

export const DEVICE_SESSION_COOKIE_NAME = securityConfig.deviceSessions.cookieName;
export const DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS =
  securityConfig.deviceSessions.persistentMaxAgeSeconds;
export const DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS =
  securityConfig.deviceSessions.sessionOnlyMaxAgeSeconds;
export const HEARTBEAT_MIN_SECONDS = securityConfig.deviceSessions.heartbeatMinSeconds;
export const MAX_ACTIVE_SESSIONS: number | null = securityConfig.deviceSessions.maxActiveSessions;

export type DeviceSessionDeviceType = UserDeviceSessionsRecord["device_type"];

export type ParsedDeviceInfo = {
  deviceLabel: string;
  deviceType: DeviceSessionDeviceType;
  browser: string;
  os: string;
};

export type DeviceSessionListItem = {
  id: string;
  deviceLabel: string;
  deviceType: DeviceSessionDeviceType;
  browser: string | null;
  os: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrentDevice: boolean;
};

export type RevokeDeviceSessionByIdResult = "revoked" | "not_found" | "current_device";

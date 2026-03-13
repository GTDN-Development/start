import type { UserDeviceSessionsRecord } from "@/types/pocketbase";

export const DEVICE_SESSION_COOKIE_NAME = "app_device_session";
export const DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;
export const HEARTBEAT_MIN_SECONDS = 5 * 60;
export const REVOKED_RETENTION_DAYS = 30;
export const EXPIRED_RETENTION_DAYS = 7;

/**
 * v1 keeps the limit disabled. Set this to a number (e.g. 3 or 5)
 * to enable LRU revocation without changing API/UI contracts.
 */
export const MAX_ACTIVE_SESSIONS: number | null = null;

export type DeviceSessionRecord = UserDeviceSessionsRecord;
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
  ipMasked: string | null;
  locationLabel: string | null;
  lastSeenAt: string;
  createdAt: string;
  isCurrentDevice: boolean;
};

export type DeviceSessionAuthCheckResult =
  | {
      status: "valid";
      sessionIdHash: string;
    }
  | {
      status: "invalid";
      clearCookies: string[];
    };

export type RevokeDeviceSessionByIdResult = "revoked" | "not_found" | "current_device";

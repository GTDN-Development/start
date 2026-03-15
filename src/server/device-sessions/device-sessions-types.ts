import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import {
  DEVICE_SESSION_COOKIE_NAME,
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  EXPIRED_RETENTION_DAYS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
  REVOKED_RETENTION_DAYS,
} from "@/config/security";

export {
  DEVICE_SESSION_COOKIE_NAME,
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  EXPIRED_RETENTION_DAYS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
  REVOKED_RETENTION_DAYS,
};

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

import { headers } from "next/headers";
import type PocketBase from "pocketbase";
import {
  createClearedAuthAndDeviceCookies,
  createDeviceSessionCookie,
  generateDeviceSessionCookie,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  hashSessionToken,
  checkDeviceSessionReadOnly,
  registerOrRefreshDeviceSession,
  revokeCurrentDeviceSession,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { formatServiceError, isUsersRecord } from "@/server/pocketbase/pocketbase-utils";
import { exportPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";

type AuthDeviceSessionMode = "read" | "write";

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

export async function resolveCurrentAuthDeviceSession(input: {
  pb: PocketBase;
  userId: string;
  mode: AuthDeviceSessionMode;
}): Promise<ResolveCurrentAuthDeviceSessionResult> {
  const deviceSessionToken = await readDeviceSessionCookie();

  if (input.mode === "read") {
    const deviceSessionCheck = await checkDeviceSessionReadOnly({
      pb: input.pb,
      userId: input.userId,
      deviceSessionToken,
    });

    if (deviceSessionCheck.status === "invalid") {
      return {
        status: "invalid",
      };
    }

    return {
      status: "valid",
      sessionIdHash: deviceSessionCheck.sessionIdHash,
    };
  }

  const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
    pb: input.pb,
    userId: input.userId,
    deviceSessionToken,
    shouldUpdateHeartbeat: true,
  });

  if (deviceSessionCheck.status === "invalid") {
    return {
      status: "invalid",
      setCookie: deviceSessionCheck.clearCookies,
    };
  }

  return {
    status: "valid",
    sessionIdHash: deviceSessionCheck.sessionIdHash,
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
      rememberMe: input.rememberMe,
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

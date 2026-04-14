import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import {
  resolveRenderAuthenticatedUser,
  resolveWritableAuthenticatedUser,
} from "@/server/auth/auth-user-resolution";

type RequireCurrentUserErrorCode = "UNAUTHORIZED" | "UNKNOWN_ERROR";

export type RequireCurrentUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
    };

export type RequireCurrentWritableUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
      setCookie?: string[];
    };

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const currentUser = await resolveRenderAuthenticatedUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}

export async function requireCurrentWritableUser(): Promise<RequireCurrentWritableUserResult> {
  const currentUser = await resolveWritableAuthenticatedUser();

  if (currentUser.status !== "authenticated") {
    return {
      ok: false,
      errorCode: currentUser.status === "unknown_error" ? "UNKNOWN_ERROR" : "UNAUTHORIZED",
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}

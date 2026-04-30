import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { resolveCurrentServerAuth } from "@/server/auth/auth-user-resolution";

type RequireCurrentUserErrorCode = "UNAUTHORIZED" | "UNKNOWN_ERROR";

export type RequireCurrentUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
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
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
      setCookie?: string[];
    };

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const currentUser = await resolveCurrentServerAuth({
    mode: "read",
  });

  if (currentUser.status !== "authenticated") {
    return {
      ok: false,
      errorCode: currentUser.status === "unknown_error" ? "UNKNOWN_ERROR" : "UNAUTHORIZED",
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
  };
}

export async function requireCurrentWritableUser(): Promise<RequireCurrentWritableUserResult> {
  const currentUser = await resolveCurrentServerAuth({
    mode: "write",
  });
  const isStaleAuthenticatedUser =
    currentUser.status === "authenticated" && currentUser.isStale === true;

  if (currentUser.status !== "authenticated" || isStaleAuthenticatedUser) {
    return {
      ok: false,
      errorCode:
        currentUser.status === "unknown_error" || isStaleAuthenticatedUser
          ? "UNKNOWN_ERROR"
          : "UNAUTHORIZED",
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
  };
}

import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { resolveAuthenticatedUser } from "@/server/auth/auth-user-resolution";

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

export type RequireCurrentActionUserResult =
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
  const currentUser = await resolveAuthenticatedUser({
    mode: "render",
  });

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

export async function requireCurrentActionUser(): Promise<RequireCurrentActionUserResult> {
  const currentUser = await resolveAuthenticatedUser({
    mode: "action",
  });

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
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

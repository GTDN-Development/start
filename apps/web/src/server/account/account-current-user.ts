import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { requireCurrentActionUser } from "@/server/auth/current-user";
import type { ServerAuthResponse } from "@/server/auth/auth-response";

export type RequireCurrentAccountUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      response: ServerAuthResponse<never>;
    };

export async function requireCurrentAccountUser(): Promise<RequireCurrentAccountUserResult> {
  const currentUser = await requireCurrentActionUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
        ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
      },
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}

import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { requireCurrentUser as requireAuthenticatedUser } from "@/server/auth/current-user";
import type { ServerWorkspaceResponse } from "@/server/workspaces/workspace-types";

export type WorkspaceAuthContext = {
  pb: PocketBase;
  user: UsersRecord;
};

type WorkspaceAuthContextResult =
  | {
      ok: true;
      context: WorkspaceAuthContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

export async function requireWorkspaceAuthContext(): Promise<WorkspaceAuthContextResult> {
  const currentUser = await requireAuthenticatedUser();

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
    context: {
      pb: currentUser.pb,
      user: currentUser.user,
    },
  };
}

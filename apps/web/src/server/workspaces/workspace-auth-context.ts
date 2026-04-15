import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { requireCurrentWritableUser, requireCurrentUser } from "@/server/auth/current-user";
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
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
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

export async function requireWorkspaceActionContext(): Promise<WorkspaceAuthContextResult> {
  const currentUser = await requireCurrentWritableUser();

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

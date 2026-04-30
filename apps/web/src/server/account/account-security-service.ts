import type { UsersRecord } from "@/types/pocketbase";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import { createClearedPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";
import {
  countWorkspaceOwners,
  listUserWorkspaceMembershipRecords,
} from "@/server/workspaces/workspace-repository";
import {
  getUnauthorizedAccountCookies,
  logAccountServiceError,
  mapDeleteAccountErrorCode,
  mapDeleteAccountPasswordErrorCode,
  mapUpdatePasswordErrorCode,
} from "@/server/account/account-errors";
import { requireCurrentWritableUser } from "@/server/auth/current-user";

type DeleteAccountPayload = {
  deleted: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

export async function deleteCurrentUserAccountWithPassword(
  password: string
): Promise<ServerAuthResponse<DeleteAccountPayload>> {
  if (!password.trim()) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  try {
    await currentUser.pb
      .collection("users")
      .authWithPassword<UsersRecord>(currentUser.user.email, password);
  } catch (error) {
    const errorCode = mapDeleteAccountPasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("deleteCurrentUserAccountWithPassword.verifyPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }

  try {
    const workspaceMemberships = await listUserWorkspaceMembershipRecords(
      currentUser.pb,
      currentUser.user.id
    );
    const ownerMemberships = workspaceMemberships.filter(
      (membership) => membership.role === "owner"
    );

    for (const ownerMembership of ownerMemberships) {
      const ownerCount = await countWorkspaceOwners(currentUser.pb, ownerMembership.workspace);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "ACCOUNT_DELETE_BLOCKED_LAST_OWNER",
        };
      }
    }

    await currentUser.pb.collection("users").delete(currentUser.user.id);

    return {
      ok: true,
      data: {
        deleted: true,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  } catch (error) {
    const errorCode = mapDeleteAccountErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("deleteCurrentUserAccountWithPassword.delete", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}

export async function updateCurrentUserPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ServerAuthResponse<UpdateAccountPasswordPayload>> {
  if (!input.currentPassword.trim() || !input.newPassword.trim() || !input.confirmPassword.trim()) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  try {
    await currentUser.pb.collection("users").update<UsersRecord>(currentUser.user.id, {
      oldPassword: input.currentPassword,
      password: input.newPassword,
      passwordConfirm: input.confirmPassword,
    });

    return {
      ok: true,
      data: {
        passwordUpdated: true,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  } catch (error) {
    const errorCode = mapUpdatePasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}

import { ClientResponseError } from "pocketbase";
import type PocketBase from "pocketbase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    requireCurrentWritableUser: vi.fn(),
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createClearedPocketBaseAuthCookies: vi.fn(),
  };
});

import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { createClearedPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";
import {
  deleteCurrentUserAccountWithPassword,
  updateCurrentUserPassword,
} from "./account-security-service";

describe("account-service", function describeAccountService() {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(function suppressErrorLog() {
      return undefined;
    });
    vi.mocked(createClearedPocketBaseAuthCookies).mockReturnValue(["pb_auth=; Max-Age=0"]);
  });

  afterEach(function restoreConsoleSpies() {
    consoleErrorSpy.mockRestore();
  });

  it("blocks account deletion for the final workspace owner", async function testDeleteBlockedLastOwner() {
    const currentUser = createCurrentUserContext();

    currentUser.usersCollection.authWithPassword.mockResolvedValue({
      record: currentUser.user,
    });
    currentUser.usersCollection.delete.mockRejectedValue(createLastOwnerGuardError());
    vi.mocked(requireCurrentWritableUser).mockResolvedValue(currentUser.result);

    const response = await deleteCurrentUserAccountWithPassword("secret-password");

    expect(response).toEqual({
      ok: false,
      errorCode: "ACCOUNT_DELETE_BLOCKED_LAST_OWNER",
    });
    expect(currentUser.usersCollection.delete).toHaveBeenCalledWith(currentUser.user.id);
  });

  it("deletes the user record and clears cookies when account deletion succeeds", async function testDeleteHappyPath() {
    const currentUser = createCurrentUserContext();

    currentUser.usersCollection.authWithPassword.mockResolvedValue({
      record: currentUser.user,
    });
    vi.mocked(requireCurrentWritableUser).mockResolvedValue(currentUser.result);

    const response = await deleteCurrentUserAccountWithPassword("secret-password");

    expect(response).toEqual({
      ok: true,
      data: {
        deleted: true,
      },
      setCookie: ["pb_auth=; Max-Age=0"],
    });
    expect(currentUser.usersCollection.delete).toHaveBeenCalledWith(currentUser.user.id);
  });

  it("clears PocketBase auth cookies after a successful password change", async function testUpdatePasswordSuccess() {
    const currentUser = createCurrentUserContext();

    vi.mocked(requireCurrentWritableUser).mockResolvedValue(currentUser.result);

    const response = await updateCurrentUserPassword({
      currentPassword: "current-password",
      newPassword: "next-password",
      confirmPassword: "next-password",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        passwordUpdated: true,
      },
      setCookie: ["pb_auth=; Max-Age=0"],
    });
    expect(currentUser.usersCollection.update).toHaveBeenCalledWith(currentUser.user.id, {
      oldPassword: "current-password",
      password: "next-password",
      passwordConfirm: "next-password",
    });
  });
});

function createCurrentUserContext() {
  const usersCollection = {
    authWithPassword: vi.fn(),
    delete: vi.fn(async function deleteUser() {
      return undefined;
    }),
    update: vi.fn(async function updateUser() {
      return undefined;
    }),
  };
  const pb = createPocketBaseMock({
    users: usersCollection,
  });
  const user = createUserRecord("user-1", "user@example.com");

  return {
    pb,
    result: {
      ok: true as const,
      pb,
      user,
    },
    user,
    usersCollection,
  };
}

function createPocketBaseMock(collections: Record<string, unknown>): PocketBase {
  return {
    collection: vi.fn(function getCollection(name: string) {
      const collection = collections[name];

      if (!collection) {
        throw new Error(`Unexpected collection: ${name}`);
      }

      return collection;
    }),
  } as unknown as PocketBase;
}

function createUserRecord(id: string, email: string): UsersRecord {
  return {
    id,
    avatar: "",
    collectionId: "users",
    collectionName: "users",
    created: "2026-01-01T00:00:00.000Z",
    email,
    name: "User",
    updated: "2026-01-01T00:00:00.000Z",
    verified: true,
  };
}

function createLastOwnerGuardError() {
  return new ClientResponseError({
    url: "https://example.com/api/collections/users/records/user-1",
    status: 400,
    response: {
      data: {
        code: "LAST_OWNER_GUARD",
      },
    },
  });
}

import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import PocketBase, { ClientResponseError } from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD } from "../../helpers/auth";
import {
  createPocketBaseAdminClient,
  createPocketBaseUserClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../../helpers/test-run";

test("PocketBase user device session rules enforce owner-only access", async () => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const userAEmail = createIsolatedTestEmail(run.id, "device-session-rules-user-a");
  const userBEmail = createIsolatedTestEmail(run.id, "device-session-rules-user-b");

  let adminPb: PocketBase | null = null;
  let userAClient: PocketBase | null = null;

  try {
    adminPb = await createPocketBaseAdminClient();

    const userA = await createVerifiedUser({
      pb: adminPb,
      email: userAEmail,
      password,
    });
    const userB = await createVerifiedUser({
      pb: adminPb,
      email: userBEmail,
      password,
    });

    const userASession = await adminPb.collection("user_device_sessions").create({
      user: userA.id,
      session_id_hash: createSessionHash(`${run.id}-user-a-session`),
      device_label: "User A Device",
      device_type: "desktop",
      last_seen_at: createFutureIso(5),
      expires_at: createFutureIso(60),
    });
    const userBSession = await adminPb.collection("user_device_sessions").create({
      user: userB.id,
      session_id_hash: createSessionHash(`${run.id}-user-b-session`),
      device_label: "User B Device",
      device_type: "desktop",
      last_seen_at: createFutureIso(10),
      expires_at: createFutureIso(60),
    });

    userAClient = await createPocketBaseUserClient({
      email: userAEmail,
      password,
    });

    const guestClient = createGuestPocketBaseClient();
    const guestVisibleSessions = await guestClient.collection("user_device_sessions").getFullList();

    expect(guestVisibleSessions).toEqual([]);

    const visibleUserASessions = await userAClient.collection("user_device_sessions").getFullList();

    expect(visibleUserASessions).toHaveLength(1);
    expect(visibleUserASessions[0]?.id).toBe(userASession.id);

    await expectPocketBaseReject(
      userAClient.collection("user_device_sessions").getOne(userBSession.id),
      [403, 404]
    );

    await expectPocketBaseReject(
      userAClient.collection("user_device_sessions").update(userBSession.id, {
        last_seen_at: createFutureIso(15),
      }),
      [403, 404]
    );

    await expectPocketBaseReject(
      userAClient.collection("user_device_sessions").delete(userBSession.id),
      [403, 404]
    );

    await expectPocketBaseReject(
      userAClient.collection("user_device_sessions").create({
        user: userB.id,
        session_id_hash: createSessionHash(`${run.id}-cross-user-create`),
        device_label: "Cross User Device",
        device_type: "desktop",
        last_seen_at: createFutureIso(20),
        expires_at: createFutureIso(60),
      }),
      [400, 403]
    );

    await expectPocketBaseReject(
      userAClient.collection("user_device_sessions").update(userASession.id, {
        user: userB.id,
      }),
      [400, 403, 404]
    );

    const nextLastSeenAt = createFutureIso(25);
    const updatedUserASession = await userAClient
      .collection("user_device_sessions")
      .update(userASession.id, {
        last_seen_at: nextLastSeenAt,
      });

    expect(normalizeIsoDate(updatedUserASession.last_seen_at)).toBe(
      normalizeIsoDate(nextLastSeenAt)
    );
    expect(updatedUserASession.user).toBe(userA.id);

    const refreshedUserASession = await adminPb
      .collection("user_device_sessions")
      .getOne(userASession.id);
    const refreshedUserBSession = await adminPb
      .collection("user_device_sessions")
      .getOne(userBSession.id);

    expect(normalizeIsoDate(refreshedUserASession.last_seen_at)).toBe(
      normalizeIsoDate(nextLastSeenAt)
    );
    expect(refreshedUserASession.user).toBe(userA.id);
    expect(refreshedUserBSession.user).toBe(userB.id);
    expect(refreshedUserBSession.device_label).toBe("User B Device");
  } finally {
    if (adminPb) {
      await deleteSignedUpUsersByEmail(adminPb, userAEmail);
      await deleteSignedUpUsersByEmail(adminPb, userBEmail);
    }
  }
});

function createGuestPocketBaseClient(): PocketBase {
  const pb = new PocketBase(getRequiredTestEnv("NEXT_PUBLIC_PB_URL"));

  pb.autoCancellation(false);

  return pb;
}

function createFutureIso(minutesFromNow: number): string {
  return new Date(Date.now() + minutesFromNow * 60 * 1000).toISOString();
}

function createSessionHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeIsoDate(value: string): string {
  return new Date(value).toISOString();
}

async function expectPocketBaseReject(
  promise: Promise<unknown>,
  expectedStatuses: number[]
): Promise<void> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ClientResponseError);
    expect(expectedStatuses).toContain((error as ClientResponseError).status);
    return;
  }

  throw new Error("Expected PocketBase request to be rejected.");
}

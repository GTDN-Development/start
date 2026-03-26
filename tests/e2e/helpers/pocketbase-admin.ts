import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import { getRequiredTestEnv } from "./test-env";

export async function createPocketBaseAdminClient(): Promise<PocketBase> {
  const pb = new PocketBase(getRequiredTestEnv("NEXT_PUBLIC_PB_URL"));

  pb.autoCancellation(false);

  await pb
    .collection("_superusers")
    .authWithPassword(
      getRequiredTestEnv("PB_SUPERUSER_EMAIL"),
      getRequiredTestEnv("PB_SUPERUSER_PASSWORD")
    );

  return pb;
}

export async function deleteSignedUpUsersByEmail(pb: PocketBase, email: string): Promise<void> {
  const users = await pb.collection("users").getFullList<RecordModel>({
    filter: pb.filter("email = {:email}", {
      email,
    }),
  });

  for (const user of users) {
    try {
      await deleteUserDeviceSessionsByUserId(pb, user.id);
      await pb.collection("users").delete(user.id);
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        continue;
      }

      throw error;
    }
  }
}

export async function createVerifiedUser(options: {
  pb: PocketBase;
  email: string;
  password: string;
  name?: string;
}): Promise<RecordModel> {
  return await options.pb.collection("users").create({
    email: options.email,
    password: options.password,
    passwordConfirm: options.password,
    name: options.name ?? "E2E User",
    verified: true,
  });
}

export async function deleteUserDeviceSessionsByUserId(
  pb: PocketBase,
  userId: string
): Promise<void> {
  const deviceSessions = await pb.collection("user_device_sessions").getFullList({
    filter: pb.filter("user = {:userId}", {
      userId,
    }),
  });

  for (const deviceSession of deviceSessions) {
    await pb.collection("user_device_sessions").delete(deviceSession.id);
  }
}

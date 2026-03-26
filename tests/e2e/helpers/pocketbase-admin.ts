import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import { getRequiredTestEnv } from "./test-env";

export type PocketBasePrefixTarget = {
  collection: string;
  field: string;
  prefix: string;
};

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

export async function listPocketBaseRecordsByPrefix<TRecord extends RecordModel>(options: {
  pb: PocketBase;
  collection: string;
  field: string;
  prefix: string;
}): Promise<TRecord[]> {
  return await options.pb.collection(options.collection).getFullList<TRecord>({
    filter: options.pb.filter(`${options.field} ~ {:prefixPattern}`, {
      prefixPattern: `${options.prefix}%`,
    }),
    sort: "-created",
  });
}

export async function deletePocketBaseRecordsByPrefix(options: {
  pb: PocketBase;
  collection: string;
  field: string;
  prefix: string;
}): Promise<number> {
  const records = await listPocketBaseRecordsByPrefix(options);
  let deletedCount = 0;

  for (const record of records) {
    try {
      await options.pb.collection(options.collection).delete(record.id);
      deletedCount += 1;
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        continue;
      }

      throw error;
    }
  }

  return deletedCount;
}

export async function deletePocketBaseRecordsByPrefixTargets(options: {
  pb: PocketBase;
  targets: readonly PocketBasePrefixTarget[];
}): Promise<number> {
  let deletedCount = 0;

  for (const target of options.targets) {
    deletedCount += await deletePocketBaseRecordsByPrefix({
      pb: options.pb,
      collection: target.collection,
      field: target.field,
      prefix: target.prefix,
    });
  }

  return deletedCount;
}

export async function deleteSignedUpUsersByEmail(pb: PocketBase, email: string): Promise<void> {
  const users = await listPocketBaseRecordsByPrefix({
    pb,
    collection: "users",
    field: "email",
    prefix: email,
  });

  for (const user of users) {
    await deleteUserDeviceSessionsByUserId(pb, user.id);
    await pb.collection("users").delete(user.id);
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

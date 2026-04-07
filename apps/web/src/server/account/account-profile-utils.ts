import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { accountConfig } from "@/config/account";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";

export const MAX_ACCOUNT_PROFILE_NAME_LENGTH = accountConfig.limits.profileNameMaxLength;
export const MAX_ACCOUNT_AVATAR_SIZE_BYTES = accountConfig.limits.avatarMaxSizeBytes;

export function normalizeProfileName(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function createAccountProfileSnapshot(pb: PocketBase, record: UsersRecord) {
  return {
    id: record.id,
    email: record.email,
    name: getNullableTrimmedString(record.name),
    avatarUrl: getAvatarUrl(pb, record),
  };
}

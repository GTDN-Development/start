import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import type { InlineStatus } from "@/features/account/account-types";
import { isRecord } from "@/lib/utils";

export type { InlineStatus };

export type AccountSettingsApiResponse = {
  ok?: boolean;
  errorCode?: string;
  sessionExpired?: boolean;
  targetEmail?: string;
  profile?: AccountProfileSnapshot;
};

export async function readAccountSettingsApiResponse(
  response: Response
): Promise<AccountSettingsApiResponse | null> {
  try {
    const data = (await response.json()) as unknown;

    if (!isRecord(data)) {
      return null;
    }

    return {
      ok: data.ok === true ? true : undefined,
      errorCode: typeof data.errorCode === "string" ? data.errorCode : undefined,
      sessionExpired: typeof data.sessionExpired === "boolean" ? data.sessionExpired : undefined,
      targetEmail: typeof data.targetEmail === "string" ? data.targetEmail : undefined,
      profile: parseAccountProfileSnapshot(data.profile),
    };
  } catch {
    return null;
  }
}

function parseAccountProfileSnapshot(value: unknown): AccountProfileSnapshot | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const email = typeof value.email === "string" ? value.email : "";
  const name =
    typeof value.name === "string" ? (value.name.trim() ? value.name.trim() : null) : null;
  const verified = typeof value.verified === "boolean" ? value.verified : false;
  const avatarUrl =
    typeof value.avatarUrl === "string" ? (value.avatarUrl.trim() ? value.avatarUrl : null) : null;

  if (!email) {
    return undefined;
  }

  return {
    email,
    name,
    verified,
    avatarUrl,
  };
}

export type AccountProfileSnapshot = {
  email: string;
  name: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

type PocketBaseAvatarUrlInput = {
  collectionId: string;
  recordId: string;
  fileName: string;
  updated: string | null;
};

export function getAccountProfileSnapshot(record: unknown): AccountProfileSnapshot {
  if (!isRecord(record)) {
    return {
      email: "",
      name: null,
      verified: false,
      avatarUrl: null,
    };
  }

  const email = getString(record.email);
  const rawName = getString(record.name);
  const verified = typeof record.verified === "boolean" ? record.verified : false;
  const avatarFileName = getString(record.avatar);
  const collectionId = getString(record.collectionId);
  const recordId = getString(record.id);
  const updated = getString(record.updated);

  return {
    email,
    name: rawName.trim() ? rawName.trim() : null,
    verified,
    avatarUrl:
      avatarFileName && collectionId && recordId
        ? getPocketBaseAvatarUrl({
            collectionId,
            recordId,
            fileName: avatarFileName,
            updated: updated || null,
          })
        : null,
  };
}

export function getPocketBaseAvatarUrl(input: PocketBaseAvatarUrlInput): string | null {
  const baseUrl = getPocketBaseBaseUrl();

  if (!baseUrl) {
    return null;
  }

  try {
    const url = new URL(
      `api/files/${encodeURIComponent(input.collectionId)}/${encodeURIComponent(input.recordId)}/${encodeURIComponent(input.fileName)}`,
      baseUrl
    );

    if (input.updated) {
      url.searchParams.set("v", input.updated);
    }

    return url.toString();
  } catch {
    return null;
  }
}

function getPocketBaseBaseUrl() {
  const value = process.env.NEXT_PUBLIC_PB_URL?.trim();

  if (!value) {
    return null;
  }

  return value.endsWith("/") ? value : `${value}/`;
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

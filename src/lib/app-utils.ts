const AVATAR_COLOR_CLASS_NAMES = [
  "bg-rose-600 text-white",
  "bg-red-600 text-white",
  "bg-orange-600 text-white",
  "bg-amber-700 text-white",
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-cyan-700 text-white",
  "bg-blue-600 text-white",
  "bg-indigo-600 text-white",
  "bg-violet-600 text-white",
  "bg-purple-600 text-white",
  "bg-pink-600 text-white",
] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function resolveErrorMessage(
  errorCode: string | undefined,
  fallbackMessage: string,
  messagesByCode: Record<string, string>
) {
  if (!errorCode) {
    return fallbackMessage;
  }

  return messagesByCode[errorCode] ?? fallbackMessage;
}

export function formatEmailTimestamp(): string {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function getUserInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "?";
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export function getAvatarColorClass(seed: string) {
  return AVATAR_COLOR_CLASS_NAMES[hashString(seed) % AVATAR_COLOR_CLASS_NAMES.length];
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

import { startTransition } from "react";
import { avatarColorClassNames } from "@/config/brand";

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
  return avatarColorClassNames[hashString(seed) % avatarColorClassNames.length];
}

export function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
}

export async function runAsyncTransition<T>(action: () => Promise<T>): Promise<T> {
  return await new Promise<T>((resolve, reject) => {
    startTransition(() => {
      action().then(resolve).catch(reject);
    });
  });
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

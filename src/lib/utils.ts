import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

/**
 * Formats current date and time for email timestamps
 * @returns Formatted datetime string (e.g., "2024-12-25 15:45")
 */
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

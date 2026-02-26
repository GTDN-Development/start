"use client";

import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

export type InlineStatus = {
  kind: "success" | "error";
  message: string;
} | null;

export type AccountSettingsApiResponse = {
  ok?: boolean;
  errorCode?: string;
  sessionExpired?: boolean;
  targetEmail?: string;
  profile?: AccountProfileSnapshot;
};

export type SettingsTranslationFn = (key: string, values?: Record<string, string>) => string;

type StatusAlertProps = {
  status: InlineStatus;
  successTitle: string;
  errorTitle: string;
};

export function StatusAlert({ status, successTitle, errorTitle }: StatusAlertProps) {
  if (!status) {
    return null;
  }

  if (status.kind === "success") {
    return (
      <Alert className="py-2">
        <CheckCircle2Icon aria-hidden="true" className="size-4 text-emerald-500" />
        <AlertTitle>{successTitle}</AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="py-2">
      <AlertCircleIcon aria-hidden="true" className="size-4" />
      <AlertTitle>{errorTitle}</AlertTitle>
      <AlertDescription>{status.message}</AlertDescription>
    </Alert>
  );
}

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

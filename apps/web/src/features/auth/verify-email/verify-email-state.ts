import type { AppHref } from "@/i18n/navigation";
import { VERIFY_EMAIL_COMPLETE_PATH, VERIFY_EMAIL_PATH } from "@/config/routes";
import { parseAuthFlowToken } from "@/features/auth/auth-flow-token";

export type VerifyEmailResultState = "pending" | "verified" | "invalid";
export type VerifyEmailDeliveryState = "sent" | "needs_resend";

export type VerifyEmailPageState = {
  token: string | null;
  email: string | null;
  result: VerifyEmailResultState;
  delivery: VerifyEmailDeliveryState;
};

type VerifyEmailSearchParams = {
  token?: string | string[];
  email?: string | string[];
  result?: string | string[];
  delivery?: string | string[];
};

export function createPendingVerifyEmailHref(input: {
  email: string;
  delivery?: VerifyEmailDeliveryState;
}): AppHref {
  const searchParams = new URLSearchParams({
    email: input.email.trim().toLowerCase(),
  });

  if (input.delivery === "needs_resend") {
    searchParams.set("delivery", input.delivery);
  }

  return `${VERIFY_EMAIL_PATH}?${searchParams.toString()}` as AppHref;
}

export function createVerifyEmailResultHref(input: {
  result: Exclude<VerifyEmailResultState, "pending">;
  email?: string | null;
}): AppHref {
  const searchParams = new URLSearchParams({
    result: input.result,
  });

  if (input.email?.trim()) {
    searchParams.set("email", input.email.trim().toLowerCase());
  }

  return `${VERIFY_EMAIL_PATH}?${searchParams.toString()}` as AppHref;
}

export function createVerifyEmailCompletionHref(input: {
  token: string;
  email?: string | null;
}): AppHref {
  const searchParams = new URLSearchParams({
    token: input.token.trim(),
  });

  if (input.email?.trim()) {
    searchParams.set("email", input.email.trim().toLowerCase());
  }

  return `${VERIFY_EMAIL_COMPLETE_PATH}?${searchParams.toString()}` as AppHref;
}

export function parseVerifyEmailPageState(
  searchParams: VerifyEmailSearchParams
): VerifyEmailPageState {
  const token = parseAuthFlowToken(searchParams.token);
  const email = getSingleQueryValue(searchParams.email);
  const result = parseVerifyEmailResult(searchParams.result) ?? (email ? "pending" : "invalid");
  const delivery = parseVerifyEmailDelivery(searchParams.delivery) ?? "sent";

  return {
    token,
    email,
    result,
    delivery,
  };
}

function getSingleQueryValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    const normalizedValue = value.trim();

    return normalizedValue ? normalizedValue : null;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    const normalizedValue = value[0].trim();

    return normalizedValue ? normalizedValue : null;
  }

  return null;
}

function parseVerifyEmailResult(
  value: string | string[] | undefined
): VerifyEmailResultState | null {
  const normalizedValue = getSingleQueryValue(value);

  if (
    normalizedValue === "pending" ||
    normalizedValue === "verified" ||
    normalizedValue === "invalid"
  ) {
    return normalizedValue;
  }

  return null;
}

function parseVerifyEmailDelivery(
  value: string | string[] | undefined
): VerifyEmailDeliveryState | null {
  const normalizedValue = getSingleQueryValue(value);

  if (normalizedValue === "sent" || normalizedValue === "needs_resend") {
    return normalizedValue;
  }

  return null;
}

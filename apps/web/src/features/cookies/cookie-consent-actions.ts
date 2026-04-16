"use server";

import { z } from "zod";
import {
  COOKIE_CONSENT_EVENT_TYPES,
  normalizeConsent,
  type ConsentState,
  type CookieConsentEventType,
} from "@/config/cookie-consent";
import { recordCookieConsentEvent } from "@/server/cookie-consent/cookie-consent-service";

const consentStateSchema = z.object({
  necessary: z.literal(true),
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

const persistCookieConsentInputSchema = z.object({
  eventType: z.enum(COOKIE_CONSENT_EVENT_TYPES),
  consent: consentStateSchema,
  locale: z.string().trim().min(2).max(10),
});

type PersistCookieConsentActionErrorCode = "BAD_REQUEST" | "RATE_LIMITED" | "INTERNAL_ERROR";

export type PersistCookieConsentActionResponse =
  | { ok: true }
  | { ok: false; errorCode: PersistCookieConsentActionErrorCode };

export async function persistCookieConsentAction(input: {
  eventType: CookieConsentEventType;
  consent: ConsentState;
  locale: string;
}): Promise<PersistCookieConsentActionResponse> {
  const parsedInput = persistCookieConsentInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  const normalizedConsent = normalizeConsent(parsedInput.data.consent);

  const response = await recordCookieConsentEvent({
    eventType: parsedInput.data.eventType,
    consent: normalizedConsent,
    locale: parsedInput.data.locale,
  });

  if (!response.ok) {
    return createErrorResponse(response.errorCode);
  }

  return {
    ok: true,
  };
}

function createErrorResponse(
  errorCode: PersistCookieConsentActionErrorCode
): PersistCookieConsentActionResponse {
  return {
    ok: false,
    errorCode,
  };
}

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { ClientResponseError } from "pocketbase";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_SUBJECT_COOKIE_NAME,
  COOKIE_CONSENT_VERSION,
  normalizeConsent,
  type ConsentState,
  type CookieConsentEventType,
} from "@/config/cookie-consent";
import { routing } from "@/i18n/routing";
import { createPocketBaseClient } from "@/server/pocketbase/pocketbase-server";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";

const COOKIE_CONSENT_SUBJECT_COOKIE_PATTERN = /^[a-z0-9-]{16,64}$/i;

export type RecordCookieConsentEventInput = {
  eventType: CookieConsentEventType;
  consent: ConsentState;
  locale: string;
};

export type RecordCookieConsentEventResult =
  | { ok: true }
  | { ok: false; errorCode: "RATE_LIMITED" | "INTERNAL_ERROR" };

export async function recordCookieConsentEvent(
  input: RecordCookieConsentEventInput
): Promise<RecordCookieConsentEventResult> {
  const cookieStore = await cookies();
  const subjectKey = getOrCreateConsentSubjectKey();
  const consentSnapshot = normalizeConsent(input.consent);
  const normalizedLocale = normalizeLocale(input.locale);

  try {
    const pb = createPocketBaseClient();

    await pb.collection("cookie_consent_events").create({
      subject_key: subjectKey,
      event_type: input.eventType,
      preferences: consentSnapshot.functional,
      analytics: consentSnapshot.analytics,
      marketing: consentSnapshot.marketing,
      consent_version: COOKIE_CONSENT_VERSION,
      consent_snapshot: consentSnapshot,
      locale: normalizedLocale,
      idempotency_key: randomUUID(),
    });

    return {
      ok: true,
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 429) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
      };
    }

    logServiceError("cookie-consent-service", "recordCookieConsentEvent", error);

    return {
      ok: false,
      errorCode: "INTERNAL_ERROR",
    };
  }

  function getOrCreateConsentSubjectKey() {
    const existingSubjectKey = cookieStore.get(COOKIE_CONSENT_SUBJECT_COOKIE_NAME)?.value ?? "";

    if (COOKIE_CONSENT_SUBJECT_COOKIE_PATTERN.test(existingSubjectKey)) {
      return existingSubjectKey;
    }

    const generatedSubjectKey = randomUUID();

    cookieStore.set(COOKIE_CONSENT_SUBJECT_COOKIE_NAME, generatedSubjectKey, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
    });

    return generatedSubjectKey;
  }
}

function normalizeLocale(locale: string): string {
  const trimmedLocale = locale.trim().toLowerCase();

  for (const supportedLocale of routing.locales) {
    if (supportedLocale === trimmedLocale) {
      return supportedLocale;
    }
  }

  return routing.defaultLocale;
}

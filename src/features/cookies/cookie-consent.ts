import { isRecord } from "@/lib/utils";

export const COOKIE_NAME = "cookie_consent";
export const COOKIE_SUBJECT_KEY_NAME = "cookie_consent_subject";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const COOKIE_CONSENT_VERSION = "1";

export type ConsentState = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsentEventType = "accept_all" | "reject_all" | "save_preferences" | "withdraw";

export type CookieConsentEventRequest = {
  consent: ConsentState;
  eventType: CookieConsentEventType;
  locale: string;
  idempotencyKey: string;
};

export const defaultConsent: ConsentState = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export const acceptAllConsent: ConsentState = {
  necessary: true,
  functional: true,
  analytics: true,
  marketing: true,
};

export const rejectAllConsent: ConsentState = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
};

export function normalizeConsent(value: unknown): ConsentState {
  const input = isRecord(value) ? value : {};

  return {
    necessary: true,
    functional: input.functional === true,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };
}

export function parseConsentCookieValue(value: string): ConsentState | null {
  try {
    return normalizeConsent(JSON.parse(decodeURIComponent(value)));
  } catch {
    return null;
  }
}

export function serializeConsentCookieValue(consent: ConsentState) {
  return encodeURIComponent(JSON.stringify(normalizeConsent(consent)));
}

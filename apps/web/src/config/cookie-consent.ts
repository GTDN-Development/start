import { isRecord } from "@/lib/app-utils";

export const COOKIE_NAME = "cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
export const COOKIE_CONSENT_VERSION = "1";
export const COOKIE_CONSENT_SUBJECT_COOKIE_NAME = "cookie_consent_subject";
export const COOKIE_CONSENT_EVENT_TYPES = ["accept_all", "reject_all", "save_preferences"] as const;

export type ConsentState = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type CookieConsentEventType = (typeof COOKIE_CONSENT_EVENT_TYPES)[number];
export type ParsedConsentCookieValue = {
  consent: ConsentState;
  version: string | null;
  isCurrentVersion: boolean;
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

export function isCookieConsentEnabled(): boolean {
  return process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED !== "false";
}

export function normalizeConsent(value: unknown): ConsentState {
  const input = isRecord(value) ? value : {};

  return {
    necessary: true,
    functional: input.functional === true,
    analytics: input.analytics === true,
    marketing: input.marketing === true,
  };
}

export function parseConsentCookieValue(value: string): ParsedConsentCookieValue | null {
  try {
    const parsedValue = JSON.parse(decodeURIComponent(value));

    if (!isRecord(parsedValue)) {
      return null;
    }

    const version = typeof parsedValue.version === "string" ? parsedValue.version : null;

    return {
      consent: normalizeConsent(parsedValue),
      version,
      isCurrentVersion: isCurrentConsentCookieVersion(version),
    };
  } catch {
    return null;
  }
}

export function serializeConsentCookieValue(consent: ConsentState) {
  return encodeURIComponent(
    JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      ...normalizeConsent(consent),
    })
  );
}

function isCurrentConsentCookieVersion(version: string | null): boolean {
  return version === COOKIE_CONSENT_VERSION;
}

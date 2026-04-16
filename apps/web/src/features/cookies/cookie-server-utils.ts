import {
  COOKIE_NAME,
  defaultConsent,
  parseConsentCookieValue,
  type ConsentState,
} from "@/config/cookie-consent";
import { cookies } from "next/headers";

/**
 * Get cookie consent from server-side cookies
 * Use this in Server Components, Server Actions, and Route Handlers
 */
export async function getConsent(): Promise<ConsentState> {
  const cookieStore = await cookies();
  const consentCookie = cookieStore.get(COOKIE_NAME);

  if (!consentCookie?.value) {
    return defaultConsent;
  }

  const parsedConsent = parseConsentCookieValue(consentCookie.value);

  if (parsedConsent?.isCurrentVersion) {
    return parsedConsent.consent;
  }

  return defaultConsent;
}

/**
 * Check if user has consented to a specific category
 */
export async function hasConsentedTo(category: keyof ConsentState): Promise<boolean> {
  const consent = await getConsent();
  return consent[category];
}

/**
 * Check if user has interacted with the consent banner
 */
export async function hasInteracted(): Promise<boolean> {
  const cookieStore = await cookies();
  const consentCookie = cookieStore.get(COOKIE_NAME);

  if (!consentCookie?.value) {
    return false;
  }

  const parsedConsent = parseConsentCookieValue(consentCookie.value);

  return parsedConsent?.isCurrentVersion === true;
}

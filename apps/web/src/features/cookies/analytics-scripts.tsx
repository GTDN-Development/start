"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import { useCookieContext } from "./cookie-context";

export function AnalyticsScripts() {
  const { consent, isReady } = useCookieContext();

  if (!isCookieConsentEnabled() || !isReady) {
    return null;
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!consent.analytics) {
    return null;
  }

  if (gaId) {
    return <GoogleAnalytics gaId={gaId} />;
  }

  return null;
}

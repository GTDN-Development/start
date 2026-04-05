"use client";

import { isCookieConsentEnabled } from "./cookie-consent";
import { useCookieContext } from "./cookie-context";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

export function ThirdPartyScripts() {
  const { consent, isReady } = useCookieContext();

  if (!isCookieConsentEnabled() || !isReady) {
    return null;
  }

  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  return (
    <>
      {consent.analytics && gaId && <GoogleAnalytics gaId={gaId} />}
      {consent.analytics && gtmId && <GoogleTagManager gtmId={gtmId} />}
    </>
  );
}

"use client";

import { useCookieContext } from "./cookie-context";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

export function ThirdPartyScripts() {
  const { hasConsentedTo } = useCookieContext();

  const siteHasGa =
    process.env.NEXT_PUBLIC_GA_ID === undefined || process.env.NEXT_PUBLIC_GA_ID === null;

  const siteHasGtm =
    process.env.NEXT_PUBLIC_GTM_ID === undefined || process.env.NEXT_PUBLIC_GTM_ID === null;

  return (
    <>
      {hasConsentedTo("analytics") && siteHasGa && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID ?? "G-YOUR_ID_HERE"} />
      )}

      {hasConsentedTo("analytics") && siteHasGtm && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-YOUR_ID_HERE"} />
      )}
    </>
  );
}

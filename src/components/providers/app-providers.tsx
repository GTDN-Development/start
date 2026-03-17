"use client";

import { ThemeProvider } from "next-themes";
import { CookieContextProvider } from "@/features/cookies/cookie-context";
import type { ConsentState } from "@/features/cookies/cookie-consent";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppProvidersProps = {
  children: React.ReactNode;
  initialCookieConsent: ConsentState;
  initialCookieConsentInteracted: boolean;
};

export function AppProviders({
  children,
  initialCookieConsent,
  initialCookieConsentInteracted,
}: AppProvidersProps) {
  return (
    <CookieContextProvider
      initialConsent={initialCookieConsent}
      initialHasInteracted={initialCookieConsentInteracted}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </CookieContextProvider>
  );
}

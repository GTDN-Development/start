"use client";

import { ThemeProvider } from "next-themes";
import { BackNavigationProvider } from "@/components/ui/back-navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ConsentState } from "@/features/cookies/cookie-consent";
import { CookieContextProvider } from "@/features/cookies/cookie-context";

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
    <BackNavigationProvider>
      <CookieContextProvider
        initialConsent={initialCookieConsent}
        initialHasInteracted={initialCookieConsentInteracted}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </CookieContextProvider>
    </BackNavigationProvider>
  );
}

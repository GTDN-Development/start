"use client";

import { ThemeProvider } from "next-themes";
import { createContext, useState } from "react";
import { AuthSessionSync } from "@/features/auth/auth-session-sync";
import { CookieContextProvider } from "@/features/cookies/cookie-context";
import type { ConsentState } from "@/features/cookies/cookie-consent";
import { usePathname } from "@/i18n/navigation";

export const AppContext = createContext<{ previousPathname?: string }>({});

function usePrevious<T>(value: T): T | undefined {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<T | undefined>();

  if (current !== value) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

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
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  return (
    <AppContext.Provider value={{ previousPathname: previousPathname ?? undefined }}>
      <CookieContextProvider
        initialConsent={initialCookieConsent}
        initialHasInteracted={initialCookieConsentInteracted}
      >
        <AuthSessionSync />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </CookieContextProvider>
    </AppContext.Provider>
  );
}

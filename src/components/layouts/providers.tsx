"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { createContext, useState } from "react";
import { CookieContextProvider } from "@/components/(shared)/cookies/cookie-context";
import type { ConsentState } from "@/components/(shared)/cookies/consent";

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

type ProvidersProps = {
  children: React.ReactNode;
  initialCookieConsent: ConsentState;
  initialCookieConsentInteracted: boolean;
};

export function Providers({
  children,
  initialCookieConsent,
  initialCookieConsentInteracted,
}: ProvidersProps) {
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  return (
    <AppContext.Provider value={{ previousPathname: previousPathname ?? undefined }}>
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
          {children}
        </ThemeProvider>
      </CookieContextProvider>
    </AppContext.Provider>
  );
}

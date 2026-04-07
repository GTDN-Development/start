"use client";

import { ThemeProvider } from "next-themes";
import { CookieContextProvider } from "@/features/cookies/cookie-context";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CookieContextProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </CookieContextProvider>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { preferencesConfig } from "@/config/preferences";
import { CookieContextProvider } from "@/features/cookies/cookie-context";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CookieContextProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey={preferencesConfig.theme.storageKey}
      >
        {children}
      </ThemeProvider>
    </CookieContextProvider>
  );
}

"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { createContext, useState } from "react";
import { CookieContextProvider } from "@/components/(shared)/cookies/cookie-context";

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

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  return (
    <AppContext.Provider value={{ previousPathname: previousPathname ?? undefined }}>
      <CookieContextProvider>
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

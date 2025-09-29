"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { createContext, useEffect, useRef } from "react";

export const AppContext = createContext<{ previousPathname?: string }>({});

function usePrevious<T>(value: T) {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = usePrevious(pathname);

  return (
    <AppContext.Provider value={{ previousPathname: previousPathname ?? undefined }}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  );
}

"use client";

import { createContext, useContext, useState } from "react";
import { Link, type LinkHref } from "@/components/ui/link";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type BackNavigationContextValue = {
  previousPathname?: string;
  canGoBack: boolean;
  goBack: () => void;
};

export type BackNavigationRenderProps = BackNavigationContextValue;

export type BackNavigationProps = {
  children?: React.ReactNode | ((props: BackNavigationRenderProps) => React.ReactNode);
};

export type BackLinkProps = {
  fallbackHref: LinkHref;
  className?: string;
  backContent?: React.ReactNode;
  children: React.ReactNode;
};

const BackNavigationContext = createContext<BackNavigationContextValue | null>(null);

export function BackNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathname = usePreviousValue(pathname);

  return (
    <BackNavigationContext.Provider
      value={{
        previousPathname,
        canGoBack: previousPathname !== undefined,
        goBack,
      }}
    >
      {children}
    </BackNavigationContext.Provider>
  );
}

export function useBackNavigation(): BackNavigationRenderProps {
  const context = useContext(BackNavigationContext);

  if (!context) {
    throw new Error("useBackNavigation must be used within BackNavigationProvider.");
  }

  return context;
}

export function BackNavigation({ children }: BackNavigationProps) {
  const renderProps = useBackNavigation();

  if (typeof children === "function") {
    return children(renderProps);
  }

  return children ?? null;
}

export function BackLink({ fallbackHref, className, backContent, children }: BackLinkProps) {
  const sharedClassName = cn(
    "cursor-pointer appearance-none bg-transparent p-0 text-left",
    className
  );

  return (
    <BackNavigation>
      {({ canGoBack, goBack }) =>
        canGoBack ? (
          <button type="button" className={sharedClassName} onClick={goBack}>
            {backContent ?? children}
          </button>
        ) : (
          <Link href={fallbackHref} className={sharedClassName}>
            {children}
          </Link>
        )
      }
    </BackNavigation>
  );
}

export function usePreviousValue<T>(value: T): T | undefined {
  const [currentValue, setCurrentValue] = useState(value);
  const [previousValue, setPreviousValue] = useState<T | undefined>();

  if (currentValue !== value) {
    setPreviousValue(currentValue);
    setCurrentValue(value);

    return currentValue;
  }

  return previousValue;
}

function goBack() {
  window.history.back();
}

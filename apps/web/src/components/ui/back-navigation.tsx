"use client";

import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { type AppHref } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { Link } from "@/components/ui/link";

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
  fallbackHref: AppHref;
  className?: string;
  backContent?: React.ReactNode;
  children: React.ReactNode;
};

export function useBackNavigation(): BackNavigationRenderProps {
  const { previousPathname } = useBrowserPathnameState();

  return {
    previousPathname: previousPathname ?? undefined,
    canGoBack: previousPathname !== null,
    goBack,
  };
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

function goBack() {
  window.history.back();
}

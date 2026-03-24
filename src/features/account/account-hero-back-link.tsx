"use client";

import { BackNavigation } from "@/components/ui/back-navigation";
import { Link } from "@/components/ui/link";
import { useSidebarContext } from "@/features/application/application-root";
import { cn } from "@/lib/utils";

type AccountHeroBackLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function AccountHeroBackLink({ className, children }: AccountHeroBackLinkProps) {
  const sharedClassName = cn(
    "cursor-pointer appearance-none bg-transparent p-0 text-left",
    className
  );
  const { applicationEntryHref } = useSidebarContext();

  return (
    <BackNavigation>
      {({ canGoBack, goBack, previousPathname }) => {
        const canGoBackOutsideAccount =
          canGoBack &&
          previousPathname !== undefined &&
          previousPathname !== "/account" &&
          !previousPathname.startsWith("/account/");

        return canGoBackOutsideAccount ? (
          <button type="button" className={sharedClassName} onClick={goBack}>
            {children}
          </button>
        ) : (
          <Link href={applicationEntryHref} className={sharedClassName}>
            {children}
          </Link>
        );
      }}
    </BackNavigation>
  );
}

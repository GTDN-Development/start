"use client";

import { BackNavigation } from "@/components/ui/back-navigation";
import { getPathname, Link } from "@/i18n/navigation";
import { ACCOUNT_PATH } from "@/config/routes";
import { useApplicationRootContext } from "@/features/application/application-root";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

type AccountHeroBackLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function AccountHeroBackLink({ className, children }: AccountHeroBackLinkProps) {
  const locale = useLocale();
  const sharedClassName = cn(
    "cursor-pointer appearance-none bg-transparent p-0 text-left",
    className
  );
  const { applicationEntryHref } = useApplicationRootContext();
  const localizedAccountPath = getPathname({
    href: ACCOUNT_PATH,
    locale,
  });

  return (
    <BackNavigation>
      {({ canGoBack, goBack, previousPathname }) => {
        const canGoBackOutsideAccount =
          canGoBack &&
          previousPathname !== undefined &&
          previousPathname !== localizedAccountPath &&
          !previousPathname.startsWith(`${localizedAccountPath}/`);

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

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { cn } from "@/lib/utils";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { shouldShowEmailNotVerifiedBanner } from "@/features/auth/email-verification";
import { EmailNotVerifiedBanner } from "@/features/auth/email-not-verified-banner";
import { PlatformFooter } from "@/features/platform/platform-footer";
import { PlatformHeader } from "@/features/platform/platform-header";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";

type PlatformLayoutUser = AccountProfileSnapshot;

type PlatformLayoutLabels = {
  dashboard: string;
  userMenu: UserAccountMenuLabels;
};

type PlatformLayoutProps = React.ComponentProps<"main"> & {
  user: PlatformLayoutUser;
  locale: string;
  labels: PlatformLayoutLabels;
};

export function PlatformLayout({
  children,
  className,
  user,
  locale,
  labels,
  ...props
}: PlatformLayoutProps) {
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}:${user.verified ? "1" : "0"}`;
  const shouldRenderUnverifiedBanner = shouldShowEmailNotVerifiedBanner(user);
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
      <div
        className={clsx(
          "[--navbar-height:--spacing(16)]",
          "relative isolate flex min-h-dvh w-full flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow"
        )}
      >
        <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

        {shouldRenderUnverifiedBanner && <EmailNotVerifiedBanner />}

        <PlatformHeader user={user} locale={locale} labels={labels} />

        <main
          {...props}
          id={contentId}
          data-slot="main"
          className={cn("relative isolate w-full min-w-0", className)}
        >
          {children}
        </main>

        <PlatformFooter />
      </div>
    </AccountProfileProvider>
  );
}

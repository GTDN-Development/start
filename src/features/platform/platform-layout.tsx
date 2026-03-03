import { AccountProfileProvider } from "@/features/account/account-profile-context";
import { PlatformHeader } from "@/features/platform/platform-header";
import { PlatformFooter } from "@/features/platform/platform-footer";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { EmailNotVerifiedBanner } from "../auth/verify-email/email-not-verified-banner";

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

        <EmailNotVerifiedBanner />

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

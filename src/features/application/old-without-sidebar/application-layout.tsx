import clsx from "clsx";
import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { cn } from "@/lib/utils";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import { ApplicationFooter } from "@/features/application/old-without-sidebar/application-footer";
import { ApplicationHeader } from "@/features/application/old-without-sidebar/application-header";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";

type ApplicationLayoutUser = AccountProfileSnapshot;

type ApplicationLayoutLabels = {
  overview: string;
  userMenu: UserAccountMenuLabels;
};

type ApplicationLayoutProps = React.ComponentProps<"main"> & {
  user: ApplicationLayoutUser;
  locale: string;
  labels: ApplicationLayoutLabels;
};

export function ApplicationLayout({
  children,
  className,
  user,
  locale,
  labels,
  ...props
}: ApplicationLayoutProps) {
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}:${user.verified ? "1" : "0"}`;
  const renderEmailVerificationBanner = showEmailVerificationBanner(user);
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

        <LayoutBanners
          banners={[
            {
              isVisible: renderEmailVerificationBanner,
              content: <EmailVerificationBanner />,
            },
          ]}
        />

        <ApplicationHeader user={user} locale={locale} labels={labels} />

        <main
          {...props}
          id={contentId}
          data-slot="main"
          className={cn("relative isolate w-full min-w-0", className)}
        >
          {children}
        </main>

        <ApplicationFooter />
      </div>
    </AccountProfileProvider>
  );
}

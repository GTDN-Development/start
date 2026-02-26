import { AccountProfileProvider } from "@/components/shared/account/account-profile-context";
import { PlatformHeader } from "@/components/platform/platform-header";
import { PlatformFooter } from "@/components/platform/platform-footer";
import { type UserAccountMenuLabels } from "@/components/shared/account/user-account-menu";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { SkipToContent } from "@/components/shared/layout/skip-to-content";
import { cn } from "@/lib/utils";
import clsx from "clsx";
import { useTranslations } from "next-intl";

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

        {/* Banner should go here */}

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

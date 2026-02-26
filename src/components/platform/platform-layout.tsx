import { Container } from "@/components/ui/container";
import { AccountProfileProvider } from "@/components/shared/account/account-profile-context";
import { Link } from "@/components/ui/link";
import {
  UserAccountMenu,
  type UserAccountMenuLabels,
} from "@/components/shared/account/user-account-menu";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { cn } from "@/lib/utils";
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

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
      <main {...props} className={cn("relative isolate min-h-dvh w-full", className)}>
        <header className="border-border/80 bg-background/95 sticky top-0 z-30 border-b backdrop-blur">
          <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/dashboard"
                className="text-foreground hover:text-primary truncate text-sm font-semibold"
              >
                {labels.dashboard}
              </Link>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <div>
                <UserAccountMenu viewer={user} locale={locale} labels={labels.userMenu} />
              </div>
            </div>
          </Container>
        </header>

        <div className="relative isolate w-full min-w-0">{children}</div>
      </main>
    </AccountProfileProvider>
  );
}

import { FloatingBar } from "@/components/shared/layout/floating-bar";
import {
  UserAccountMenu,
  type UserAccountMenuLabels,
} from "@/components/shared/account/user-account-menu";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";

type PlatformHeaderUser = AccountProfileSnapshot;

type PlatformHeaderLabels = {
  dashboard: string;
  userMenu: UserAccountMenuLabels;
};

type PlatformHeaderProps = {
  user: PlatformHeaderUser;
  locale: string;
  labels: PlatformHeaderLabels;
};

export function PlatformHeader({ user, locale, labels }: PlatformHeaderProps) {
  return (
    <FloatingBar
      render={<header />}
      position="sticky"
      autoHide={false}
      className="border-border/80 bg-background/95 z-30 h-(--navbar-height,64px) w-full border-b backdrop-blur"
    >
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
    </FloatingBar>
  );
}

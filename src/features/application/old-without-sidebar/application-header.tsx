import { FloatingBar } from "@/components/layout/floating-bar";
import {
  UserAccountMenu,
  type UserAccountMenuLabels,
} from "@/features/account/user-account-menu";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";

type ApplicationHeaderUser = AccountProfileSnapshot;

type ApplicationHeaderLabels = {
  overview: string;
  userMenu: UserAccountMenuLabels;
};

type ApplicationHeaderProps = {
  user: ApplicationHeaderUser;
  locale: string;
  labels: ApplicationHeaderLabels;
};

export function ApplicationHeader({ user, locale, labels }: ApplicationHeaderProps) {
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
            href="/overview"
            className="text-foreground hover:text-primary truncate text-sm font-semibold"
          >
            {labels.overview}
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

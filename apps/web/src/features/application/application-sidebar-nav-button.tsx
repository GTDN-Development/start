import { NavLink } from "@/components/layout/nav-link";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import type { AppHref } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AppIcon } from "@/types/icons";

type ApplicationSidebarNavButtonProps = {
  href: AppHref;
  icon: AppIcon;
  label: string;
  matchNested?: boolean;
  onClick?: () => void;
};

export function ApplicationSidebarNavButton({
  href,
  icon: Icon,
  label,
  matchNested,
  onClick,
}: ApplicationSidebarNavButtonProps) {
  return (
    <SidebarMenuButton
      tooltip={label}
      render={<NavLink href={href} matchNested={matchNested} onClick={onClick} />}
      className={cn(
        "text-sidebar-foreground/80",
        "data-current:bg-sidebar-accent data-current:text-sidebar-accent-foreground"
      )}
    >
      <Icon aria-hidden="true" />
      {label}
    </SidebarMenuButton>
  );
}

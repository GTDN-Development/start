import { ChevronDownIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { NavLink } from "@/components/shared/layout/nav-link";
import { ThemeSwitcher } from "@/components/shared/layout/theme-switcher";
import { LocaleSwitcher } from "@/components/shared/layout/locale-switcher";
import { legalItems, type MenuLink, type MenuLabelKey } from "@/config/menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type PlatformFooterLink = MenuLink;
type TranslateNavigationLabel = (key: MenuLabelKey) => string;

const platformFooterLinks: PlatformFooterLink[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "blog", href: "/blog" },
  { labelKey: "contact", href: "/contact" },
];

function PlatformFooterNavigation({
  items,
  translate,
  legalLabel,
  className,
}: {
  items: PlatformFooterLink[];
  translate: TranslateNavigationLabel;
  legalLabel: string;
  className?: string;
}) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            href={item.href}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {translate(item.labelKey)}
          </NavLink>
        </li>
      ))}
      <DropdownMenu>
        <li>
          <DropdownMenuTrigger
            render={
              <button className="text-muted-foreground hover:text-foreground data-[state=open]:text-foreground flex items-center gap-2 text-sm transition-colors" />
            }
          >
            {legalLabel}
            <ChevronDownIcon aria-hidden="true" className="size-4" />
          </DropdownMenuTrigger>
        </li>
        <DropdownMenuContent align="start" className={"w-auto"}>
          {legalItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              render={
                <NavLink
                  href={item.href}
                  className="w-full cursor-pointer pr-2 sm:whitespace-nowrap"
                />
              }
            >
              {translate(item.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </ul>
  );
}

export function PlatformFooter({ className, ...props }: React.ComponentProps<"footer">) {
  const tNav = useTranslations("layout.navigation.items");
  const tFooter = useTranslations("layout.footer");

  return (
    <footer {...props} className={cn("border-t-border border-t", className)}>
      <Container className="flex flex-wrap items-center justify-center gap-x-4 gap-y-8 py-8 sm:justify-between">
        <PlatformFooterNavigation
          items={platformFooterLinks}
          translate={tNav}
          legalLabel={tFooter("sections.legal")}
          className="flex flex-wrap items-center gap-x-5 gap-y-2"
        />

        <div className="flex items-center gap-2 sm:ml-auto">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </Container>
    </footer>
  );
}

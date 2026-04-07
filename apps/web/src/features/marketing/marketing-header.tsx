import clsx from "clsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FloatingBar } from "@/components/layout/floating-bar";
import { LocalizedPathLink } from "@/components/ui/link";
import { Container } from "@/components/ui/container";
import { ChevronDownIcon } from "lucide-react";
import { LogoStart } from "@/components/brand/logo-start";
import { NavLink } from "@/components/layout/nav-link";
import { isNested, marketingMenu, type MenuItem, type MenuLabelKey } from "@/config/menu";
import { useTranslations } from "next-intl";
import { MarketingHeaderMobileMenu } from "./marketing-header-mobile-menu";

type TranslateNavigationLabel = (key: MenuLabelKey) => string;
function Navigation({
  items,
  translate,
}: {
  items: MenuItem[];
  translate: TranslateNavigationLabel;
}) {
  return (
    <ul className="flex items-center gap-6">
      {items.map((item) => {
        if (isNested(item)) {
          return (
            <DropdownMenu key={item.labelKey}>
              <li>
                <DropdownMenuTrigger
                  render={
                    <button className="text-muted-foreground hover:text-foreground data-[state=open]:text-foreground flex items-center gap-2 text-sm whitespace-nowrap transition-colors" />
                  }
                >
                  {translate(item.labelKey)}
                  <ChevronDownIcon aria-hidden="true" className="size-4" />
                </DropdownMenuTrigger>
              </li>
              <DropdownMenuContent align="start">
                {item.items.map((subItem) => (
                  <DropdownMenuItem
                    key={subItem.href}
                    render={
                      <NavLink
                        href={subItem.href}
                        className="w-full cursor-pointer whitespace-nowrap"
                      />
                    }
                  >
                    {translate(subItem.labelKey)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <li key={item.href}>
            <NavLink
              href={item.href}
              className="text-muted-foreground hover:text-foreground data-current:text-foreground inline-flex items-center justify-center rounded-md text-sm whitespace-nowrap underline-offset-2 transition-colors data-current:underline"
            >
              {translate(item.labelKey)}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export function MarketingHeader({
  desktopAuthSlot,
  mobileTopAuthSlot,
  mobileViewerSlot,
  mobileFooterActionsSlot,
  homeHref,
}: {
  desktopAuthSlot: React.ReactNode;
  mobileTopAuthSlot: React.ReactNode;
  mobileViewerSlot: React.ReactNode;
  mobileFooterActionsSlot: React.ReactNode;
  homeHref: string;
}) {
  const t = useTranslations("layout.header");
  const tNav = useTranslations("layout.navigation.items");

  return (
    <FloatingBar
      render={<header />}
      position={"sticky"}
      autoHide={true}
      className={clsx(
        // Base styles for the navbar
        "z-100 h-(--navbar-height,64px) w-full",
        // Transition and initial state
        "transform-gpu transition duration-300",
        // Initial state
        "bg-background/75 backdrop-blur-2xl",
        // Hidden state for auto-hide behavior
        "data-hidden:data-scrolled:shadow-none data-hidden:motion-safe:-translate-y-full"
      )}
    >
      <Container size="full" className="flex h-full items-center justify-between gap-8">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-4">
          <LocalizedPathLink href={homeHref} aria-label={t("homeAriaLabel")}>
            <LogoStart aria-hidden="true" className="w-18" />
          </LocalizedPathLink>
        </div>

        {/* Center */}
        <div className="flex flex-1 items-center justify-center gap-4">
          <nav className="hidden lg:block">
            <Navigation items={marketingMenu} translate={tNav} />
          </nav>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-4">
          <ul className="ml-auto hidden items-center gap-2 lg:flex">{desktopAuthSlot}</ul>
          <MarketingHeaderMobileMenu
            topAuthSlot={mobileTopAuthSlot}
            viewerSlot={mobileViewerSlot}
            footerActionsSlot={mobileFooterActionsSlot}
          />
        </div>
      </Container>
    </FloatingBar>
  );
}

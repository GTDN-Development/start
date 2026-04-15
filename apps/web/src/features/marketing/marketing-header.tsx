import clsx from "clsx";
import { Locale } from "next-intl";
import { FloatingBar } from "@/components/layout/floating-bar";
import { LocalizedNavLink } from "@/components/layout/localized-nav-link";
import { SiteNavigationMenu } from "@/components/layout/site-navigation-menu";
import { Container } from "@/components/ui/container";
import { LogoStart } from "@/components/brand/logo-start";
import { marketingMenu } from "@/config/menu";
import { useTranslations } from "next-intl";
import { MarketingHeaderMobileMenu } from "./marketing-header-mobile-menu";

export function MarketingHeader({
  desktopAuthSlot,
  mobileTopAuthSlot,
  mobileViewerSlot,
  mobileFooterActionsSlot,
  locale,
}: {
  desktopAuthSlot: React.ReactNode;
  mobileTopAuthSlot: React.ReactNode;
  mobileViewerSlot: React.ReactNode;
  mobileFooterActionsSlot: React.ReactNode;
  locale: Locale;
}) {
  const t = useTranslations("layout.header");

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
          <LocalizedNavLink href="/" locale={locale} aria-label={t("homeAriaLabel")}>
            <LogoStart aria-hidden="true" className="w-18" />
          </LocalizedNavLink>
        </div>

        {/* Center */}
        <div className="flex flex-1 items-center justify-center gap-4">
          <nav aria-label={t("menu.title")} className="hidden lg:block">
            <SiteNavigationMenu items={marketingMenu} className="gap-1" />
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

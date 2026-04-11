"use client";

import { useTranslations } from "next-intl";
import {
  MobileMenu,
  MobileMenuClose,
  MobileMenuContent,
  MobileMenuFooter,
  MobileMenuHeader,
  MobileMenuNested,
  MobileMenuTitle,
  MobileMenuTrigger,
} from "@/components/ui/mobile-menu";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/layout/nav-link";
import { SocialMediaIcons } from "@/components/brand/social-media-icons";
import { marketingMenu, isNested, type MenuItem, type MenuLabelKey } from "@/config/menu";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { ChevronRightIcon, MenuIcon } from "lucide-react";

type TranslateNavigationLabel = (key: MenuLabelKey) => string;

type MarketingHeaderMobileMenuProps = {
  topAuthSlot?: React.ReactNode;
  viewerSlot?: React.ReactNode;
  footerActionsSlot?: React.ReactNode;
};

export function MarketingHeaderMobileMenu({
  topAuthSlot,
  viewerSlot,
  footerActionsSlot,
}: MarketingHeaderMobileMenuProps) {
  const { navigationId } = useBrowserPathnameState();
  const t = useTranslations("layout.header");
  const tNav = useTranslations("layout.navigation.items");

  return (
    <div className="flex items-center gap-2 lg:hidden">
      {topAuthSlot}
      <MobileMenu key={navigationId}>
        <Button
          variant="secondary"
          size="icon-lg"
          aria-label={t("menu.openAriaLabel")}
          nativeButton={true}
          render={<MobileMenuTrigger />}
        >
          <MenuIcon aria-hidden="true" />
        </Button>
        <MobileMenuContent>
          <MobileMenuHeader>
            <MobileMenuTitle>{t("menu.title")}</MobileMenuTitle>
          </MobileMenuHeader>
          <div className="space-y-6">
            <MobileNavigation items={marketingMenu} translate={tNav} />
            {viewerSlot}
            <div className="flex w-full items-center justify-center">
              <SocialMediaIcons />
            </div>
            <MobileMenuFooter>
              {footerActionsSlot}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                nativeButton={true}
                render={<MobileMenuClose />}
              >
                {t("menu.close")}
              </Button>
            </MobileMenuFooter>
          </div>
        </MobileMenuContent>
      </MobileMenu>
    </div>
  );
}

function MobileNavigation({
  items,
  translate,
}: {
  items: MenuItem[];
  translate: TranslateNavigationLabel;
}) {
  return (
    <ul className="divide-border flex flex-col divide-y">
      {items.map((item) => {
        if (isNested(item)) {
          return (
            <li key={item.labelKey}>
              <MobileMenuNested>
                <MobileMenuTrigger className="text-foreground flex w-full items-center justify-between gap-3 py-3">
                  {translate(item.labelKey)}
                  <ChevronRightIcon aria-hidden="true" className="size-[1em]" />
                </MobileMenuTrigger>
                <MobileMenuContent>
                  <div className="mx-auto w-full max-w-xl">
                    <MobileMenuHeader>
                      <MobileMenuTitle>{translate(item.labelKey)}</MobileMenuTitle>
                    </MobileMenuHeader>
                    <ul className="divide-border flex flex-col divide-y">
                      {item.items.map((subItem) => (
                        <li key={subItem.href}>
                          <MobileMenuClose
                            render={
                              <NavLink
                                href={subItem.href}
                                className="text-foreground block w-full py-3 data-current:font-medium"
                              />
                            }
                          >
                            {translate(subItem.labelKey)}
                          </MobileMenuClose>
                        </li>
                      ))}
                    </ul>
                  </div>
                </MobileMenuContent>
              </MobileMenuNested>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <MobileMenuClose
              render={
                <NavLink
                  href={item.href}
                  matchNested={item.href === "/blog" || item.href === "/contact"}
                  className="text-foreground block w-full py-3 data-current:font-medium"
                />
              }
            >
              {translate(item.labelKey)}
            </MobileMenuClose>
          </li>
        );
      })}
    </ul>
  );
}

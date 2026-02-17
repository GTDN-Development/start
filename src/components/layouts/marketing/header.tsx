import clsx from "clsx";
import {
  MobileMenu,
  MobileMenuClose,
  MobileMenuContent,
  MobileMenuFooter,
  MobileMenuHeader,
  MobileMenuNested,
  MobileMenuTitle,
  MobileMenuTrigger,
} from "../mobile-menu";
import { FloatingBar } from "../floating-bar";
import { Link } from "@/components/ui/link";
import { Container } from "@/components/ui/container";
import { ChevronDownIcon, ChevronRightIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoStart } from "../logo-start";
import { NavLink } from "../nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authMenu, isNested, marketingMenu, type MenuItem, type MenuLabelKey } from "@/config/menu";
import { SocialMediaIcons } from "../social-media-icons";
import { useTranslations } from "next-intl";

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
                                className="text-foreground block w-full py-3"
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
              render={<NavLink href={item.href} className="text-foreground block w-full py-3" />}
            >
              {translate(item.labelKey)}
            </MobileMenuClose>
          </li>
        );
      })}
    </ul>
  );
}

export function Header() {
  const t = useTranslations("layout.header");
  const tNav = useTranslations("layout.navigation.items");
  const loginMenuItem = authMenu.find((item) => item.labelKey === "login");
  const signUpMenuItem = authMenu.find((item) => item.labelKey === "signUp");

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
        "bg-background/75 border-b border-transparent backdrop-blur-2xl",
        // Scrolled state - when the user starts scrolling
        "data-scrolled:border-border",
        // Hidden state for auto-hide behavior
        "data-hidden:data-scrolled:shadow-none data-hidden:motion-safe:-translate-y-full"
      )}
    >
      <Container className="flex h-full items-center justify-between gap-8">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-4">
          <Link href="/" aria-label={t("homeAriaLabel")}>
            <LogoStart aria-hidden="true" className="w-18" />
          </Link>
        </div>

        {/* Center */}
        <div className="flex flex-1 items-center justify-center gap-4">
          <nav className="hidden lg:block">
            <Navigation items={marketingMenu} translate={tNav} />
          </nav>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-end gap-4">
          {/* Call to action */}
          <ul className="ml-auto hidden items-center gap-2 lg:flex">
            {loginMenuItem && (
              <li>
                <Button
                  variant="ghost"
                  size="lg"
                  nativeButton={false}
                  render={<Link href={loginMenuItem.href} />}
                >
                  {tNav(loginMenuItem.labelKey)}
                </Button>
              </li>
            )}
            {signUpMenuItem && (
              <li>
                <Button size="lg" nativeButton={false} render={<Link href={signUpMenuItem.href} />}>
                  {tNav(signUpMenuItem.labelKey)}
                </Button>
              </li>
            )}
          </ul>

          {/* Mobile menu */}
          <div className="lg:hidden">
            <MobileMenu>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t("menu.openAriaLabel")}
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
                  <SocialMediaIcons />
                  <MobileMenuFooter>
                    {signUpMenuItem && (
                      <MobileMenuClose
                        render={
                          <Button
                            variant="default"
                            size="lg"
                            className="w-full"
                            nativeButton={false}
                            render={<Link href={signUpMenuItem.href} />}
                          />
                        }
                      >
                        {tNav(signUpMenuItem.labelKey)}
                      </MobileMenuClose>
                    )}
                    {loginMenuItem && (
                      <MobileMenuClose
                        render={
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            nativeButton={false}
                            render={<Link href={loginMenuItem.href} />}
                          />
                        }
                      >
                        {tNav(loginMenuItem.labelKey)}
                      </MobileMenuClose>
                    )}
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full"
                      render={<MobileMenuClose />}
                    >
                      {t("menu.close")}
                    </Button>
                  </MobileMenuFooter>
                </div>
              </MobileMenuContent>
            </MobileMenu>
          </div>
        </div>
      </Container>
    </FloatingBar>
  );
}

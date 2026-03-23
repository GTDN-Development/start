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
} from "@/components/ui/mobile-menu";
import { FloatingBar } from "@/components/layout/floating-bar";
import { Link } from "@/components/ui/link";
import { Container } from "@/components/ui/container";
import { ChevronDownIcon, ChevronRightIcon, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoStart } from "@/components/brand/logo-start";
import { NavLink } from "@/components/layout/nav-link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applicationMenu,
  authMenu,
  isNested,
  marketingMenu,
  type MenuItem,
  type MenuLabelKey,
} from "@/config/navigation";
import { SocialMediaIcons } from "@/components/brand/social-media-icons";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { useTranslations } from "next-intl";

type TranslateNavigationLabel = (key: MenuLabelKey) => string;
type HeaderViewer = UserAccountMenuViewer | null;

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

export function MarketingHeader({ viewer }: { viewer: HeaderViewer }) {
  const t = useTranslations("layout.header");
  const tNav = useTranslations("layout.navigation.items");
  const tApplication = useTranslations("layout.application");

  const signInMenuItem = authMenu.find((item) => item.labelKey === "signIn");
  const signUpMenuItem = authMenu.find((item) => item.labelKey === "signUp");
  const appMenuItem = applicationMenu.find((item) => item.labelKey === "app");

  const applicationButtonLabel = t("goToApplication");
  const viewerDisplayName = getViewerDisplayName(viewer);

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
        "bg-background/75 border-b backdrop-blur-2xl",
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
            {viewer ? (
              appMenuItem && (
                <li>
                  <Button size="lg" nativeButton={false} render={<Link href={appMenuItem.href} />}>
                    {applicationButtonLabel}
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-4"
                      data-icon="inline-end"
                    />
                  </Button>
                </li>
              )
            ) : (
              <>
                {signInMenuItem && (
                  <li>
                    <Button
                      variant="ghost"
                      size="lg"
                      nativeButton={false}
                      render={<Link href={signInMenuItem.href} />}
                    >
                      {tNav(signInMenuItem.labelKey)}
                    </Button>
                  </li>
                )}
                {signUpMenuItem && (
                  <li>
                    <Button
                      size="lg"
                      nativeButton={false}
                      render={<Link href={signUpMenuItem.href} />}
                    >
                      {tNav(signUpMenuItem.labelKey)}
                    </Button>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* Mobile menu */}
          <div className="flex items-center gap-2 lg:hidden">
            {viewer && appMenuItem && (
              <Button
                size="lg"
                className="shrink-0"
                nativeButton={false}
                render={<Link href={appMenuItem.href} />}
              >
                {applicationButtonLabel}
                <ChevronRightIcon aria-hidden="true" className="size-4" data-icon="inline-end" />
              </Button>
            )}
            <MobileMenu>
              <Button
                variant="secondary"
                size="icon-lg"
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

                  {viewer && (
                    <div className="border-border rounded-xl border p-4">
                      <p className="text-muted-foreground text-xs">{tApplication("signedInAs")}</p>
                      <p className="mt-1 truncate text-sm font-medium">
                        {viewerDisplayName ?? viewer.email}
                      </p>
                      {viewerDisplayName && (
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                          {viewer.email}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex w-full items-center justify-center">
                    <SocialMediaIcons />
                  </div>

                  <MobileMenuFooter>
                    {viewer && appMenuItem && (
                      <Button
                        size="lg"
                        className="w-full"
                        nativeButton={false}
                        render={<MobileMenuClose render={<Link href={appMenuItem.href} />} />}
                      >
                        {applicationButtonLabel}
                        <ChevronRightIcon aria-hidden="true" data-icon="inline-end" />
                      </Button>
                    )}
                    {!viewer && (
                      <>
                        {signUpMenuItem && (
                          <Button
                            size="lg"
                            className="w-full"
                            nativeButton={false}
                            render={
                              <MobileMenuClose render={<Link href={signUpMenuItem.href} />} />
                            }
                          >
                            {tNav(signUpMenuItem.labelKey)}
                          </Button>
                        )}
                        {signInMenuItem && (
                          <Button
                            variant="secondary"
                            size="lg"
                            className="w-full"
                            nativeButton={false}
                            render={
                              <MobileMenuClose render={<Link href={signInMenuItem.href} />} />
                            }
                          >
                            {tNav(signInMenuItem.labelKey)}
                          </Button>
                        )}
                      </>
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

function getViewerDisplayName(viewer: HeaderViewer) {
  if (!viewer) {
    return null;
  }

  const name = viewer.name?.trim();

  return name || null;
}

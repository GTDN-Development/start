import { Link } from "@/components/ui/link";
import { Logo } from "@/components/ui/logo";
import { ArrowUpIcon, ChevronDownIcon } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import { Container } from "@/components/ui/container";
import { ThemeSwitcher } from "./theme-switcher";
import { SocialMediaIcons } from "./social-media-icons";
import { getMenu, getMenuLinks, isNested, type MenuItem, type MenuLabelKey } from "@/config/menu";
import { Separator } from "../ui/separator";
import { CookieSettingsTrigger } from "@/components/(shared)/cookies/cookie-settings-trigger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

import { chain, cn } from "@/lib/utils";
import { site } from "@/config/site";
import { useTranslations } from "next-intl";

const isProduction = process.env.NODE_ENV === "production";
const footerNavigationItems = getMenu("footerNavigation");
const footerLegalItems = getMenuLinks("footerLegal");

type TranslateNavigationLabel = (key: MenuLabelKey) => string;

function FooterNavigation({
  items,
  translate,
}: {
  items: MenuItem[];
  translate: TranslateNavigationLabel;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => {
        if (isNested(item)) {
          return (
            <li key={item.labelKey}>
              <Collapsible className="space-y-2">
                <CollapsibleTrigger className="flex items-center justify-start gap-3 text-sm font-medium">
                  {translate(item.labelKey)}
                  <ChevronDownIcon aria-hidden="true" className="size-4" />
                </CollapsibleTrigger>
                <CollapsibleContent render={<ul className="space-y-2 pl-2" />}>
                  {item.items.map((subItem) => (
                    <li key={subItem.href}>
                      <NavLink
                        href={subItem.href}
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        {translate(subItem.labelKey)}
                      </NavLink>
                    </li>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        }

        return (
          <li key={item.href}>
            <NavLink
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {translate(item.labelKey)}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export function Footer(props: React.ComponentProps<"footer">) {
  const t = useTranslations("layout.footer");
  const tNav = useTranslations("layout.navigation.items");

  return (
    <footer {...props} className={cn("border-t-border border-t", props.className)}>
      <Container>
        <div className="grid gap-x-32 gap-y-16 py-16 lg:grid-cols-3 xl:gap-x-52">
          {/* Brand section */}
          <div className="flex flex-col items-start justify-start gap-7">
            <Link href="/" aria-label={t("homeAriaLabel")}>
              <Logo aria-hidden="true" className="w-20" />
            </Link>
            <p className="text-sm">{t("description")}</p>
            <Separator />
            <ThemeSwitcher />
          </div>

          <div className="grid gap-y-16 sm:grid-cols-2 md:grid-cols-3 lg:col-span-2">
            <div className="flex flex-col items-start justify-start gap-7">
              <p className="text-sm font-semibold">{t("sections.navigation")}</p>
              <FooterNavigation items={footerNavigationItems} translate={tNav} />
              {!isProduction && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">Dev</p>
                  <ul className="flex flex-col gap-2">
                    <li>
                      <NavLink
                        href="/components"
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        Components
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        href="/colors"
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                      >
                        Colors
                      </NavLink>
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start justify-start gap-7">
              <p className="text-sm font-semibold">{t("sections.legal")}</p>
              <ul className="flex flex-col gap-2">
                {footerLegalItems.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                      {tNav(item.labelKey)}
                    </NavLink>
                  </li>
                ))}
                <li>
                  <CookieSettingsTrigger className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    {t("cookieSettings")}
                  </CookieSettingsTrigger>
                </li>
              </ul>
            </div>

            <div className="flex flex-col items-start justify-start gap-6">
              <p className="text-sm font-semibold">{t("sections.socialMedia")}</p>
              <SocialMediaIcons />
            </div>
          </div>
        </div>

        {/* Metadata footer section */}
        <div className="border-t-border flex min-w-0 flex-col flex-wrap items-start justify-between gap-6 border-t py-10 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center">
            <Copyright company={site.name} />
          </div>
          <div className="flex flex-1 items-center sm:justify-center">
            <AgencyCredit />
          </div>
          <div className="flex flex-1 items-center sm:justify-end">
            <ScrollToTopButton className="mt-auto" />
          </div>
        </div>
      </Container>
    </footer>
  );
}

function Copyright({
  company = "Your Company",
  ...props
}: Omit<React.ComponentProps<"p">, "children"> & {
  company?: string;
}) {
  const t = useTranslations("layout.footer");

  return (
    <p {...props} className={cn("text-text-subtle text-sm", props.className)}>
      {t("copyright", { year: new Date().getFullYear(), company })}
    </p>
  );
}

function ScrollToTopButton(props: React.ComponentProps<"button">) {
  const t = useTranslations("layout.footer");

  return (
    <button
      {...props}
      onClick={chain(props.onClick, () => window.scrollTo({ top: 0, behavior: "smooth" }))}
      className={cn(
        "cursor-pointer text-sm underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60",
        props.className
      )}
    >
      {t("scrollToTop")} <ArrowUpIcon aria-hidden="true" className="ml-1 inline size-[1em]" />
    </button>
  );
}

function AgencyCredit(props: React.ComponentProps<"p">) {
  const t = useTranslations("layout.footer");

  return (
    <p {...props} className={cn("text-sm", props.className)}>
      <span>{t("createdBy")} </span>
      <NavLink
        href="https://www.gtdn.online/"
        className="underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60"
        showExternalIcon
      >
        gtdn.online
      </NavLink>
    </p>
  );
}

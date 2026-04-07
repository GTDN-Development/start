"use client";

import { LocalizedPathLink } from "@/components/ui/link";
import { LogoStart } from "@/components/brand/logo-start";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import { Container } from "@/components/ui/container";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { SocialMediaIcons } from "@/components/brand/social-media-icons";
import {
  isNested,
  legalItems,
  marketingMenu,
  type MenuItem,
  type MenuLabelKey,
} from "@/config/menu";
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { app } from "@/config/app";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { legal } from "@/config/legal";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { formatPhoneNumber } from "@/lib/app-utils";
import { cn } from "@/lib/utils";
import { isCookieConsentEnabled } from "@/features/cookies/cookie-consent";

type TranslateNavigationLabel = (key: MenuLabelKey) => string;

const COPYRIGHT_YEAR = new Date().getFullYear();

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
            <DropdownMenu key={item.labelKey}>
              <li>
                <DropdownMenuTrigger
                  render={
                    <button className="text-muted-foreground hover:text-foreground flex items-center justify-start gap-3 text-sm transition-colors" />
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

export function MarketingFooter({
  accountSection,
  homeHref,
  ...props
}: React.ComponentProps<"footer"> & { accountSection: React.ReactNode; homeHref: string }) {
  const t = useTranslations("layout.footer");
  const tNav = useTranslations("layout.navigation.items");
  const cookieConsentEnabled = isCookieConsentEnabled();

  const primaryLegalDetails = [legal.legalName, legal.id, legal.address];

  return (
    <footer {...props} className={cn("border-t-border border-t", props.className)}>
      {/* First row - Logo & socials */}
      <Container className="flex flex-wrap items-center justify-between gap-8 pt-16">
        <div className="flex flex-col items-start justify-start gap-7 min-[24rem]:col-span-2 md:col-span-4 lg:col-span-1">
          <LocalizedPathLink href={homeHref} aria-label={t("homeAriaLabel")}>
            <LogoStart aria-hidden="true" className="w-18" />
          </LocalizedPathLink>
        </div>

        <SocialMediaIcons />
      </Container>

      {/* Second row - Grid columns with main footer content */}
      <Container className="grid gap-x-10 gap-y-16 py-16 min-[24rem]:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <div className="flex flex-col items-start justify-start gap-7">
          <p className="font-heading text-sm font-semibold">{t("sections.navigation")}</p>
          <FooterNavigation items={marketingMenu} translate={tNav} />
        </div>

        {accountSection}

        <div className="flex flex-col items-start justify-start gap-6">
          <p className="font-heading text-sm font-semibold">{t("sections.contactDetails")}</p>
          <ul className="flex flex-col gap-3">
            {primaryLegalDetails.map((item) => (
              <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-3">
            <li>
              <FooterItemToCopy
                toCopy={legal.contact.email}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {legal.contact.email}
              </FooterItemToCopy>
            </li>
            {legal.contact.phone && (
              <li>
                <FooterItemToCopy
                  toCopy={legal.contact.phone}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {formatPhoneNumber(legal.contact.phone)}
                </FooterItemToCopy>
              </li>
            )}
          </ul>
        </div>

        <div className="flex flex-col items-start justify-start gap-7">
          <p className="font-heading text-sm font-semibold">{t("sections.legal")}</p>
          <ul className="flex flex-col gap-2">
            {legalItems.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {tNav(item.labelKey)}
                </NavLink>
              </li>
            ))}
            {cookieConsentEnabled && (
              <li>
                <CookieSettingsTrigger className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                  {t("cookieSettings")}
                </CookieSettingsTrigger>
              </li>
            )}
          </ul>
        </div>
      </Container>

      {/* Third row - Footer meta with basic app settings */}
      <Container className="border-t-border flex min-w-0 flex-col flex-wrap items-center justify-between gap-6 border-t py-8 md:flex-row">
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <Copyright company={app.site.name} />
        </div>
        <div className="flex flex-1 items-center justify-center gap-4">
          <AgencyCredit />

          {/*<ScrollToTopButton className="text-sm underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60">
            {t("scrollToTop")} <ArrowUpIcon aria-hidden="true" className="ml-1 inline size-[1em]" />
          </ScrollToTopButton>*/}
        </div>
        <div className="flex flex-1 items-center justify-center gap-4 md:justify-end">
          <ThemeSwitcher />
          <LocaleSwitcher />
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
      {t("copyright", { year: COPYRIGHT_YEAR, company })}
    </p>
  );
}

function AgencyCredit(props: React.ComponentProps<"p">) {
  const t = useTranslations("layout.footer");
  const author = app.metadata.authors[0];

  if (!author) {
    return null;
  }

  return (
    <p {...props} className={cn("text-sm", props.className)}>
      <span>{t("createdBy")} </span>
      <a
        href={author.url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-current/20 decoration-1 underline-offset-2 hover:decoration-current/60"
      >
        {author.name}
      </a>
    </p>
  );
}

function FooterItemToCopy({
  children,
  toCopy,
  className,
}: {
  children: React.ReactNode;
  toCopy: string;
  className?: string;
}) {
  const t = useTranslations("layout.footer");

  return (
    <CopyButton
      toCopy={toCopy}
      onCopy={() =>
        toast(t("copiedValueToClipboard", { value: toCopy }), { position: "bottom-center" })
      }
      className={cn("relative", className)}
    >
      {({ isCopied }) => (
        <>
          {children}
          {isCopied ? (
            <CheckIcon aria-hidden="true" className="ml-2 inline size-[1em] opacity-60" />
          ) : (
            <CopyIcon aria-hidden="true" className="ml-2 inline size-[1em] opacity-60" />
          )}
        </>
      )}
    </CopyButton>
  );
}

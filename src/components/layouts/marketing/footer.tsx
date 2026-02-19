import { Link } from "@/components/ui/link";
import { LogoStart } from "../logo-start";
import { CheckIcon, ChevronDownIcon, CopyIcon } from "lucide-react";
import { NavLink } from "../nav-link";
import { Container } from "@/components/ui/container";
import { ThemeSwitcher } from "../theme-switcher";
import { SocialMediaIcons } from "../social-media-icons";
import {
  authMenu,
  flattenMenuItems,
  isNested,
  legalItems,
  marketingMenu,
  type MenuItem,
  type MenuLabelKey,
} from "@/config/menu";
import { CookieSettingsTrigger } from "@/components/(shared)/cookies/cookie-settings-trigger";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { site } from "@/config/site";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { contact, formatPhoneNumber } from "@/config/contact";
import { legal } from "@/config/legal";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/layouts/locale-switcher";
import { cn } from "@/lib/utils";

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

export function Footer(props: React.ComponentProps<"footer">) {
  const t = useTranslations("layout.footer");
  const tNav = useTranslations("layout.navigation.items");
  const copiedToClipboardMessage = t("copiedToClipboard");
  const primaryLegalDetails = [legal.legalName, legal.id, legal.address];

  return (
    <footer {...props} className={cn("border-t-border border-t", props.className)}>
      {/* First row - Logo & socials */}
      <Container className="flex flex-wrap items-center justify-between gap-8 pt-16">
        <div className="flex flex-col items-start justify-start gap-7 min-[24rem]:col-span-2 md:col-span-4 lg:col-span-1">
          <Link href="/" aria-label={t("homeAriaLabel")}>
            <LogoStart aria-hidden="true" className="w-18" />
          </Link>
        </div>

        <SocialMediaIcons className="" />
      </Container>

      {/* Second row - Grid columns with main footer content */}
      <Container className="grid gap-x-10 gap-y-16 py-16 min-[24rem]:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
        <div className="flex flex-col items-start justify-start gap-7">
          <p className="text-sm font-semibold">{t("sections.navigation")}</p>
          <FooterNavigation items={marketingMenu} translate={tNav} />
        </div>

        <div className="flex flex-col items-start justify-start gap-7">
          <p className="text-sm font-semibold">{tNav("account")}</p>
          <ul className="flex flex-col gap-2">
            {authMenu.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {tNav(item.labelKey)}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start justify-start gap-6">
          <p className="text-sm font-semibold">{t("sections.contactDetails")}</p>
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
                toCopy={contact.email}
                copyToastTitle={copiedToClipboardMessage}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {contact.email}
              </FooterItemToCopy>
            </li>
            <li>
              <FooterItemToCopy
                toCopy={contact.phone}
                copyToastTitle={copiedToClipboardMessage}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {formatPhoneNumber(contact.phone)}
              </FooterItemToCopy>
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-start justify-start gap-7">
          <p className="text-sm font-semibold">{t("sections.legal")}</p>
          <ul className="flex flex-col gap-2">
            {flattenMenuItems(legalItems).map((item) => (
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
      </Container>

      {/* Third row - Footer meta with basic app settings */}
      <Container className="border-t-border flex min-w-0 flex-col flex-wrap items-center justify-between gap-6 border-t py-10 md:flex-row">
        <div className="flex flex-1 items-center justify-center md:justify-start">
          <Copyright company={site.name} />
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

      {/* Fourth row - Dev only section */}
      {/*{!isProduction && (
        <div className="bg-destructive/10 border-t-destructive/50 border-t py-2">
          <Container className="flex flex-col justify-between gap-2 md:flex-row">
            <p className="text-sm font-semibold">DEV only part of the footer</p>
            <ul className="flex flex-col gap-2 md:flex-row md:gap-5">
              <li>
                <NavLink
                  href="/components"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Components page
                </NavLink>
              </li>
              <li>
                <NavLink
                  href="/colors"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  Colors page
                </NavLink>
              </li>
            </ul>
          </Container>
        </div>
      )}*/}
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

function FooterItemToCopy({
  children,
  toCopy,
  copyToastTitle,
  className,
}: {
  children: React.ReactNode;
  toCopy: string;
  copyToastTitle: string;
  className?: string;
}) {
  return (
    <CopyButton
      toCopy={toCopy}
      onCopy={() => toast(copyToastTitle, { description: toCopy, position: "bottom-center" })}
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

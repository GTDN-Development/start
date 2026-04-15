import { Container } from "@/components/ui/container";
import { SiteNavigationMenu } from "@/components/layout/site-navigation-menu";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { applicationFooterMenu } from "@/config/menu";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ApplicationFooter({ className, ...props }: React.ComponentProps<"footer">) {
  const tFooter = useTranslations("layout.footer");

  return (
    <footer {...props} className={cn("border-t-border border-t", className)}>
      <Container className="flex flex-wrap items-center justify-center gap-x-4 gap-y-8 py-8 sm:justify-between">
        <nav aria-label={tFooter("sections.navigation")}>
          <SiteNavigationMenu
            items={applicationFooterMenu}
            className="flex-wrap justify-center gap-1 sm:justify-start"
          />
        </nav>

        <div className="flex items-center gap-2 sm:ml-auto">
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </Container>
    </footer>
  );
}

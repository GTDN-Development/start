"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { legalItems } from "@/config/menu";
import { useCookieContext } from "./cookie-context";
import { useTranslations } from "next-intl";

export function CookieConsentBanner() {
  const t = useTranslations("cookies.consent.banner");
  const tNav = useTranslations("layout.navigation.items");
  const { hasInteracted, isReady, acceptAll, rejectAll, openSettingsDialog } = useCookieContext();

  if (!isReady || hasInteracted) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-6 pb-4">
      <div className="mx-auto w-full max-w-7xl">
        <div className="bg-background text-foreground pointer-events-auto w-full overflow-hidden rounded-lg border shadow-md dark:shadow-none">
          <div className="grid gap-5 p-4 sm:px-6 sm:pt-6 sm:pb-3">
            <div>
              <p className="font-heading text-lg font-semibold">{t("title")}</p>
              <p className="mt-2 max-w-4xl text-sm">{t("description")}</p>
            </div>
            <div className="flex flex-col items-center gap-2 *:w-full sm:flex-row sm:*:w-auto">
              <Button size="lg" variant="secondary" onClick={openSettingsDialog}>
                {t("settings")}
              </Button>
              <Button size="lg" onClick={rejectAll} className="sm:ml-auto">
                {t("rejectAll")}
              </Button>
              <Button size="lg" onClick={acceptAll}>
                {t("acceptAll")}
              </Button>
            </div>
          </div>

          <div className="bg-muted dark:bg-muted/50 flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-1.5 sm:px-6">
            {legalItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {tNav(item.labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

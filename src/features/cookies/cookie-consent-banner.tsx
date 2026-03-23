"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/navigation";
import { useCookieContext } from "./cookie-context";
import { useTranslations } from "next-intl";

export function CookieConsentBanner() {
  const t = useTranslations("cookies.consent.banner");
  const { hasInteracted, acceptAll, rejectAll, openSettingsDialog } = useCookieContext();

  if (hasInteracted) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-6 pb-3">
      <div className="mx-auto w-full max-w-7xl">
        <div className="bg-background text-foreground border-border pointer-events-auto w-full overflow-hidden rounded-xl border shadow-md dark:shadow-none">
          <div className="grid gap-5 p-8">
            <div>
              <p>{t("description")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="lg" variant="secondary" onClick={openSettingsDialog}>
                {t("settings")}
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="secondary" size="lg" onClick={rejectAll}>
                  {t("deny")}
                </Button>
                <Button variant="default" size="lg" onClick={acceptAll}>
                  {t("acceptAll")}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-muted border-border flex items-center gap-4 px-4 py-2">
            <Link
              href={legalLinks.termsOfService.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {t("footer.termsOfService")}
            </Link>
            <Link
              href={legalLinks.gdpr.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {t("footer.privacyPolicy")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

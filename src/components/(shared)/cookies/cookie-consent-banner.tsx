"use client";

import { Button } from "@/components/ui/button";
import { useCookieContext } from "./cookie-context";
import { useTranslations } from "next-intl";

export function CookieConsentBanner() {
  const t = useTranslations("cookies.consent.banner");
  const { hasInteracted, isMounted, saveConsent, openSettingsDialog } = useCookieContext();

  if (!isMounted || hasInteracted) {
    return null;
  }

  function handleDeny() {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
  }

  function handleAcceptAll() {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 z-50 w-screen max-w-lg px-5 pb-3">
      <div className="bg-background text-foreground border-border pointer-events-auto grid w-full gap-5 rounded-xl border p-4 shadow-md dark:shadow-none">
        <div>
          <p>{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-3">
          <Button variant="secondary" size="sm" onClick={handleDeny}>
            {t("deny")}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleAcceptAll}>
            {t("acceptAll")}
          </Button>
          <Button size="sm" className="sm:ml-auto sm:justify-self-end" onClick={openSettingsDialog}>
            {t("settings")}
          </Button>
        </div>
      </div>
    </div>
  );
}

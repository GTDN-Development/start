"use client";

import { useTranslations } from "next-intl";
import { CookieIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";
import { cn } from "@/lib/utils";

export function AccountCookieSettingsItem() {
  const t = useTranslations("pages.account.preferences");
  const cookieConsentEnabled = isCookieConsentEnabled();

  if (!cookieConsentEnabled) {
    return null;
  }

  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("cookies.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("cookies.description")}</SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody>
          <CookieSettingsTrigger
            type="button"
            className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-fit")}
          >
            <CookieIcon aria-hidden="true" />
            {t("cookies.cta")}
          </CookieSettingsTrigger>
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>{t("cookies.footerHint")}</SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

"use client";

import { useParams } from "next/navigation";
import { Locale, useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { getPathname, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function AccountLanguageSettingsItem() {
  const locale = useLocale();
  const t = useTranslations("pages.account.preferences");
  const tLocale = useTranslations("common.localeSwitcher");

  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  function handleValueChange(nextLocale: string | null) {
    if (!nextLocale) {
      return;
    }

    startTransition(() => {
      const localizedPathname = getPathname({
        // @ts-expect-error -- TypeScript validates params against the current pathname.
        href: { pathname, params },
        locale: nextLocale as Locale,
      });

      window.location.replace(
        `${localizedPathname}${window.location.search}${window.location.hash}`
      );
    });
  }

  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("language.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("language.description")}</SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody>
          <Select value={locale} onValueChange={handleValueChange} disabled={isPending}>
            <SelectTrigger
              id="account-language-preference"
              className="w-full sm:w-56"
              aria-label={t("language.title")}
            >
              <SelectValue>
                {(value) => (value ? tLocale("locale", { locale: value }) : "")}
              </SelectValue>
            </SelectTrigger>

            <SelectContent align="start">
              <SelectGroup>
                {routing.locales.map((currentLocale) => (
                  <SelectItem key={currentLocale} value={currentLocale}>
                    {tLocale("locale", { locale: currentLocale })}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>{t("language.footerHint")}</SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

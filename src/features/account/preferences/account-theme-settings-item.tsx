"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { useHydrated } from "@/hooks/use-hydrated";

const THEME_OPTIONS = ["light", "system", "dark"] as const;

export function AccountThemeSettingsItem() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("pages.account.preferences");
  const isHydrated = useHydrated();

  function handleValueChange(value: string) {
    setTheme(value);
  }

  return (
    <SettingsItem>
      <SettingsItemContent className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("theme.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("theme.description")}</SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody className="@container">
          {isHydrated ? (
            <FieldSet>
              <FieldLegend className="sr-only">{t("theme.title")}</FieldLegend>
              <RadioGroup
                value={theme}
                onValueChange={handleValueChange}
                className="grid gap-3 @lg:grid-cols-3"
              >
                {THEME_OPTIONS.map((option) => (
                  <FieldLabel key={option} htmlFor={`account-theme-${option}`} className="h-full">
                    <Field orientation="horizontal" className="h-full items-start justify-between">
                      <FieldContent>
                        <FieldTitle>{t(`theme.options.${option}.title`)}</FieldTitle>
                        <FieldDescription>
                          {t(`theme.options.${option}.description`)}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        id={`account-theme-${option}`}
                        value={option}
                        aria-label={t(`theme.options.${option}.title`)}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </FieldSet>
          ) : null}
        </SettingsItemContentBody>
      </SettingsItemContent>

      <SettingsItemFooter>
        <SettingsItemDescription>{t("theme.footerHint")}</SettingsItemDescription>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

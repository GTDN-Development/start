"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { useCookieContext } from "./cookie-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/navigation";
import { useTranslations } from "next-intl";
import type { ConsentState } from "./cookie-consent";

type CookieCategoryConfig = {
  key: keyof ConsentState;
  isEditable: boolean;
};

const COOKIE_CATEGORY_CONFIG: CookieCategoryConfig[] = [
  { key: "necessary", isEditable: false },
  { key: "functional", isEditable: true },
  { key: "analytics", isEditable: true },
  { key: "marketing", isEditable: true },
];

export function CookieSettingsDialog() {
  const t = useTranslations("cookies.consent.dialog");
  const {
    consent,
    updateConsent,
    acceptAll,
    rejectAll,
    savePreferences,
    isSettingsOpen,
    closeSettingsDialog,
  } = useCookieContext();

  function handleDeny() {
    rejectAll();
    closeSettingsDialog();
  }

  function handleAcceptAll() {
    acceptAll();
    closeSettingsDialog();
  }

  function handleSave() {
    savePreferences();
    closeSettingsDialog();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      closeSettingsDialog();
    }
  }

  function handleCategoryCheckedChange(category: CookieCategoryConfig, checked: boolean) {
    if (!category.isEditable) {
      return;
    }

    updateConsent(category.key, checked);
  }

  return (
    <AlertDialog open={isSettingsOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <div className="border-border divide-border mt-4 divide-y rounded-lg border">
            {COOKIE_CATEGORY_CONFIG.map((category) => {
              const categoryTranslationKey = `categories.${category.key}`;
              const categoryInputId = `cookie-category-${category.key}`;

              return (
                <div key={category.key} className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor={categoryInputId}
                      className={
                        category.isEditable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                      }
                    >
                      {t(`${categoryTranslationKey}.label`)}
                    </Label>
                    <Switch
                      id={categoryInputId}
                      checked={consent[category.key]}
                      disabled={!category.isEditable}
                      onCheckedChange={(checked) => handleCategoryCheckedChange(category, checked)}
                      aria-label={t(`${categoryTranslationKey}.ariaLabel`)}
                    />
                  </div>
                  <p
                    className={
                      category.isEditable
                        ? "text-muted-foreground text-sm"
                        : "text-muted-foreground text-sm opacity-70"
                    }
                  >
                    {t(`${categoryTranslationKey}.description`)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <p className="text-muted-foreground text-sm">
              {t("moreInfo")}{" "}
              <Link
                href={legalLinks.cookies.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                {t("cookiesPolicy")}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <AlertDialogPrimitive.Close render={<Button variant="secondary" />} onClick={handleSave}>
            {t("actions.save")}
          </AlertDialogPrimitive.Close>
          <div className="ml-auto flex gap-2">
            <AlertDialogPrimitive.Close
              render={<Button variant="secondary" />}
              onClick={handleDeny}
            >
              {t("actions.deny")}
            </AlertDialogPrimitive.Close>
            <AlertDialogPrimitive.Close render={<Button />} onClick={handleAcceptAll}>
              {t("actions.acceptAll")}
            </AlertDialogPrimitive.Close>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

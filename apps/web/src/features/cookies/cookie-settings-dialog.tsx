"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { isCookieConsentEnabled, type ConsentState } from "@/config/cookie-consent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "@/components/ui/link";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { legalLinks } from "@/config/menu";
import { cn } from "@/lib/utils";
import { useCookieContext } from "./cookie-context";

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
  const cookieConsentEnabled = isCookieConsentEnabled();
  const t = useTranslations("cookies.consent.dialog");
  const [openCategoryKeys, setOpenCategoryKeys] = useState<Record<keyof ConsentState, boolean>>({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });
  const {
    consent,
    updateConsent,
    acceptAll,
    rejectAll,
    savePreferences,
    isReady,
    isSettingsOpen,
    closeSettingsDialog,
  } = useCookieContext();

  if (!cookieConsentEnabled || !isReady) {
    return null;
  }

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

        <div className="border-border divide-border mt-3 divide-y rounded-lg border">
          {COOKIE_CATEGORY_CONFIG.map((category) => {
            const categoryTranslationKey = `categories.${category.key}`;
            const categoryInputId = `cookie-category-${category.key}`;
            const categoryLabelId = `${categoryInputId}-label`;
            const isOpen = openCategoryKeys[category.key];

            return (
              <Collapsible
                key={category.key}
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCategoryKeys((currentState) => ({
                    ...currentState,
                    [category.key]: open,
                  }))
                }
              >
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <CollapsibleTrigger className="flex min-w-0 items-center gap-2">
                      <ChevronDownIcon
                        aria-hidden="true"
                        className={cn("size-4 shrink-0", isOpen && "rotate-180")}
                      />
                      <div className="flex min-w-0 items-center gap-2">
                        <span id={categoryLabelId} className="block text-sm font-medium">
                          {t(`${categoryTranslationKey}.label`)}
                        </span>
                        {!category.isEditable && (
                          <Badge variant="default">
                            {t(`${categoryTranslationKey}.alwaysEnabled`)}
                          </Badge>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <Switch
                      id={categoryInputId}
                      checked={consent[category.key]}
                      disabled={!category.isEditable}
                      onCheckedChange={(checked) => handleCategoryCheckedChange(category, checked)}
                      aria-labelledby={categoryLabelId}
                      aria-label={t(`${categoryTranslationKey}.ariaLabel`)}
                    />
                  </div>

                  <CollapsibleContent className="overflow-hidden">
                    <p className="text-muted-foreground pt-1 text-sm">
                      {t(`${categoryTranslationKey}.description`)}
                    </p>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        <div>
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

        <AlertDialogFooter className="flex items-center gap-2">
          <AlertDialogPrimitive.Close render={<Button variant="secondary" />} onClick={handleSave}>
            {t("actions.save")}
          </AlertDialogPrimitive.Close>
          <div className="ml-auto flex gap-2">
            <AlertDialogPrimitive.Close render={<Button />} onClick={handleDeny}>
              {t("actions.rejectAll")}
            </AlertDialogPrimitive.Close>
            <AlertDialogPrimitive.Close render={<Button />} onClick={handleAcceptAll}>
              {t("actions.acceptAll")}
            </AlertDialogPrimitive.Close>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

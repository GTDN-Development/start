"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useCookieContext } from "./cookie-context";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/ui/link";
import { legalLinks } from "@/config/legal-links";
import { useTranslations } from "next-intl";

export function CookieSettingsDialog() {
  const t = useTranslations("cookies.consent.dialog");
  const { consent, updateConsent, saveConsent, isSettingsOpen, closeSettingsDialog } =
    useCookieContext();

  function handleDeny() {
    saveConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    });
    closeSettingsDialog();
  }

  function handleAcceptAll() {
    saveConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    });
    closeSettingsDialog();
  }

  function handleSave() {
    saveConsent();
    closeSettingsDialog();
  }

  return (
    <AlertDialog open={isSettingsOpen} onOpenChange={closeSettingsDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <div className="border-border divide-border mt-4 divide-y rounded-lg border">
            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="necessary" className="cursor-not-allowed opacity-70">
                  {t("categories.necessary.label")}
                </Label>
                <Switch
                  id="necessary"
                  checked={consent.necessary}
                  disabled
                  aria-label={t("categories.necessary.ariaLabel")}
                />
              </div>
              <p className="text-muted-foreground text-sm opacity-70">
                {t("categories.necessary.description")}
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="functional" className="cursor-pointer">
                  {t("categories.functional.label")}
                </Label>
                <Switch
                  id="functional"
                  checked={consent.functional}
                  onCheckedChange={(checked) => updateConsent("functional", checked as boolean)}
                  aria-label={t("categories.functional.ariaLabel")}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t("categories.functional.description")}
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="analytics" className="cursor-pointer">
                  {t("categories.analytics.label")}
                </Label>
                <Switch
                  id="analytics"
                  checked={consent.analytics}
                  onCheckedChange={(checked) => updateConsent("analytics", checked as boolean)}
                  aria-label={t("categories.analytics.ariaLabel")}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t("categories.analytics.description")}
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="marketing" className="cursor-pointer">
                  {t("categories.marketing.label")}
                </Label>
                <Switch
                  id="marketing"
                  checked={consent.marketing}
                  onCheckedChange={(checked) => updateConsent("marketing", checked as boolean)}
                  aria-label={t("categories.marketing.ariaLabel")}
                />
              </div>
              <p className="text-muted-foreground text-sm">
                {t("categories.marketing.description")}
              </p>
            </div>
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
        <AlertDialogFooter className="mt-4">
          <AlertDialogPrimitive.Action asChild>
            <Button variant="secondary" onClick={handleDeny}>
              {t("actions.deny")}
            </Button>
          </AlertDialogPrimitive.Action>
          <AlertDialogPrimitive.Action asChild>
            <Button variant="secondary" onClick={handleAcceptAll}>
              {t("actions.acceptAll")}
            </Button>
          </AlertDialogPrimitive.Action>
          <AlertDialogPrimitive.Action asChild>
            <Button onClick={handleSave}>{t("actions.save")}</Button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

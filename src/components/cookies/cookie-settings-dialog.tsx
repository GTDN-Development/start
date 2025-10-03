"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { useCookieContext } from "./cookie-context";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Link } from "../ui/link";
import { legalLinks } from "@/config/legal-links";

export function CookieSettingsDialog() {
  const { consent, updateConsent, saveConsent, isSettingsOpen, closeSettingsDialog } =
    useCookieContext();

  function handleDeny() {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
    closeSettingsDialog();
  }

  function handleAcceptAll() {
    saveConsent({
      necessary: true,
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
          <AlertDialogTitle>Cookie Consent Settings</AlertDialogTitle>
          <AlertDialogDescription>
            This site uses tracking technologies. You may opt in or opt out of the use of these
            technologies.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div>
          <div className="border-border divide-border mt-4 divide-y rounded-lg border">
            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="necessary" className="cursor-not-allowed opacity-70">
                  Necessary
                </Label>
                <Switch
                  id="necessary"
                  checked={consent.necessary}
                  disabled
                  aria-label="Necessary cookies (always enabled)"
                />
              </div>
              <p className="text-muted-foreground text-sm opacity-70">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Enim totam corrupti
                voluptate recusandae harum dolorem voluptatibus quam distinctio, aliquid qui?
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="analytics" className="cursor-pointer">
                  Analytics
                </Label>
                <Switch
                  id="analytics"
                  checked={consent.analytics}
                  onCheckedChange={(checked) => updateConsent("analytics", checked as boolean)}
                  aria-label="Analytics cookies"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Nam quas perspiciatis
                corporis deleniti est magni ipsam esse quis. Necessitatibus, quibusdam.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="marketing" className="cursor-pointer">
                  Marketing
                </Label>
                <Switch
                  id="marketing"
                  checked={consent.marketing}
                  onCheckedChange={(checked) => updateConsent("marketing", checked as boolean)}
                  aria-label="Marketing cookies"
                />
              </div>
              <p className="text-muted-foreground text-sm">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Voluptas quas totam ipsam
                distinctio exercitationem voluptatibus aut sapiente accusantium maiores libero.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-muted-foreground text-sm">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Ratione corrupti et deleniti!
              Read our{" "}
              <Link
                href={legalLinks.gdpr.href}
                target="_blank"
                rel="noopenner noreferrer"
                className="text-foreground underline"
              >
                {legalLinks.gdpr.name}
              </Link>
              .
            </p>
          </div>
        </div>
        <AlertDialogFooter className="mt-4">
          <AlertDialogPrimitive.Action asChild>
            <Button variant="secondary" onClick={handleDeny}>
              Deny
            </Button>
          </AlertDialogPrimitive.Action>
          <AlertDialogPrimitive.Action asChild>
            <Button variant="secondary" onClick={handleAcceptAll}>
              Accept all
            </Button>
          </AlertDialogPrimitive.Action>
          <AlertDialogPrimitive.Action asChild>
            <Button onClick={handleSave}>Save</Button>
          </AlertDialogPrimitive.Action>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

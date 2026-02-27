"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/features/account/account-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { readAccountSettingsApiResponse } from "@/features/account/account-response";
import { notifyAuthSync } from "@/features/auth/auth-sync-events";
import { Trash2Icon } from "lucide-react";
import { resolveErrorMessage } from "@/lib/utils";

export function AccountDeleteAccountSettingsItem() {
  const t = useTranslations("pages.account");
  const router = useRouter();
  const deleteAccountToastId = React.useId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = React.useState(false);

  async function handleDeleteAccountConfirm() {
    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok) {
        toast.error(t("common.errorTitle"), {
          id: deleteAccountToastId,
          description: resolveErrorMessage(result?.errorCode, t("deleteAccount.status.error"), {
            DELETE_NOT_ALLOWED: t("deleteAccount.status.deleteNotAllowed"),
            UNAUTHORIZED: t("deleteAccount.status.unauthorized"),
          }),
        });
        return;
      }

      toast.success(t("common.successTitle"), {
        id: deleteAccountToastId,
        description: t("deleteAccount.status.success"),
      });

      notifyAuthSync("auth");
      setIsDeleteDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error(t("common.errorTitle"), {
        id: deleteAccountToastId,
        description: t("deleteAccount.status.error"),
      });
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <AccountItem variant="destructive">
      <AccountItemContent>
        <AccountItemContentHeader>
          <AccountItemTitle>{t("deleteAccount.title")}</AccountItemTitle>
          <AccountItemDescription>{t("deleteAccount.description")}</AccountItemDescription>
        </AccountItemContentHeader>
      </AccountItemContent>

      <AccountItemFooter className="sm:justify-end">
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button type="button" variant="destructive" size="lg">
                {t("deleteAccount.trigger")}
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20">
                <Trash2Icon aria-hidden="true" className="size-5" />
              </AlertDialogMedia>
              <AlertDialogTitle>{t("deleteAccount.dialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteAccount.dialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel size="lg" disabled={isDeletingAccount}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                type="button"
                size="lg"
                variant="destructive"
                disabled={isDeletingAccount}
                onClick={handleDeleteAccountConfirm}
              >
                {isDeletingAccount ? (
                  <Spinner />
                ) : (
                  <Trash2Icon aria-hidden="true" className="size-4" />
                )}
                {isDeletingAccount
                  ? t("deleteAccount.dialog.confirmPending")
                  : t("deleteAccount.dialog.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AccountItemFooter>
    </AccountItem>
  );
}

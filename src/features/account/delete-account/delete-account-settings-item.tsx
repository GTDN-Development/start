"use client";

import { useId, useState } from "react";
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
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { Trash2Icon } from "lucide-react";

export function AccountDeleteAccountSettingsItem() {
  const t = useTranslations("pages.account");
  const tPasswordVisibility = useTranslations("forms.login.passwordVisibility");
  const router = useRouter();
  const deleteAccountToastId = useId();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeletionAcknowledged, setIsDeletionAcknowledged] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);
  const [acknowledgementErrorMessage, setAcknowledgementErrorMessage] = useState<string | null>(
    null
  );

  async function handleDeleteAccountConfirm() {
    if (isDeletingAccount) {
      return;
    }

    if (!validateDeleteAccountForm()) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      toast.success(t("common.successTitle"), {
        id: deleteAccountToastId,
        description: t("deleteAccount.status.success"),
      });

      setIsDeleteDialogOpen(false);
      resetDeleteAccountForm();
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

  function validateDeleteAccountForm() {
    let nextPasswordError: string | null = null;
    let nextAcknowledgementError: string | null = null;

    if (!password.trim()) {
      nextPasswordError = t("deleteAccount.dialog.fields.password.errors.required");
    }

    if (!isDeletionAcknowledged) {
      nextAcknowledgementError = t("deleteAccount.dialog.fields.acknowledgement.errors.required");
    }

    setPasswordErrorMessage(nextPasswordError);
    setAcknowledgementErrorMessage(nextAcknowledgementError);

    return !nextPasswordError && !nextAcknowledgementError;
  }

  function resetDeleteAccountForm() {
    setPassword("");
    setIsDeletionAcknowledged(false);
    setPasswordErrorMessage(null);
    setAcknowledgementErrorMessage(null);
  }

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);

    if (open) {
      resetDeleteAccountForm();
    }
  }

  function handlePasswordChange(nextValue: string) {
    setPassword(nextValue);

    if (passwordErrorMessage) {
      setPasswordErrorMessage(null);
    }
  }

  function handleDeletionAcknowledgementChange(nextValue: boolean) {
    setIsDeletionAcknowledged(nextValue);

    if (acknowledgementErrorMessage) {
      setAcknowledgementErrorMessage(null);
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
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button type="button" variant="destructive" size="lg">
                {t("deleteAccount.trigger")}
              </Button>
            }
          />
          <AlertDialogContent className="sm:max-w-lg">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleDeleteAccountConfirm();
              }}
              className="contents"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>{t("deleteAccount.dialog.title")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("deleteAccount.dialog.description")}
                </AlertDialogDescription>
              </AlertDialogHeader>

              <FieldGroup className="mt-4 flex flex-col gap-6 pb-2">
                <Field data-invalid={!!passwordErrorMessage}>
                  <FieldLabel htmlFor="account-delete-password">
                    {t("deleteAccount.dialog.fields.password.label")}
                  </FieldLabel>
                  <PasswordInput
                    id="account-delete-password"
                    name="account-delete-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    aria-invalid={!!passwordErrorMessage}
                    placeholder={t("deleteAccount.dialog.fields.password.placeholder")}
                    showPasswordLabel={tPasswordVisibility("show")}
                    hidePasswordLabel={tPasswordVisibility("hide")}
                  />
                  {passwordErrorMessage && <FieldError>{passwordErrorMessage}</FieldError>}
                </Field>

                <div className="flex flex-col gap-2">
                  <Field orientation="horizontal" data-invalid={!!acknowledgementErrorMessage}>
                    <Checkbox
                      id="account-delete-acknowledgement"
                      name="account-delete-acknowledgement"
                      checked={isDeletionAcknowledged}
                      onCheckedChange={(checked) =>
                        handleDeletionAcknowledgementChange(checked === true)
                      }
                      aria-invalid={!!acknowledgementErrorMessage}
                    />
                    <FieldLabel htmlFor="account-delete-acknowledgement">
                      {t("deleteAccount.dialog.fields.acknowledgement.label")}
                    </FieldLabel>
                  </Field>
                  {acknowledgementErrorMessage && (
                    <FieldError>{acknowledgementErrorMessage}</FieldError>
                  )}
                </div>
              </FieldGroup>

              <AlertDialogFooter>
                <AlertDialogCancel type="button" size="lg" disabled={isDeletingAccount}>
                  {t("common.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  size="lg"
                  variant="destructive"
                  disabled={isDeletingAccount}
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
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </AccountItemFooter>
    </AccountItem>
  );
}

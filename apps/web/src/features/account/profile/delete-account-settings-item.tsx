"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { SIGN_IN_PATH } from "@/config/routes";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { createAccountDeleteFormSchema } from "@/features/account/account-schemas";
import { deleteAccountAction } from "@/features/account/security/account-security-actions";
import { emitSignedOut } from "@/features/auth/auth-client-events";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
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
import { runAsyncTransition } from "@/lib/app-utils";
import { Trash2Icon } from "lucide-react";

type DeleteAccountFormValues = {
  password: string;
  isDeletionAcknowledged: boolean;
};

export function AccountDeleteAccountSettingsItem() {
  const t = useTranslations("pages.account");
  const tPasswordVisibility = useTranslations("forms.signIn.passwordVisibility");

  const router = useRouter();
  const deleteAccountToastId = useId();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [passwordServerErrorMessage, setPasswordServerErrorMessage] = useState<string | null>(null);

  const deleteAccountSchema = createAccountDeleteFormSchema({
    passwordRequired: t("deleteAccount.dialog.fields.password.errors.required"),
    acknowledged: t("deleteAccount.dialog.fields.acknowledgement.errors.required"),
  });

  function resetDeleteDialogAndRedirect() {
    startTransition(() => {
      setIsDeleteDialogOpen(false);
      form.reset();
      router.replace(SIGN_IN_PATH);
    });
  }

  function showDeleteAccountError(message: string) {
    toast.error(message, {
      id: deleteAccountToastId,
    });
  }

  const form = useForm({
    defaultValues: {
      password: "",
      isDeletionAcknowledged: false,
    },
    validators: {
      onSubmit: deleteAccountSchema,
    },
    onSubmit: async ({ value }: { value: DeleteAccountFormValues }) => {
      setPasswordServerErrorMessage(null);

      const response = await runAsyncTransition(() =>
        deleteAccountAction({
          password: value.password,
        })
      );

      if (response.ok) {
        emitSignedOut();
        toast.success(t("deleteAccount.status.success"), {
          id: deleteAccountToastId,
        });
        resetDeleteDialogAndRedirect();
        return;
      }

      if (response.errorCode === "INVALID_CREDENTIALS") {
        setPasswordServerErrorMessage(t("deleteAccount.status.invalidCredentials"));
        return;
      }

      if (response.errorCode === "UNAUTHORIZED") {
        showDeleteAccountError(t("deleteAccount.status.unauthorized"));
        resetDeleteDialogAndRedirect();
        return;
      }

      if (response.errorCode === "ACCOUNT_DELETE_BLOCKED_LAST_OWNER") {
        showDeleteAccountError(t("deleteAccount.status.blockedLastOwner"));
        return;
      }

      showDeleteAccountError(t("deleteAccount.status.error"));
    },
  });

  function handleDeleteDialogOpenChange(open: boolean) {
    setIsDeleteDialogOpen(open);

    if (open) {
      form.reset();
      setPasswordServerErrorMessage(null);
    }
  }

  function clearPasswordServerError() {
    if (passwordServerErrorMessage) {
      setPasswordServerErrorMessage(null);
    }
  }

  return (
    <SettingsItem variant="destructive">
      <SettingsItemContent>
        <SettingsItemContentHeader>
          <SettingsItemTitle>{t("deleteAccount.title")}</SettingsItemTitle>
          <SettingsItemDescription>{t("deleteAccount.description")}</SettingsItemDescription>
        </SettingsItemContentHeader>
      </SettingsItemContent>

      <SettingsItemFooter>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
          <AlertDialogTrigger
            nativeButton={true}
            render={
              <Button type="button" variant="destructive" size="lg" className="sm:ml-auto">
                {t("deleteAccount.trigger")}
              </Button>
            }
          />
          <AlertDialogContent className="sm:max-w-lg">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                form.handleSubmit();
              }}
              className="contents"
            >
              <form.Subscribe
                selector={(state) => ({
                  isSubmitting: state.isSubmitting,
                  submissionAttempts: state.submissionAttempts,
                })}
              >
                {({ isSubmitting, submissionAttempts }) => (
                  <>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteAccount.dialog.title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteAccount.dialog.description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <FieldGroup className="mt-4 flex flex-col gap-6 pb-2">
                      <form.Field name="password">
                        {(field) => {
                          const hasFieldError =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;
                          const isInvalid = hasFieldError || Boolean(passwordServerErrorMessage);

                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor={`account-delete-${field.name}`}>
                                {t("deleteAccount.dialog.fields.password.label")}
                              </FieldLabel>
                              <PasswordInput
                                id={`account-delete-${field.name}`}
                                name={`account-delete-${field.name}`}
                                autoComplete="current-password"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => {
                                  clearPasswordServerError();
                                  field.handleChange(event.target.value);
                                }}
                                aria-invalid={isInvalid}
                                placeholder={t("deleteAccount.dialog.fields.password.placeholder")}
                                showPasswordLabel={tPasswordVisibility("show")}
                                hidePasswordLabel={tPasswordVisibility("hide")}
                              />
                              {hasFieldError && <FieldError errors={field.state.meta.errors} />}
                              {!hasFieldError && passwordServerErrorMessage && (
                                <FieldError>{passwordServerErrorMessage}</FieldError>
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>

                      <form.Field name="isDeletionAcknowledged">
                        {(field) => {
                          const isInvalid =
                            (field.state.meta.isTouched || submissionAttempts > 0) &&
                            !field.state.meta.isValid;

                          return (
                            <div className="flex flex-col gap-2">
                              <Field orientation="horizontal" data-invalid={isInvalid}>
                                <Checkbox
                                  id={`account-delete-${field.name}`}
                                  name={`account-delete-${field.name}`}
                                  checked={field.state.value}
                                  onBlur={field.handleBlur}
                                  onCheckedChange={(checked) =>
                                    field.handleChange(checked === true)
                                  }
                                  aria-invalid={isInvalid}
                                />
                                <FieldLabel htmlFor={`account-delete-${field.name}`}>
                                  {t("deleteAccount.dialog.fields.acknowledgement.label")}
                                </FieldLabel>
                              </Field>
                              {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </div>
                          );
                        }}
                      </form.Field>
                    </FieldGroup>

                    <AlertDialogFooter>
                      <AlertDialogCancel type="button" size="lg" disabled={isSubmitting}>
                        {t("common.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="submit"
                        size="lg"
                        variant="destructive"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner />
                        ) : (
                          <Trash2Icon aria-hidden="true" className="size-4" />
                        )}
                        {isSubmitting
                          ? t("deleteAccount.dialog.confirmPending")
                          : t("deleteAccount.dialog.confirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </>
                )}
              </form.Subscribe>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </SettingsItemFooter>
    </SettingsItem>
  );
}

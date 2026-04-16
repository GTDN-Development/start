"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateAccountProfileAction } from "@/features/account/profile/account-profile-actions";
import {
  accountProfileNameMaxLength,
  createAccountProfileNameFormSchema,
} from "@/features/account/account-schemas";
import { useAccountProfile } from "@/features/account/account-profile-context";
import { emitAuthChanged } from "@/features/auth/auth-client-events";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InlineStatus } from "@/features/account/account-types";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { runAsyncTransition } from "@/lib/app-utils";
import { AlertCircleIcon } from "lucide-react";

type ProfileNameFormValues = {
  name: string;
};

export function AccountDisplayNameSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile, setProfile } = useAccountProfile();
  const nameToastId = useId();
  const [nameStatus, setNameStatus] = useState<InlineStatus>(null);
  const profileNameSchema = createAccountProfileNameFormSchema({
    max: t("profile.fields.name.errors.max", {
      max: String(accountProfileNameMaxLength),
    }),
  });

  const form = useForm({
    defaultValues: {
      name: profile.name ?? "",
    },
    validators: {
      onSubmit: profileNameSchema,
    },
    onSubmit: async ({ value }: { value: ProfileNameFormValues }) => {
      setNameStatus(null);

      const response = await runAsyncTransition(() =>
        updateAccountProfileAction({
          name: value.name.trim(),
        })
      );

      if (response.ok) {
        const nextName = response.data.name ?? "";
        startTransition(() => {
          setProfile(response.data);
          form.reset();
          form.setFieldValue("name", nextName);
        });
        emitAuthChanged();
        toast.success(t("profile.status.savedMessage"), {
          id: nameToastId,
        });
        return;
      }

      if (response.errorCode === "UNAUTHORIZED") {
        setNameStatus({
          kind: "error",
          message: t("profile.status.unauthorizedMessage"),
        });
        return;
      }

      if (response.errorCode === "BAD_REQUEST" || response.errorCode === "VALIDATION_ERROR") {
        setNameStatus({
          kind: "error",
          message: t("profile.status.invalidInputMessage"),
        });
        return;
      }

      setNameStatus({
        kind: "error",
        message: t("profile.status.errorMessage"),
      });
    },
  });

  function clearNameStatus() {
    if (nameStatus) {
      setNameStatus(null);
    }
  }

  return (
    <SettingsItem>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Subscribe
          selector={(state) => ({
            isSubmitting: state.isSubmitting,
            submissionAttempts: state.submissionAttempts,
          })}
        >
          {({ isSubmitting, submissionAttempts }) => (
            <>
              <SettingsItemContent className="flex flex-col gap-6">
                <SettingsItemContentHeader>
                  <SettingsItemTitle>{t("profile.title")}</SettingsItemTitle>
                  <SettingsItemDescription>{t("profile.description")}</SettingsItemDescription>
                </SettingsItemContentHeader>

                <SettingsItemContentBody>
                  <div className="grid gap-4">
                    <form.Field name="name">
                      {(field) => {
                        const hasFieldError =
                          (field.state.meta.isTouched || submissionAttempts > 0) &&
                          !field.state.meta.isValid;
                        const isInvalid = hasFieldError || nameStatus?.kind === "error";

                        return (
                          <Field data-invalid={isInvalid} className="grid max-w-md gap-2">
                            <FieldLabel htmlFor={`account-profile-${field.name}`}>
                              {t("profile.fields.name.label")}
                            </FieldLabel>
                            <Input
                              id={`account-profile-${field.name}`}
                              name={`account-profile-${field.name}`}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(event) => {
                                clearNameStatus();
                                field.handleChange(event.target.value);
                              }}
                              placeholder={t("profile.fields.name.placeholder")}
                              autoComplete="name"
                              aria-invalid={isInvalid}
                            />
                            <FieldDescription>
                              {t("profile.fields.name.description")}
                            </FieldDescription>
                            {hasFieldError && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    </form.Field>

                    {nameStatus?.kind === "error" && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircleIcon aria-hidden="true" className="size-4" />
                        <AlertTitle>{t("common.errorTitle")}</AlertTitle>
                        <AlertDescription>{nameStatus.message}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </SettingsItemContentBody>
              </SettingsItemContent>

              <SettingsItemFooter>
                <SettingsItemDescription>{t("profile.footerHint")}</SettingsItemDescription>
                <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-end">
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? t("profile.submit.pending") : t("profile.submit.default")}
                </Button>
              </SettingsItemFooter>
            </>
          )}
        </form.Subscribe>
      </form>
    </SettingsItem>
  );
}

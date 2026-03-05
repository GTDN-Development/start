"use client";

import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAccountProfile } from "@/features/account/account-profile-context";
import { updateAccountProfile } from "@/features/account/account-client";
import {
  AccountItem,
  AccountItemContent,
  AccountItemContentBody,
  AccountItemContentHeader,
  AccountItemDescription,
  AccountItemFooter,
  AccountItemTitle,
} from "@/features/account/account-item";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InlineStatus } from "@/features/account/account-types";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon } from "lucide-react";

const MAX_PROFILE_NAME_LENGTH = 32;
type ProfileNameFormValues = {
  name: string;
};

export function AccountDisplayNameSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile, patchProfile } = useAccountProfile();
  const nameToastId = useId();
  const [nameStatus, setNameStatus] = useState<InlineStatus>(null);
  const profileNameSchema = z.object({
    name: z
      .string()
      .trim()
      .max(MAX_PROFILE_NAME_LENGTH, {
        message: t("profile.fields.name.errors.max", {
          max: String(MAX_PROFILE_NAME_LENGTH),
        }),
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

      const response = await updateAccountProfile({
        name: value.name.trim(),
      });

      if (response.ok) {
        const nextName = response.data.profile.name ?? "";
        patchProfile(response.data.profile);
        form.reset();
        form.setFieldValue("name", nextName);
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
    <AccountItem>
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
              <AccountItemContent className="flex flex-col gap-6">
                <AccountItemContentHeader>
                  <AccountItemTitle>{t("profile.title")}</AccountItemTitle>
                  <AccountItemDescription>{t("profile.description")}</AccountItemDescription>
                </AccountItemContentHeader>

                <AccountItemContentBody>
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
                </AccountItemContentBody>
              </AccountItemContent>

              <AccountItemFooter>
                <AccountItemDescription>{t("profile.footerHint")}</AccountItemDescription>
                <Button type="submit" size="lg" disabled={isSubmitting} className="sm:self-end">
                  {isSubmitting && <Spinner />}
                  {isSubmitting ? t("profile.submit.pending") : t("profile.submit.default")}
                </Button>
              </AccountItemFooter>
            </>
          )}
        </form.Subscribe>
      </form>
    </AccountItem>
  );
}

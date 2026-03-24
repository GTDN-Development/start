"use client";

import { useForm } from "@tanstack/react-form";
import { startTransition, useId, useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { updateSettingsProfileAction } from "@/features/settings/actions/settings-actions";
import { useSettingsProfile } from "@/features/settings/settings-profile-context";
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
import type { InlineStatus } from "@/features/settings/settings-types";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { settingsConfig } from "@/config/settings";
import { runAsyncTransition } from "@/lib/app-utils";
import { AlertCircleIcon } from "lucide-react";

type ProfileNameFormValues = {
  name: string;
};

const MAX_SETTINGS_PROFILE_NAME_LENGTH = settingsConfig.limits.profileNameMaxLength;

export function SettingsDisplayNameSettingsItem() {
  const t = useTranslations("pages.settings");
  const { profile, patchProfile } = useSettingsProfile();
  const nameToastId = useId();
  const [nameStatus, setNameStatus] = useState<InlineStatus>(null);
  const profileNameSchema = z.object({
    name: z
      .string()
      .trim()
      .max(MAX_SETTINGS_PROFILE_NAME_LENGTH, {
        message: t("profile.fields.name.errors.max", {
          max: String(MAX_SETTINGS_PROFILE_NAME_LENGTH),
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

      const response = await runAsyncTransition(() =>
        updateSettingsProfileAction({
          name: value.name.trim(),
        })
      );

      if (response.ok) {
        const nextName = response.data.profile.name ?? "";
        startTransition(() => {
          patchProfile(response.data.profile);
          form.reset();
          form.setFieldValue("name", nextName);
        });
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
                            <FieldLabel htmlFor={`settings-profile-${field.name}`}>
                              {t("profile.fields.name.label")}
                            </FieldLabel>
                            <Input
                              id={`settings-profile-${field.name}`}
                              name={`settings-profile-${field.name}`}
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

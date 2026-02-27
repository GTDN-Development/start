"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useAccountProfile } from "@/features/account/account-profile-context";
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
import {
  readAccountSettingsApiResponse,
  type InlineStatus,
} from "@/features/account/account-response";
import { notifyAuthSync } from "@/features/auth/auth-sync-events";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircleIcon } from "lucide-react";
import { resolveErrorMessage } from "@/lib/utils";

const MAX_PROFILE_NAME_LENGTH = 32;

export function AccountDisplayNameSettingsItem() {
  const t = useTranslations("pages.account");
  const { profile, patchProfile } = useAccountProfile();
  const nameToastId = React.useId();
  const [nameValue, setNameValue] = React.useState(profile.name ?? "");
  const [nameStatus, setNameStatus] = React.useState<InlineStatus>(null);
  const [showNameFieldValidation, setShowNameFieldValidation] = React.useState(false);
  const [isSavingName, setIsSavingName] = React.useState(false);

  const trimmedNameValue = nameValue.trim();
  const isNameTooLong = trimmedNameValue.length > MAX_PROFILE_NAME_LENGTH;
  const nameFieldError =
    showNameFieldValidation && isNameTooLong
      ? t("profile.fields.name.errors.max", {
          max: String(MAX_PROFILE_NAME_LENGTH),
        })
      : null;

  function handleNameInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setNameValue(event.target.value);

    if (nameStatus) {
      setNameStatus(null);
    }
  }

  async function handleNameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowNameFieldValidation(true);

    if (isNameTooLong) {
      setNameStatus(null);
      return;
    }

    setIsSavingName(true);
    setNameStatus(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue,
        }),
      });
      const result = await readAccountSettingsApiResponse(response);

      if (!response.ok || !result?.ok || !result.profile) {
        setNameStatus({
          kind: "error",
          message: resolveErrorMessage(result?.errorCode, t("profile.status.errorMessage"), {
            UNAUTHORIZED: t("profile.status.unauthorizedMessage"),
            INVALID_PROFILE_INPUT: t("profile.status.invalidInputMessage"),
          }),
        });
        return;
      }

      patchProfile(result.profile);
      notifyAuthSync("profile");
      setNameValue(result.profile.name ?? "");
      setNameStatus(null);
      toast.success(t("common.successTitle"), {
        id: nameToastId,
        description: t("profile.status.savedMessage"),
      });
    } catch {
      setNameStatus({
        kind: "error",
        message: t("profile.status.errorMessage"),
      });
    } finally {
      setIsSavingName(false);
    }
  }

  return (
    <AccountItem>
      <form onSubmit={handleNameSubmit}>
        <AccountItemContent className="flex flex-col gap-6">
          <AccountItemContentHeader>
            <AccountItemTitle>{t("profile.title")}</AccountItemTitle>
            <AccountItemDescription>{t("profile.description")}</AccountItemDescription>
          </AccountItemContentHeader>

          <AccountItemContentBody>
            <div className="grid gap-4">
              <Field
                data-invalid={Boolean(nameFieldError) || nameStatus?.kind === "error"}
                className="grid max-w-md gap-2"
              >
                <FieldLabel htmlFor="account-profile-name">
                  {t("profile.fields.name.label")}
                </FieldLabel>
                <Input
                  id="account-profile-name"
                  name="account-profile-name"
                  value={nameValue}
                  onChange={handleNameInputChange}
                  onBlur={() => setShowNameFieldValidation(true)}
                  placeholder={t("profile.fields.name.placeholder")}
                  autoComplete="name"
                  aria-invalid={Boolean(nameFieldError) || nameStatus?.kind === "error"}
                />
                <FieldDescription>{t("profile.fields.name.description")}</FieldDescription>
                {nameFieldError && <FieldError>{nameFieldError}</FieldError>}
              </Field>

              {nameStatus?.kind === "error" ? (
                <Alert variant="destructive" className="py-2">
                  <AlertCircleIcon aria-hidden="true" className="size-4" />
                  <AlertTitle>{t("common.errorTitle")}</AlertTitle>
                  <AlertDescription>{nameStatus.message}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          </AccountItemContentBody>
        </AccountItemContent>

        <AccountItemFooter>
          <AccountItemDescription>{t("profile.footerHint")}</AccountItemDescription>
          <Button type="submit" size="lg" disabled={isSavingName} className="sm:self-end">
            {isSavingName ? <Spinner /> : null}
            {isSavingName ? t("profile.submit.pending") : t("profile.submit.default")}
          </Button>
        </AccountItemFooter>
      </form>
    </AccountItem>
  );
}

"use client";

import { startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemFooter,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import { ORGANIZATION_INVITABLE_ROLE_OPTIONS } from "@/features/organizations/organization-role-options";
import {
  isOrganizationInvitableRole,
  type OrganizationInvitableRole,
} from "@/features/organizations/organization-role-rules";
import { organizationInviteEmailSchema } from "@/features/organizations/organization-schemas";
import type { OrganizationSettingsOrganization } from "@/features/organizations/settings/organization-settings-types";
import type { AppLocale } from "@/i18n/routing";
import { normalizeEmail } from "@/lib/schemas";
import type {
  OrganizationInviteSummary,
  OrganizationResponse,
} from "@/features/organizations/organization-types";

type InviteRole = OrganizationInvitableRole;

const inviteEmailSchema = organizationInviteEmailSchema;

function getInviteRoleOption(value: string | null) {
  return ORGANIZATION_INVITABLE_ROLE_OPTIONS.find((option) => option.value === value);
}

export function OrganizationInviteMembersSettingsItem({
  organization,
  onCreateInviteAction,
}: {
  organization: OrganizationSettingsOrganization;
  onCreateInviteAction: (input: {
    locale: AppLocale;
    email: string;
    role: OrganizationInvitableRole;
  }) => Promise<OrganizationResponse<{ invite: OrganizationInviteSummary }>>;
}) {
  const tInvite = useTranslations("pages.organization.members.invite");
  const tRoles = useTranslations("pages.organization.members.roles");
  const tCommon = useTranslations("pages.organization.common");
  const locale = useLocale() as AppLocale;

  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  const isReadOnly = organization.role === "member";

  function handleRoleChange(nextRole: string | null) {
    if (!nextRole || !isOrganizationInvitableRole(nextRole)) {
      return;
    }

    setSubmitErrorMessage(null);
    setRole(nextRole);
  }

  async function handleInviteSubmit() {
    if (isReadOnly || isInviting) {
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    if (!inviteEmailSchema.safeParse(normalizedEmail).success) {
      setSubmitErrorMessage(tInvite("status.invalidRows"));
      return;
    }

    setIsInviting(true);
    setSubmitErrorMessage(null);

    const response = await onCreateInviteAction({
      locale,
      email: normalizedEmail,
      role,
    });

    setIsInviting(false);

    if (!response.ok) {
      setSubmitErrorMessage(getInviteErrorMessage(response.errorCode, tInvite));
      return;
    }

    startTransition(() => {
      setEmail("");
      setRole("member");
    });
    toast.success(tInvite("status.sent"));
  }

  return (
    <SettingsItem className="@container" disabled={isReadOnly}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleInviteSubmit();
        }}
      >
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <SettingsItemTitle>{tInvite("title")}</SettingsItemTitle>
            <SettingsItemDescription>{tInvite("description")}</SettingsItemDescription>
          </SettingsItemContentHeader>

          <SettingsItemContentBody className="grid gap-4">
            <div className="grid gap-3 @lg:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="organization-members-email">
                  {tInvite("fields.email.label")}
                </FieldLabel>
                <Input
                  id="organization-members-email"
                  name="organization-members-email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setSubmitErrorMessage(null);
                    setEmail(event.target.value);
                  }}
                  autoComplete="email"
                  placeholder={tInvite("fields.email.placeholder")}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="organization-members-role">
                  {tInvite("fields.role.label")}
                </FieldLabel>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="organization-members-role" className="w-full">
                    <SelectValue>
                      {(value) => {
                        const option = getInviteRoleOption(value);

                        if (!option) {
                          return tInvite("fields.role.placeholder");
                        }

                        return tRoles(option.labelKey);
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} className="min-w-[18rem]">
                    <SelectGroup>
                      {ORGANIZATION_INVITABLE_ROLE_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="items-start pr-2 [&>span:first-child]:min-w-0 [&>span:first-child]:shrink [&>span:first-child]:whitespace-normal"
                        >
                          <span className="flex min-w-0 flex-col items-start gap-0.5">
                            <span className="font-medium">{tRoles(option.labelKey)}</span>
                            <span className="text-muted-foreground text-xs wrap-break-word whitespace-normal">
                              {tRoles(option.descriptionKey)}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </SettingsItemContentBody>
        </SettingsItemContent>
        <SettingsItemFooter>
          <SettingsItemDescription className={submitErrorMessage ? "text-destructive" : undefined}>
            {submitErrorMessage ??
              (isReadOnly ? tCommon("readOnlyHint") : tInvite("footer.defaultHint"))}
          </SettingsItemDescription>
          <Button type="submit" size="lg" disabled={isInviting || isReadOnly}>
            {isInviting && <Spinner />}
            {tInvite("actions.invite")}
          </Button>
        </SettingsItemFooter>
      </form>
    </SettingsItem>
  );
}

function getInviteErrorMessage(errorCode: string, tInvite: (key: string) => string): string {
  return errorCode === "BAD_REQUEST"
    ? tInvite("status.alreadyMemberOrInvited")
    : tInvite("status.sendFailed");
}

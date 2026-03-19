"use client";

import { useState } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
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
import {
  WORKSPACE_INVITABLE_ROLE_OPTIONS,
  isWorkspaceInvitableRole,
  type WorkspaceInvitableRole,
} from "@/features/workspaces/settings/members/workspace-member-roles";
import { createInviteAction } from "@/features/workspaces/actions/workspace-actions";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";

type InviteRole = WorkspaceInvitableRole;

const inviteEmailSchema = z.email();

function getInviteRoleOption(value: string | null) {
  return WORKSPACE_INVITABLE_ROLE_OPTIONS.find((option) => option.value === value);
}

export function WorkspaceInviteMembersSettingsItem({
  workspace,
}: {
  workspace: WorkspaceSettingsWorkspace;
}) {
  const tInvite = useTranslations("pages.workspace.members.invite");
  const tRoles = useTranslations("pages.workspace.members.roles");
  const tCommon = useTranslations("pages.workspace.common");
  const router = useRouter();
  const isReadOnly = workspace.kind === "personal" || workspace.role !== "owner";
  const [isInviting, setIsInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("member");
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  function handleRoleChange(nextRole: string | null) {
    if (!nextRole || !isWorkspaceInvitableRole(nextRole)) {
      return;
    }

    setSubmitErrorMessage(null);
    setRole(nextRole);
  }

  async function handleInviteSubmit() {
    if (isReadOnly || isInviting) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!inviteEmailSchema.safeParse(normalizedEmail).success) {
      setSubmitErrorMessage(tInvite("status.invalidRows"));
      return;
    }

    setIsInviting(true);
    setSubmitErrorMessage(null);

    const response = await createInviteAction(workspace.slug, {
      email: normalizedEmail,
      role,
    });

    setIsInviting(false);

    if (!response.ok) {
      setSubmitErrorMessage(getInviteErrorMessage(response.errorCode, tInvite));
      return;
    }

    setEmail("");
    setRole("member");
    toast.success(tCommon("successTitle"), {
      description: tInvite("status.sent"),
    });
    router.refresh();
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
                <FieldLabel htmlFor="workspace-members-email">
                  {tInvite("fields.email.label")}
                </FieldLabel>
                <Input
                  id="workspace-members-email"
                  name="workspace-members-email"
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
                <FieldLabel htmlFor="workspace-members-role">
                  {tInvite("fields.role.label")}
                </FieldLabel>
                <Select value={role} onValueChange={handleRoleChange}>
                  <SelectTrigger id="workspace-members-role" className="w-full">
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
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {WORKSPACE_INVITABLE_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{tRoles(option.labelKey)}</span>
                            <span className="text-muted-foreground text-xs">
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
  if (errorCode === "BAD_REQUEST") {
    return tInvite("status.alreadyMemberOrInvited");
  }

  if (errorCode === "FORBIDDEN") {
    return tInvite("status.sendFailed");
  }

  return tInvite("status.sendFailed");
}

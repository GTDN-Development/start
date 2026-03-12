"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InfoIcon, PlusIcon, TrashIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import {
  WORKSPACE_INVITABLE_ROLE_OPTIONS,
  getWorkspaceMemberRoleLabel,
  isWorkspaceInvitableRole,
  type WorkspaceInvitableRole,
} from "@/features/workspaces/settings/members/workspace-member-roles";
import { createInviteAction } from "@/features/workspaces/actions/workspace-actions";
import type { WorkspaceSettingsWorkspace } from "@/features/workspaces/settings/workspace-settings-types";
import { z } from "zod";
import { useRouter } from "@/i18n/navigation";

type InviteRole = WorkspaceInvitableRole;

type InviteMemberRow = {
  id: string;
  email: string;
  role: InviteRole;
};

type InvitePayloadMember = {
  email: string;
  role: InviteRole;
};

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
  const rowIdPrefix = useId().replaceAll(":", "");
  const nextRowOrderRef = useRef(1);
  const isPersonalWorkspace = workspace.kind === "personal";

  function createInviteMemberRow(order: number = nextRowOrderRef.current): InviteMemberRow {
    if (order === nextRowOrderRef.current) {
      nextRowOrderRef.current += 1;
    }

    return {
      id: `workspace-members-invite-row-${rowIdPrefix}-${order}`,
      email: "",
      role: "member",
    };
  }

  const [isInviting, setIsInviting] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [pendingInvitePayload, setPendingInvitePayload] = useState<InvitePayloadMember[]>([]);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);
  const [inviteRows, setInviteRows] = useState<InviteMemberRow[]>(() => [createInviteMemberRow(0)]);

  function handleAddMore() {
    setSubmitErrorMessage(null);
    setInviteRows((currentRows) => [...currentRows, createInviteMemberRow()]);
  }

  function handleRemoveRow(rowId: string) {
    setSubmitErrorMessage(null);
    setInviteRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
  }

  function handleEmailChange(rowId: string, nextEmail: string) {
    setSubmitErrorMessage(null);
    setInviteRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return {
          ...row,
          email: nextEmail,
        };
      })
    );
  }

  function handleRoleChange(rowId: string, nextRole: string | null) {
    if (!nextRole) {
      return;
    }

    if (!isWorkspaceInvitableRole(nextRole)) {
      return;
    }

    setSubmitErrorMessage(null);
    setInviteRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        return {
          ...row,
          role: nextRole,
        };
      })
    );
  }

  function parseInvitePayload(rows: InviteMemberRow[]): {
    payload: InvitePayloadMember[];
    hasInvalidRows: boolean;
  } {
    const payload: InvitePayloadMember[] = [];
    let hasInvalidRows = false;

    for (const row of rows) {
      const normalizedEmail = row.email.trim();

      if (normalizedEmail.length === 0) {
        hasInvalidRows = true;
        continue;
      }

      if (!inviteEmailSchema.safeParse(normalizedEmail).success) {
        hasInvalidRows = true;
        continue;
      }

      payload.push({
        email: normalizedEmail.toLowerCase(),
        role: row.role,
      });
    }

    return {
      payload,
      hasInvalidRows,
    };
  }

  function handleInviteRequest() {
    const { payload, hasInvalidRows } = parseInvitePayload(inviteRows);

    if (hasInvalidRows) {
      setSubmitErrorMessage(tInvite("status.invalidRows"));
      return;
    }

    setSubmitErrorMessage(null);
    setPendingInvitePayload(payload);
    setIsInviteDialogOpen(true);
  }

  async function handleInviteConfirm() {
    setIsInviting(true);

    for (const invitePayloadMember of pendingInvitePayload) {
      const response = await createInviteAction(workspace.slug, {
        email: invitePayloadMember.email,
        role: invitePayloadMember.role,
      });

      if (!response.ok) {
        setIsInviting(false);
        setIsInviteDialogOpen(false);
        setPendingInvitePayload([]);
        setSubmitErrorMessage(tInvite("status.sendFailed"));
        return;
      }
    }

    setIsInviting(false);
    setIsInviteDialogOpen(false);
    setPendingInvitePayload([]);
    toast.success(tCommon("successTitle"), {
      description: tInvite("status.sent"),
    });
    setInviteRows([createInviteMemberRow()]);
    router.refresh();
  }

  function handleInviteDialogOpenChange(open: boolean) {
    if (isInviting) {
      return;
    }

    setIsInviteDialogOpen(open);
  }

  const pendingInviteCount = pendingInvitePayload.length;

  if (isPersonalWorkspace) {
    return (
      <SettingsItem>
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <StaticPlaceholder />
            <SettingsItemTitle>{tInvite("title")}</SettingsItemTitle>
            <SettingsItemDescription>
              {tInvite("personalWorkspace.description", {
                workspaceName: workspace.name,
              })}
            </SettingsItemDescription>
          </SettingsItemContentHeader>

          <SettingsItemContentBody>
            <SettingsItemDescription>{tInvite("personalWorkspace.hint")}</SettingsItemDescription>
          </SettingsItemContentBody>
        </SettingsItemContent>
      </SettingsItem>
    );
  }

  return (
    <SettingsItem className="@container">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleInviteRequest();
        }}
      >
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <StaticPlaceholder />
            <SettingsItemTitle>{tInvite("title")}</SettingsItemTitle>
            <SettingsItemDescription>{tInvite("description")}</SettingsItemDescription>
          </SettingsItemContentHeader>

          <SettingsItemContentBody className="grid gap-4">
            <div className="divide-y *:py-5 @lg:divide-y-0 @lg:*:py-3">
              {inviteRows.map((row) => {
                return (
                  <div
                    key={row.id}
                    className={"grid gap-3 @lg:grid-cols-[1fr_1fr_auto] @lg:items-start"}
                  >
                    <Field>
                      <FieldLabel htmlFor={`workspace-members-email-${row.id}`}>
                        {tInvite("fields.email.label")}
                      </FieldLabel>
                      <Input
                        id={`workspace-members-email-${row.id}`}
                        name={`workspace-members-email-${row.id}`}
                        type="email"
                        value={row.email}
                        onChange={(event) => handleEmailChange(row.id, event.target.value)}
                        autoComplete="email"
                        placeholder={tInvite("fields.email.placeholder")}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`workspace-members-role-${row.id}`}>
                        {tInvite("fields.role.label")}
                      </FieldLabel>
                      <Select
                        value={row.role}
                        onValueChange={(value) => handleRoleChange(row.id, value)}
                      >
                        <SelectTrigger id={`workspace-members-role-${row.id}`} className="w-full">
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

                    <div className="flex w-full justify-end @lg:self-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        aria-label={tInvite("actions.removeRowAriaLabel")}
                        disabled={!(inviteRows.length > 1)}
                        onClick={() => handleRemoveRow(row.id)}
                      >
                        <TrashIcon aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex w-full items-center justify-center pb-4 @lg:justify-start @lg:pb-0">
              <Button type="button" variant="outline" className="w-fit" onClick={handleAddMore}>
                <PlusIcon aria-hidden="true" /> {tInvite("actions.addMore")}
              </Button>
            </div>
          </SettingsItemContentBody>
        </SettingsItemContent>

        <AlertDialog open={isInviteDialogOpen} onOpenChange={handleInviteDialogOpenChange}>
          <SettingsItemFooter>
            <SettingsItemDescription
              className={submitErrorMessage ? "text-destructive" : undefined}
            >
              {submitErrorMessage ?? tInvite("footer.defaultHint")}
            </SettingsItemDescription>
            <Button type="button" size="lg" disabled={isInviting} onClick={handleInviteRequest}>
              {tInvite("actions.invite")}
            </Button>
          </SettingsItemFooter>

          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>{tInvite("dialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {tInvite("dialog.description", {
                  count: pendingInviteCount,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <ul className="mt-4 grid gap-2">
              {pendingInvitePayload.map((member) => (
                <li
                  key={`${member.email}-${member.role}`}
                  className="bg-muted flex items-center justify-between rounded-md px-3 py-2 text-sm"
                >
                  <span className="font-medium">{member.email}</span>
                  <span className="text-muted-foreground">
                    {getWorkspaceMemberRoleLabel(member.role, tRoles)}
                  </span>
                </li>
              ))}
            </ul>

            <Alert>
              <InfoIcon aria-hidden="true" />
              <AlertTitle>{tInvite("dialog.expiryHint")}</AlertTitle>
            </Alert>

            <AlertDialogFooter>
              <AlertDialogCancel size="lg" disabled={isInviting}>
                {tCommon("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                type="button"
                size="lg"
                disabled={isInviting}
                onClick={handleInviteConfirm}
              >
                {isInviting && <Spinner />}
                {isInviting ? tInvite("dialog.submit.pending") : tInvite("dialog.submit.default")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </SettingsItem>
  );
}

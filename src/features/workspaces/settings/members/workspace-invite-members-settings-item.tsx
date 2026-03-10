"use client";

import { useId, useRef, useState } from "react";
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
  WORKSPACE_MEMBER_ROLE_OPTIONS,
  getWorkspaceMemberRoleLabel,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/settings/members/workspace-member-roles";
import { z } from "zod";

type InviteRole = WorkspaceMemberRole;

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
const INVITE_PRICE_PER_MEMBER = 12;

function getInviteRoleOption(value: string | null) {
  return WORKSPACE_MEMBER_ROLE_OPTIONS.find((option) => option.value === value);
}

export function WorkspaceInviteMembersSettingsItem() {
  const rowIdPrefix = useId().replaceAll(":", "");
  const nextRowOrderRef = useRef(1);

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

    if (!isWorkspaceMemberRole(nextRole)) {
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
      setSubmitErrorMessage("Please complete the fields above.");
      return;
    }

    setSubmitErrorMessage(null);
    setPendingInvitePayload(payload);
    setIsInviteDialogOpen(true);
  }

  async function handleInviteConfirm() {
    setIsInviting(true);

    await Promise.resolve();

    setIsInviting(false);
    setIsInviteDialogOpen(false);
    setPendingInvitePayload([]);
    toast.success("Invitations sent.");
    setInviteRows([createInviteMemberRow()]);
  }

  function handleInviteDialogOpenChange(open: boolean) {
    if (isInviting) {
      return;
    }

    setIsInviteDialogOpen(open);
  }

  const pendingInviteCount = pendingInvitePayload.length;
  const pendingInviteLabel = pendingInviteCount === 1 ? "Member" : "Members";
  const pendingInviteAmount = pendingInviteCount * INVITE_PRICE_PER_MEMBER;

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
            <SettingsItemTitle>Invite members</SettingsItemTitle>
            <SettingsItemDescription>
              Add one or more people and choose their access role.
            </SettingsItemDescription>
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
                      <FieldLabel htmlFor={`workspace-members-email-${row.id}`}>Email</FieldLabel>
                      <Input
                        id={`workspace-members-email-${row.id}`}
                        name={`workspace-members-email-${row.id}`}
                        type="email"
                        value={row.email}
                        onChange={(event) => handleEmailChange(row.id, event.target.value)}
                        autoComplete="email"
                        placeholder="name@company.com"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`workspace-members-role-${row.id}`}>Role</FieldLabel>
                      <Select
                        value={row.role}
                        onValueChange={(value) => handleRoleChange(row.id, value)}
                      >
                        <SelectTrigger id={`workspace-members-role-${row.id}`} className="w-full">
                          <SelectValue>
                            {(value) => {
                              const option = getInviteRoleOption(value);

                              if (!option) {
                                return "Select role";
                              }

                              return option.label;
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectGroup>
                            {WORKSPACE_MEMBER_ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <span className="flex flex-col items-start gap-0.5">
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {option.description}
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
                        aria-label="Remove invitation row"
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
                <PlusIcon aria-hidden="true" /> Add more
              </Button>
            </div>
          </SettingsItemContentBody>
        </SettingsItemContent>

        <AlertDialog open={isInviteDialogOpen} onOpenChange={handleInviteDialogOpenChange}>
          <SettingsItemFooter>
            <SettingsItemDescription
              className={submitErrorMessage ? "text-destructive" : undefined}
            >
              {submitErrorMessage ??
                "All rows are submitted together when backend integration is connected."}
            </SettingsItemDescription>
            <Button type="button" size="lg" disabled={isInviting} onClick={handleInviteRequest}>
              Invite
            </Button>
          </SettingsItemFooter>

          <AlertDialogContent className="sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Invite Team Members</AlertDialogTitle>
              <AlertDialogDescription>
                Your team is expanding! By confirming, you will be inviting {pendingInviteCount} new{" "}
                Team {pendingInviteLabel}. Your bill will increase by ${pendingInviteAmount}.
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
                    {getWorkspaceMemberRoleLabel(member.role)}
                  </span>
                </li>
              ))}
            </ul>

            <Alert>
              <InfoIcon aria-hidden="true" />
              <AlertTitle>Invite will expire after 1 week</AlertTitle>
            </Alert>

            <AlertDialogFooter>
              <AlertDialogCancel size="lg" disabled={isInviting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                type="button"
                size="lg"
                disabled={isInviting}
                onClick={handleInviteConfirm}
              >
                {isInviting && <Spinner />}
                {isInviting ? "Inviting..." : "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </SettingsItem>
  );
}

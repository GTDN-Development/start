"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { z } from "zod";

const INVITE_ROLE_VALUES = ["owner", "member"] as const;

type InviteRole = (typeof INVITE_ROLE_VALUES)[number];

type InviteMemberRow = {
  id: string;
  email: string;
  role: InviteRole;
};

type InviteMemberRowErrors = Record<string, { email?: string }>;

type InvitePayloadMember = {
  email: string;
  role: InviteRole;
};

const INVITE_ROLE_OPTIONS: Array<{
  value: InviteRole;
  label: string;
  description: string;
}> = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access to workspace settings, members, and management.",
  },
  {
    value: "member",
    label: "Member",
    description: "Can collaborate in workspace, but cannot manage ownership.",
  },
];

const inviteEmailSchema = z.email();
let inviteMemberRowCounter = 0;

function isInviteRole(value: string): value is InviteRole {
  return INVITE_ROLE_VALUES.includes(value as InviteRole);
}

function getInviteRoleOption(value: string | null) {
  return INVITE_ROLE_OPTIONS.find((option) => option.value === value);
}

function createInviteMemberRow(): InviteMemberRow {
  inviteMemberRowCounter += 1;

  return {
    id: `workspace-members-invite-row-${inviteMemberRowCounter}`,
    email: "",
    role: "member",
  };
}

export function WorkspaceInviteMembersSettingsItem() {
  const inviteToastId = useId();

  const [isInviting, setIsInviting] = useState(false);
  const [rowErrors, setRowErrors] = useState<InviteMemberRowErrors>({});
  const [inviteRows, setInviteRows] = useState<InviteMemberRow[]>(() => [createInviteMemberRow()]);

  function clearRowError(rowId: string) {
    setRowErrors((currentErrors) => {
      if (!currentErrors[rowId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[rowId];

      return nextErrors;
    });
  }

  function handleAddMore() {
    setInviteRows((currentRows) => [...currentRows, createInviteMemberRow()]);
  }

  function handleRemoveRow(rowId: string) {
    setInviteRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
    clearRowError(rowId);
  }

  function handleEmailChange(rowId: string, nextEmail: string) {
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
    clearRowError(rowId);
  }

  function handleRoleChange(rowId: string, nextRole: string | null) {
    if (!nextRole) {
      return;
    }

    if (!isInviteRole(nextRole)) {
      return;
    }

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
    errors: InviteMemberRowErrors;
  } {
    const payload: InvitePayloadMember[] = [];
    const errors: InviteMemberRowErrors = {};

    for (const row of rows) {
      const normalizedEmail = row.email.trim();

      if (normalizedEmail.length === 0) {
        errors[row.id] = {
          email: "Email is required.",
        };
        continue;
      }

      if (!inviteEmailSchema.safeParse(normalizedEmail).success) {
        errors[row.id] = {
          email: "Enter a valid email address.",
        };
        continue;
      }

      payload.push({
        email: normalizedEmail.toLowerCase(),
        role: row.role,
      });
    }

    return {
      payload,
      errors,
    };
  }

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { payload, errors } = parseInvitePayload(inviteRows);
    const hasErrors = Object.keys(errors).length > 0;

    setRowErrors(errors);

    if (hasErrors) {
      return;
    }

    setIsInviting(true);

    await Promise.resolve();

    const inviteCount = payload.length;
    const inviteLabel = inviteCount === 1 ? "invitation" : "invitations";

    toast.success("Invitations prepared", {
      id: inviteToastId,
      description: `${inviteCount} ${inviteLabel} ready for backend integration.`,
    });

    setIsInviting(false);
    setRowErrors({});
    setInviteRows([createInviteMemberRow()]);
  }

  return (
    <SettingsItem className="@container">
      <form onSubmit={handleInviteSubmit}>
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
                const emailError = rowErrors[row.id]?.email;
                const isEmailInvalid = Boolean(emailError);

                return (
                  <div
                    key={row.id}
                    className={"grid gap-3 @lg:grid-cols-[1fr_1fr_auto] @lg:items-end"}
                  >
                    <Field data-invalid={isEmailInvalid}>
                      <FieldLabel htmlFor={`workspace-members-email-${row.id}`}>Email</FieldLabel>
                      <Input
                        id={`workspace-members-email-${row.id}`}
                        name={`workspace-members-email-${row.id}`}
                        type="email"
                        value={row.email}
                        onChange={(event) => handleEmailChange(row.id, event.target.value)}
                        autoComplete="email"
                        placeholder="name@company.com"
                        aria-invalid={isEmailInvalid}
                      />
                      {isEmailInvalid && <FieldError>{emailError}</FieldError>}
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
                            {INVITE_ROLE_OPTIONS.map((option) => (
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

                    <div className="flex w-full justify-end">
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

        <SettingsItemFooter>
          <SettingsItemDescription>
            All rows are submitted together when backend integration is connected.
          </SettingsItemDescription>
          <Button type="submit" size="lg" disabled={isInviting}>
            {isInviting && <Spinner />}
            {isInviting ? "Inviting..." : "Invite"}
          </Button>
        </SettingsItemFooter>
      </form>
    </SettingsItem>
  );
}

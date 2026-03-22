"use client";

import { startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { InboxIcon, MoreHorizontalIcon, PencilLineIcon, SendIcon, TrashIcon } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Spinner } from "@/components/ui/spinner";
import {
  WORKSPACE_MEMBER_ROLE_OPTIONS,
  getWorkspaceMemberRoleLabel,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/settings/members/workspace-member-roles";
import {
  changeMemberRoleAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
  transferOwnershipAction,
} from "@/features/workspaces/actions/workspace-actions";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";
import { getUserInitials } from "@/lib/app-utils";
import { runAsyncTransition } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppLocale } from "@/i18n/routing";

type ManagementActionState =
  | {
      type: "change-role";
      memberId: string;
      selectedRole: WorkspaceMemberRole;
    }
  | {
      type: "remove-member";
      memberId: string;
    }
  | {
      type: "resend-invitation";
      invitationId: string;
    }
  | {
      type: "remove-invitation";
      invitationId: string;
    }
  | null;

export function WorkspaceMembersManagementSettingsItem({
  workspace,
  members,
  invites,
  onInviteRemoved,
  onInviteResent,
  onMemberRemoved,
  onMemberRoleChanged,
  onOwnershipTransferred,
}: {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
  invites: WorkspaceSettingsInvite[];
  onInviteRemoved: (inviteId: string) => void;
  onInviteResent: (
    inviteId: string,
    patch: Pick<WorkspaceSettingsInvite, "expiresAt" | "updatedAt">
  ) => void;
  onMemberRemoved: (memberId: string) => void;
  onMemberRoleChanged: (memberId: string, role: WorkspaceSettingsMember["role"]) => void;
  onOwnershipTransferred: (previousOwnerMemberId: string, nextOwnerMemberId: string) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");
  const tCommon = useTranslations("pages.workspace.common");
  const locale = useLocale() as AppLocale;
  const isReadOnly = workspace.role === "member";
  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const hasPendingInvitations = invites.length > 0;
  const roleOptions = getAssignableWorkspaceMemberRoleOptions(workspace.role);
  const changeRoleMember =
    actionState?.type === "change-role"
      ? (members.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const removeMemberTarget =
    actionState?.type === "remove-member"
      ? (members.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const resendInvitationTarget =
    actionState?.type === "resend-invitation"
      ? (invites.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const removeInvitationTarget =
    actionState?.type === "remove-invitation"
      ? (invites.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const isChangeRoleTargetLastOwner = changeRoleMember
    ? isLastOwnerMember(changeRoleMember, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner = removeMemberTarget
    ? isLastOwnerMember(removeMemberTarget, ownerCount)
    : false;

  function handleChangeRoleRequest(member: WorkspaceSettingsMember) {
    if (isReadOnly || !canManageWorkspaceMember(workspace.role, member.role)) {
      return;
    }

    setActionState({
      type: "change-role",
      memberId: member.id,
      selectedRole: member.role,
    });
  }

  function handleRemoveMemberRequest(member: WorkspaceSettingsMember) {
    if (isReadOnly || !canManageWorkspaceMember(workspace.role, member.role)) {
      return;
    }

    if (isLastOwnerMember(member, ownerCount)) {
      return;
    }

    setActionState({
      type: "remove-member",
      memberId: member.id,
    });
  }

  function handleResendInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isReadOnly) {
      return;
    }

    setActionState({
      type: "resend-invitation",
      invitationId: invitation.id,
    });
  }

  function handleRemoveInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isReadOnly) {
      return;
    }

    setActionState({
      type: "remove-invitation",
      invitationId: invitation.id,
    });
  }

  function handleActionDialogOpenChange(open: boolean) {
    if (isActionSubmitting) {
      return;
    }

    if (!open) {
      setActionState(null);
    }
  }

  function handleChangeRoleSelection(value: string) {
    if (!isWorkspaceMemberRole(value)) {
      return;
    }

    if (!canAssignWorkspaceMemberRole(workspace.role, value)) {
      return;
    }

    if (isChangeRoleTargetLastOwner && value !== "owner") {
      return;
    }

    setActionState((currentState) => {
      if (!currentState || currentState.type !== "change-role") {
        return currentState;
      }

      return {
        ...currentState,
        selectedRole: value,
      };
    });
  }

  async function handleChangeRoleConfirm() {
    if (isReadOnly) {
      return;
    }

    if (!changeRoleMember || actionState?.type !== "change-role") {
      return;
    }

    if (isChangeRoleTargetLastOwner && actionState.selectedRole !== "owner") {
      toast.error(t("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const nextRole = actionState.selectedRole;

    if (!canChangeWorkspaceMemberRole(workspace.role, changeRoleMember.role, nextRole)) {
      setIsActionSubmitting(false);
      toast.error(t("errors.forbidden"));
      return;
    }

    if (nextRole === "owner" && changeRoleMember.role !== "owner") {
      const actionResponse = await runAsyncTransition(() =>
        transferOwnershipAction(workspace.slug, changeRoleMember.id)
      );

      if (!actionResponse.ok) {
        setIsActionSubmitting(false);
        toast.error(
          getActionErrorMessage(actionResponse.errorCode, t("status.roleChange.error"), t)
        );
        return;
      }

      startTransition(() => {
        setIsActionSubmitting(false);
        setActionState(null);
        onOwnershipTransferred(
          actionResponse.data.previousOwnerMemberId,
          actionResponse.data.nextOwnerMemberId
        );
      });
      toast.success(t("status.roleChange.success"));
      return;
    }

    const actionResponse = await runAsyncTransition(() =>
      changeMemberRoleAction(workspace.slug, changeRoleMember.id, nextRole)
    );

    if (!actionResponse.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(actionResponse.errorCode, t("status.roleChange.error"), t));
      return;
    }

    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      onMemberRoleChanged(actionResponse.data.memberId, actionResponse.data.role);
    });
    toast.success(t("status.roleChange.success"));
  }

  async function handleRemoveMemberConfirm() {
    if (isReadOnly) {
      return;
    }

    if (!removeMemberTarget) {
      return;
    }

    if (isRemoveMemberTargetLastOwner) {
      toast.error(t("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const response = await runAsyncTransition(() =>
      removeMemberAction(workspace.slug, removeMemberTarget.id)
    );

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, t("status.memberRemove.error"), t));
      return;
    }

    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      onMemberRemoved(response.data.memberId);
    });
    toast.success(t("status.memberRemove.success"));
  }

  async function handleResendInvitationConfirm() {
    if (isReadOnly) {
      return;
    }

    if (!resendInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await runAsyncTransition(() =>
      resendInviteAction(workspace.slug, resendInvitationTarget.id, locale)
    );

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, t("status.inviteResend.error"), t));
      return;
    }

    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      onInviteResent(response.data.inviteId, {
        expiresAt: response.data.expiresAt,
        updatedAt: response.data.updatedAt,
      });
    });
    toast.success(t("status.inviteResend.success"));
  }

  async function handleRemoveInvitationConfirm() {
    if (isReadOnly) {
      return;
    }

    if (!removeInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await runAsyncTransition(() =>
      revokeInviteAction(workspace.slug, removeInvitationTarget.id)
    );

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, t("status.inviteRemove.error"), t));
      return;
    }

    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      onInviteRemoved(response.data.inviteId);
    });
    toast.success(t("status.inviteRemove.success"));
  }

  return (
    <div className="pt-6">
      <SettingsItem disabled={isReadOnly}>
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <SettingsItemTitle>{t("title")}</SettingsItemTitle>
            <SettingsItemDescription>{t("description")}</SettingsItemDescription>
            {isReadOnly && (
              <SettingsItemDescription>{tCommon("readOnlyHint")}</SettingsItemDescription>
            )}
          </SettingsItemContentHeader>

          <SettingsItemContentBody className="@container/members-management grid gap-4">
            <Tabs defaultValue="members" className="flex-col gap-4">
              <TabsList>
                <TabsTrigger value="members">{t("tabs.members")}</TabsTrigger>
                <TabsTrigger value="pending-invitations">
                  {t("tabs.pendingInvitations")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="grid gap-4">
                <div className="hidden @lg/members-management:block">
                  <MembersTable
                    rows={members}
                    actorRole={workspace.role}
                    ownerCount={ownerCount}
                    isReadOnly={isReadOnly}
                    onChangeRoleRequest={handleChangeRoleRequest}
                    onRemoveMemberRequest={handleRemoveMemberRequest}
                  />
                </div>
                <div className="grid gap-3 @lg/members-management:hidden">
                  {members.map((member) => (
                    <MemberDescriptionRow
                      key={member.id}
                      member={member}
                      actorRole={workspace.role}
                      ownerCount={ownerCount}
                      isReadOnly={isReadOnly}
                      onChangeRoleRequest={handleChangeRoleRequest}
                      onRemoveMemberRequest={handleRemoveMemberRequest}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="pending-invitations" className="grid gap-4">
                {hasPendingInvitations ? (
                  <>
                    <div className="hidden @lg/members-management:block">
                      <PendingInvitationsTable
                        rows={invites}
                        isReadOnly={isReadOnly}
                        onResendInvitationRequest={handleResendInvitationRequest}
                        onRemoveInvitationRequest={handleRemoveInvitationRequest}
                      />
                    </div>
                    <div className="grid gap-3 @lg/members-management:hidden">
                      {invites.map((invitation) => (
                        <PendingInvitationDescriptionRow
                          key={invitation.id}
                          invitation={invitation}
                          isReadOnly={isReadOnly}
                          onResendInvitationRequest={handleResendInvitationRequest}
                          onRemoveInvitationRequest={handleRemoveInvitationRequest}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <PendingInvitationsEmptyState />
                )}
              </TabsContent>
            </Tabs>
          </SettingsItemContentBody>
        </SettingsItemContent>
      </SettingsItem>

      <AlertDialog open={Boolean(changeRoleMember)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.changeRole.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.changeRole.description", {
                memberName: changeRoleMember?.name ?? t("dialogs.common.thisMember"),
                workspaceName: workspace.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {changeRoleMember && (
            <RadioGroup
              value={actionState?.type === "change-role" ? actionState.selectedRole : undefined}
              onValueChange={handleChangeRoleSelection}
            >
              {roleOptions.map((option) => (
                <FieldLabel
                  key={option.value}
                  htmlFor={`workspace-member-role-${changeRoleMember.id}-${option.value}`}
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{tRoles(option.labelKey)}</FieldTitle>
                      <FieldDescription>{tRoles(option.descriptionKey)}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      id={`workspace-member-role-${changeRoleMember.id}-${option.value}`}
                      value={option.value}
                      disabled={
                        isActionSubmitting ||
                        (isChangeRoleTargetLastOwner && option.value !== "owner")
                      }
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          )}

          {isChangeRoleTargetLastOwner && (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              disabled={
                isActionSubmitting ||
                !changeRoleMember ||
                (isChangeRoleTargetLastOwner &&
                  actionState?.type === "change-role" &&
                  actionState.selectedRole !== "owner")
              }
              onClick={handleChangeRoleConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting
                ? t("dialogs.changeRole.submit.pending")
                : t("dialogs.changeRole.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeMemberTarget)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeMember.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeMember.description", {
                workspaceName: workspace.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeMemberTarget && <MemberSummaryRow member={removeMemberTarget} />}

          {isRemoveMemberTargetLastOwner && (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeMemberTarget || isRemoveMemberTargetLastOwner}
              onClick={handleRemoveMemberConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting
                ? t("dialogs.removeMember.submit.pending")
                : t("dialogs.removeMember.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(resendInvitationTarget)}
        onOpenChange={handleActionDialogOpenChange}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.resendInvite.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.resendInvite.description", {
                workspaceName: workspace.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {resendInvitationTarget && <InvitationSummaryRow invitation={resendInvitationTarget} />}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              disabled={isActionSubmitting || !resendInvitationTarget}
              onClick={handleResendInvitationConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting
                ? t("dialogs.resendInvite.submit.pending")
                : t("dialogs.resendInvite.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(removeInvitationTarget)}
        onOpenChange={handleActionDialogOpenChange}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeInvite.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeInvite.description", {
                workspaceName: workspace.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeInvitationTarget && <InvitationSummaryRow invitation={removeInvitationTarget} />}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeInvitationTarget}
              onClick={handleRemoveInvitationConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting
                ? t("dialogs.removeInvite.submit.pending")
                : t("dialogs.removeInvite.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function isLastOwnerMember(member: WorkspaceSettingsMember, ownerCount: number): boolean {
  return member.role === "owner" && ownerCount === 1;
}

function getActionErrorMessage(
  errorCode: string,
  fallbackMessage: string,
  t: (key: string) => string
): string {
  if (errorCode === "LAST_OWNER_GUARD") {
    return t("errors.lastOwnerGuard");
  }

  if (errorCode === "RATE_LIMITED") {
    return t("errors.rateLimited");
  }

  if (errorCode === "FORBIDDEN") {
    return t("errors.forbidden");
  }

  if (errorCode === "NOT_FOUND") {
    return t("errors.notFound");
  }

  return fallbackMessage;
}

function MembersTable({
  rows,
  actorRole,
  ownerCount,
  isReadOnly,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  rows: WorkspaceSettingsMember[];
  actorRole: WorkspaceSettingsWorkspace["role"];
  ownerCount: number;
  isReadOnly: boolean;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.members.user")}</TableHead>
          <TableHead>{t("table.members.role")}</TableHead>
          <TableHead className="text-right">{t("table.members.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="min-w-72">
              <MemberIdentityCell member={member} />
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(member.role, tRoles)}</TableCell>
            <TableCell className="text-right">
              <MembersActionMenu
                member={member}
                disabled={isReadOnly}
                isChangeRoleDisabled={!canManageWorkspaceMember(actorRole, member.role)}
                isRemoveDisabled={
                  !canManageWorkspaceMember(actorRole, member.role) ||
                  isLastOwnerMember(member, ownerCount)
                }
                onChangeRoleRequest={onChangeRoleRequest}
                onRemoveMemberRequest={onRemoveMemberRequest}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PendingInvitationsTable({
  rows,
  isReadOnly,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  rows: WorkspaceSettingsInvite[];
  isReadOnly: boolean;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.invites.email")}</TableHead>
          <TableHead>{t("table.invites.role")}</TableHead>
          <TableHead className="text-right">{t("table.invites.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="min-w-72">
              <p className="text-sm font-medium">{invitation.emailNormalized}</p>
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(invitation.role, tRoles)}</TableCell>
            <TableCell className="text-right">
              <PendingInvitationActionMenu
                invitation={invitation}
                disabled={isReadOnly}
                onResendInvitationRequest={onResendInvitationRequest}
                onRemoveInvitationRequest={onRemoveInvitationRequest}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MemberDescriptionRow({
  member,
  actorRole,
  ownerCount,
  isReadOnly,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  actorRole: WorkspaceSettingsWorkspace["role"];
  ownerCount: number;
  isReadOnly: boolean;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>{t("table.members.user")}</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell member={member} />
        </DescriptionDetails>

        <DescriptionTerm>{t("table.members.role")}</DescriptionTerm>
        <DescriptionDetails>{getWorkspaceMemberRoleLabel(member.role, tRoles)}</DescriptionDetails>

        <DescriptionTerm>{t("table.members.actions")}</DescriptionTerm>
        <DescriptionDetails>
          <MembersActionMenu
            member={member}
            disabled={isReadOnly}
            isChangeRoleDisabled={!canManageWorkspaceMember(actorRole, member.role)}
            isRemoveDisabled={
              !canManageWorkspaceMember(actorRole, member.role) ||
              isLastOwnerMember(member, ownerCount)
            }
            onChangeRoleRequest={onChangeRoleRequest}
            onRemoveMemberRequest={onRemoveMemberRequest}
          />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function PendingInvitationDescriptionRow({
  invitation,
  isReadOnly,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  isReadOnly: boolean;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>{t("table.invites.email")}</DescriptionTerm>
        <DescriptionDetails>
          <span className="text-sm font-medium">{invitation.emailNormalized}</span>
        </DescriptionDetails>

        <DescriptionTerm>{t("table.invites.role")}</DescriptionTerm>
        <DescriptionDetails>
          {getWorkspaceMemberRoleLabel(invitation.role, tRoles)}
        </DescriptionDetails>

        <DescriptionTerm>{t("table.invites.actions")}</DescriptionTerm>
        <DescriptionDetails>
          <PendingInvitationActionMenu
            invitation={invitation}
            disabled={isReadOnly}
            onResendInvitationRequest={onResendInvitationRequest}
            onRemoveInvitationRequest={onRemoveInvitationRequest}
          />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function MemberIdentityCell({ member }: { member: WorkspaceSettingsMember }) {
  const displayName = member.name ?? member.email;
  const initials = getUserInitials(displayName);

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
      </div>
    </div>
  );
}

function MemberSummaryRow({ member }: { member: WorkspaceSettingsMember }) {
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <MemberIdentityCell member={member} />
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(member.role, tRoles)}
      </span>
    </div>
  );
}

function InvitationSummaryRow({ invitation }: { invitation: WorkspaceSettingsInvite }) {
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm font-medium">{invitation.emailNormalized}</span>
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(invitation.role, tRoles)}
      </span>
    </div>
  );
}

function MembersActionMenu({
  member,
  disabled,
  isChangeRoleDisabled,
  isRemoveDisabled,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  disabled: boolean;
  isChangeRoleDisabled: boolean;
  isRemoveDisabled: boolean;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("menus.members.ariaLabel")}
            disabled={disabled || (isChangeRoleDisabled && isRemoveDisabled)}
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem
          onClick={() => onChangeRoleRequest(member)}
          disabled={disabled || isChangeRoleDisabled}
        >
          <PencilLineIcon aria-hidden="true" /> {t("menus.members.changeRole")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveMemberRequest(member)}
          variant="destructive"
          disabled={disabled || isRemoveDisabled}
        >
          <TrashIcon aria-hidden="true" /> {t("menus.members.removeMember")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitationActionMenu({
  invitation,
  disabled,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  disabled: boolean;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("menus.invites.ariaLabel")}
            disabled={disabled}
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem onClick={() => onResendInvitationRequest(invitation)} disabled={disabled}>
          <SendIcon aria-hidden="true" /> {t("menus.invites.resend")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveInvitationRequest(invitation)}
          variant="destructive"
          disabled={disabled}
        >
          <TrashIcon aria-hidden="true" /> {t("menus.invites.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitationsEmptyState() {
  const t = useTranslations("pages.workspace.members.management.empty");

  return (
    <Empty className="bg-background border-border rounded-xl border py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function canManageWorkspaceMember(
  actingRole: WorkspaceSettingsWorkspace["role"],
  targetRole: WorkspaceSettingsMember["role"]
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return targetRole !== "owner";
  }

  return false;
}

function canAssignWorkspaceMemberRole(
  actingRole: WorkspaceSettingsWorkspace["role"],
  nextRole: WorkspaceMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return nextRole !== "owner";
  }

  return false;
}

function canChangeWorkspaceMemberRole(
  actingRole: WorkspaceSettingsWorkspace["role"],
  targetRole: WorkspaceSettingsMember["role"],
  nextRole: WorkspaceMemberRole
): boolean {
  if (!canManageWorkspaceMember(actingRole, targetRole)) {
    return false;
  }

  if (!canAssignWorkspaceMemberRole(actingRole, nextRole)) {
    return false;
  }

  if (nextRole === "owner") {
    return actingRole === "owner";
  }

  return true;
}

function getAssignableWorkspaceMemberRoleOptions(actingRole: WorkspaceSettingsWorkspace["role"]) {
  return WORKSPACE_MEMBER_ROLE_OPTIONS.filter((option) =>
    canAssignWorkspaceMemberRole(actingRole, option.value)
  );
}

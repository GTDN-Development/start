"use client";

import { startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { APP_HOME_PATH } from "@/config/routes";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { leaveWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import {
  changeMemberRoleAction,
  refreshInviteLinkAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/features/workspaces/settings/members/workspace-members-actions";
import {
  canAssignWorkspaceMemberRole,
  canChangeWorkspaceMemberRole,
  canManageWorkspaceMemberRole,
  isLastWorkspaceOwner,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";
import { getAssignableWorkspaceMemberRoleOptions } from "@/features/workspaces/workspace-role-options";
import {
  WorkspaceInvitationsTable,
  WorkspacePendingInvitationsEmptyState,
} from "@/features/workspaces/settings/members/workspace-invitations-table";
import { WorkspaceMembersManagementDialogs } from "@/features/workspaces/settings/members/workspace-members-management-dialogs";
import { WorkspaceMembersTable } from "@/features/workspaces/settings/members/workspace-members-table";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";
import type { AppLocale } from "@/i18n/routing";
import { useRouter } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";

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
      type: "leave-workspace";
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
  onInviteRemovedAction,
  onInviteResentAction,
  onMemberRemovedAction,
  onMemberRoleChangedAction,
}: {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
  invites: WorkspaceSettingsInvite[];
  onInviteRemovedAction: (inviteId: string) => void;
  onInviteResentAction: (
    inviteId: string,
    patch: Pick<WorkspaceSettingsInvite, "expiresAt" | "updatedAt" | "inviteUrl">
  ) => void;
  onMemberRemovedAction: (memberId: string) => void;
  onMemberRoleChangedAction: (memberId: string, role: WorkspaceSettingsMember["role"]) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tLeave = useTranslations("pages.workspace.general.leave");
  const locale = useLocale() as AppLocale;
  const router = useRouter();

  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const isInviteManagementReadOnly = workspace.role === "member";
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember =
    members.find((member) => member.userId === workspace.currentUserId) ?? null;
  const isCurrentUserLastOwner = currentUserMember
    ? isLastWorkspaceOwner(currentUserMember.role, ownerCount)
    : false;
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
  const leaveWorkspaceTarget = actionState?.type === "leave-workspace" ? currentUserMember : null;
  const resendInvitationTarget =
    actionState?.type === "resend-invitation"
      ? (invites.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const removeInvitationTarget =
    actionState?.type === "remove-invitation"
      ? (invites.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const isChangeRoleTargetLastOwner = changeRoleMember
    ? isLastWorkspaceOwner(changeRoleMember.role, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner = removeMemberTarget
    ? isLastWorkspaceOwner(removeMemberTarget.role, ownerCount)
    : false;

  function handleChangeRoleRequest(member: WorkspaceSettingsMember) {
    if (!canManageWorkspaceMemberRole(workspace.role, member.role)) {
      return;
    }

    setActionState({
      type: "change-role",
      memberId: member.id,
      selectedRole: member.role,
    });
  }

  function handleRemoveMemberRequest(member: WorkspaceSettingsMember) {
    if (!canManageWorkspaceMemberRole(workspace.role, member.role)) {
      return;
    }

    if (isLastWorkspaceOwner(member.role, ownerCount)) {
      return;
    }

    setActionState({
      type: "remove-member",
      memberId: member.id,
    });
  }

  function handleLeaveWorkspaceRequest() {
    if (!currentUserMember) {
      return;
    }

    setActionState({
      type: "leave-workspace",
    });
  }

  function handleResendInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    setActionState({
      type: "resend-invitation",
      invitationId: invitation.id,
    });
  }

  function handleRemoveInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    setActionState({
      type: "remove-invitation",
      invitationId: invitation.id,
    });
  }

  async function handleCopyInvitationLink(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    const response = await runAsyncTransition(() =>
      refreshInviteLinkAction(workspace.slug, invitation.id, locale)
    );

    if (!response.ok) {
      toast.error(getActionErrorMessage(response.errorCode, t("status.inviteCopy.error"), t));
      return;
    }

    startTransition(() => {
      onInviteResentAction(response.data.inviteId, {
        expiresAt: response.data.expiresAt,
        updatedAt: response.data.updatedAt,
        inviteUrl: response.data.inviteUrl,
      });
    });

    try {
      await window.navigator.clipboard.writeText(response.data.inviteUrl);
      toast.success(t("status.inviteCopy.success"));
    } catch (error) {
      console.error("Failed to copy invitation link:", error);
      toast.error(t("status.inviteCopy.copyFailed"));
    }
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
      onMemberRoleChangedAction(actionResponse.data.memberId, actionResponse.data.role);
    });
    toast.success(t("status.roleChange.success"));
  }

  async function handleLeaveWorkspaceConfirm() {
    if (!leaveWorkspaceTarget) {
      return;
    }

    if (isCurrentUserLastOwner) {
      toast.error(tLeave("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const response = await runAsyncTransition(() => leaveWorkspaceAction(workspace.slug));

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(
        response.errorCode === "LAST_OWNER_GUARD"
          ? tLeave("status.lastOwnerGuard")
          : tLeave("status.failed")
      );
      return;
    }

    toast.success(tLeave("status.success"));

    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      router.replace(APP_HOME_PATH);
    });
  }

  async function handleRemoveMemberConfirm() {
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
      onMemberRemovedAction(response.data.memberId);
    });
    toast.success(t("status.memberRemove.success"));
  }

  async function handleResendInvitationConfirm() {
    if (isInviteManagementReadOnly || !resendInvitationTarget) {
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
      onInviteResentAction(response.data.inviteId, {
        expiresAt: response.data.expiresAt,
        updatedAt: response.data.updatedAt,
        inviteUrl: response.data.inviteUrl,
      });
    });
    toast.success(t("status.inviteResend.success"));
  }

  async function handleRemoveInvitationConfirm() {
    if (isInviteManagementReadOnly || !removeInvitationTarget) {
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
      onInviteRemovedAction(response.data.inviteId);
    });
    toast.success(t("status.inviteRemove.success"));
  }

  return (
    <div className="pt-6">
      <SettingsItem>
        <SettingsItemContent className="flex flex-col gap-6">
          <SettingsItemContentHeader>
            <SettingsItemTitle>{t("title")}</SettingsItemTitle>
            <SettingsItemDescription>{t("description")}</SettingsItemDescription>
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
                <WorkspaceMembersTable
                  rows={members}
                  currentUserId={workspace.currentUserId}
                  actorRole={workspace.role}
                  ownerCount={ownerCount}
                  onChangeRoleRequest={handleChangeRoleRequest}
                  onLeaveWorkspaceRequest={handleLeaveWorkspaceRequest}
                  onRemoveMemberRequest={handleRemoveMemberRequest}
                />
              </TabsContent>

              <TabsContent value="pending-invitations" className="grid gap-4">
                {hasPendingInvitations ? (
                  <WorkspaceInvitationsTable
                    rows={invites}
                    isReadOnly={isInviteManagementReadOnly}
                    onCopyInvitationLink={handleCopyInvitationLink}
                    onResendInvitationRequest={handleResendInvitationRequest}
                    onRemoveInvitationRequest={handleRemoveInvitationRequest}
                  />
                ) : (
                  <WorkspacePendingInvitationsEmptyState />
                )}
              </TabsContent>
            </Tabs>
          </SettingsItemContentBody>
        </SettingsItemContent>
      </SettingsItem>

      <WorkspaceMembersManagementDialogs
        workspaceName={workspace.name}
        changeRoleMember={changeRoleMember}
        leaveWorkspaceTarget={leaveWorkspaceTarget}
        removeMemberTarget={removeMemberTarget}
        resendInvitationTarget={resendInvitationTarget}
        removeInvitationTarget={removeInvitationTarget}
        isActionSubmitting={isActionSubmitting}
        isCurrentUserLastOwner={isCurrentUserLastOwner}
        isChangeRoleTargetLastOwner={isChangeRoleTargetLastOwner}
        isRemoveMemberTargetLastOwner={isRemoveMemberTargetLastOwner}
        selectedRole={actionState?.type === "change-role" ? actionState.selectedRole : undefined}
        roleOptions={roleOptions}
        onActionDialogOpenChange={handleActionDialogOpenChange}
        onChangeRoleSelection={handleChangeRoleSelection}
        onChangeRoleConfirm={handleChangeRoleConfirm}
        onLeaveWorkspaceConfirm={handleLeaveWorkspaceConfirm}
        onRemoveMemberConfirm={handleRemoveMemberConfirm}
        onResendInvitationConfirm={handleResendInvitationConfirm}
        onRemoveInvitationConfirm={handleRemoveInvitationConfirm}
      />
    </div>
  );
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

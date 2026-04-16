"use client";

import { startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { APP_HOME_PATH } from "@/config/routes";
import { leaveWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import {
  changeMemberRoleAction,
  createInviteAction,
  refreshInviteLinkAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/features/workspaces/settings/members/workspace-members-actions";
import {
  WorkspaceInvitationsTable,
  WorkspacePendingInvitationsEmptyState,
  WorkspaceInvitationSummaryRow,
} from "@/features/workspaces/settings/members/workspace-invitations-table";
import { WorkspaceInviteMembersSettingsItem } from "@/features/workspaces/settings/members/workspace-invite-members-settings-item";
import {
  WorkspaceMemberSummaryRow,
  WorkspaceMembersTable,
} from "@/features/workspaces/settings/members/workspace-members-table";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";
import { getAssignableWorkspaceMemberRoleOptions } from "@/features/workspaces/workspace-role-options";
import {
  canAssignWorkspaceMemberRole,
  canChangeWorkspaceMemberRole,
  canManageWorkspaceMemberRole,
  isLastWorkspaceOwner,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";
import { useWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { runAsyncTransition } from "@/lib/app-utils";

type ManagementActionState =
  | {
      type: "change-role";
      member: WorkspaceSettingsMember;
      selectedRole: WorkspaceMemberRole;
    }
  | {
      type: "remove-member";
      member: WorkspaceSettingsMember;
    }
  | {
      type: "leave-workspace";
      member: WorkspaceSettingsMember;
    }
  | {
      type: "resend-invitation";
      invitation: WorkspaceSettingsInvite;
    }
  | {
      type: "remove-invitation";
      invitation: WorkspaceSettingsInvite;
    }
  | null;

export function WorkspaceMembersSettingsSection({
  workspace,
  initialMembers,
  initialInvites,
}: {
  workspace: WorkspaceSettingsWorkspace;
  initialMembers: WorkspaceSettingsMember[];
  initialInvites: WorkspaceSettingsInvite[];
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tCommon = useTranslations("pages.workspace.common");
  const tLeave = useTranslations("pages.workspace.general.leave");
  const tRoles = useTranslations("pages.workspace.members.roles");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { removeWorkspace, upsertWorkspace } = useWorkspaceNavigation();

  const [workspaceState, setWorkspaceState] = useState(workspace);
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const isInviteManagementReadOnly = workspaceState.role === "member";
  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember =
    members.find((member) => member.userId === workspaceState.currentUserId) ?? null;
  const isCurrentUserLastOwner = currentUserMember
    ? isLastWorkspaceOwner(currentUserMember.role, ownerCount)
    : false;
  const hasPendingInvitations = invites.length > 0;
  const roleOptions = getAssignableWorkspaceMemberRoleOptions(workspaceState.role);

  const changeRoleState = actionState?.type === "change-role" ? actionState : null;
  const removeMemberState = actionState?.type === "remove-member" ? actionState : null;
  const leaveWorkspaceState = actionState?.type === "leave-workspace" ? actionState : null;
  const resendInvitationState = actionState?.type === "resend-invitation" ? actionState : null;
  const removeInvitationState = actionState?.type === "remove-invitation" ? actionState : null;
  const resendInvitationTarget = resendInvitationState ? resendInvitationState.invitation : null;
  const removeInvitationTarget = removeInvitationState ? removeInvitationState.invitation : null;
  const isChangeRoleTargetLastOwner = changeRoleState
    ? isLastWorkspaceOwner(changeRoleState.member.role, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner = removeMemberState
    ? isLastWorkspaceOwner(removeMemberState.member.role, ownerCount)
    : false;

  async function handleCreateInviteAction(input: {
    locale: AppLocale;
    email: string;
    role: "admin" | "member";
  }) {
    const response = await runAsyncTransition(() => createInviteAction(workspaceState.slug, input));

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      setInvites((currentInvites) => [response.data.invite, ...currentInvites]);
    });

    return response;
  }

  function handleChangeRoleRequest(member: WorkspaceSettingsMember) {
    if (!canManageWorkspaceMemberRole(workspaceState.role, member.role)) {
      return;
    }

    setActionState({
      type: "change-role",
      member,
      selectedRole: member.role,
    });
  }

  function handleRemoveMemberRequest(member: WorkspaceSettingsMember) {
    if (!canManageWorkspaceMemberRole(workspaceState.role, member.role)) {
      return;
    }

    if (isLastWorkspaceOwner(member.role, ownerCount)) {
      return;
    }

    setActionState({
      type: "remove-member",
      member,
    });
  }

  function handleLeaveWorkspaceRequest() {
    if (!currentUserMember) {
      return;
    }

    setActionState({
      type: "leave-workspace",
      member: currentUserMember,
    });
  }

  function handleResendInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    setActionState({
      type: "resend-invitation",
      invitation,
    });
  }

  function handleRemoveInvitationRequest(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    setActionState({
      type: "remove-invitation",
      invitation,
    });
  }

  async function handleCopyInvitationLink(invitation: WorkspaceSettingsInvite) {
    if (isInviteManagementReadOnly) {
      return;
    }

    const response = await runAsyncTransition(() =>
      refreshInviteLinkAction(workspaceState.slug, invitation.id, locale)
    );

    if (!response.ok) {
      toast.error(getActionErrorMessage(response.errorCode, t("status.inviteCopy.error"), t));
      return;
    }

    startTransition(() => {
      setInvites((currentInvites) =>
        currentInvites.map((invite) =>
          invite.id === response.data.inviteId
            ? {
                ...invite,
                expiresAt: response.data.expiresAt,
                updatedAt: response.data.updatedAt,
                inviteUrl: response.data.inviteUrl,
              }
            : invite
        )
      );
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
    if (!changeRoleState) {
      return;
    }

    if (!isWorkspaceMemberRole(value)) {
      return;
    }

    if (!canAssignWorkspaceMemberRole(workspaceState.role, value)) {
      return;
    }

    if (isChangeRoleTargetLastOwner && value !== "owner") {
      return;
    }

    setActionState((currentState) => {
      if (currentState?.type !== "change-role") {
        return currentState;
      }

      return {
        ...currentState,
        selectedRole: value,
      };
    });
  }

  function handleActionError(message: string) {
    setIsActionSubmitting(false);
    toast.error(message);
  }

  function finalizeAction(update: () => void) {
    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
      update();
    });
  }

  async function handleChangeRoleConfirm() {
    if (!changeRoleState) {
      return;
    }

    if (isChangeRoleTargetLastOwner && changeRoleState.selectedRole !== "owner") {
      toast.error(t("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const nextRole = changeRoleState.selectedRole;

    if (!canChangeWorkspaceMemberRole(workspaceState.role, changeRoleState.member.role, nextRole)) {
      handleActionError(t("errors.forbidden"));
      return;
    }

    const actionResponse = await runAsyncTransition(() =>
      changeMemberRoleAction(workspaceState.slug, changeRoleState.member.id, nextRole)
    );

    if (!actionResponse.ok) {
      handleActionError(
        getActionErrorMessage(actionResponse.errorCode, t("status.roleChange.error"), t)
      );
      return;
    }

    const nextMembers = sortWorkspaceSettingsMembers(
      members.map((member) =>
        member.id === actionResponse.data.memberId
          ? { ...member, role: actionResponse.data.role }
          : member
      )
    );
    const nextWorkspace = deriveWorkspaceStateFromMembers(workspaceState, nextMembers);

    finalizeAction(() => {
      setMembers(nextMembers);
      setWorkspaceState(nextWorkspace);

      if (nextWorkspace.role !== workspaceState.role) {
        upsertWorkspace({
          id: nextWorkspace.id,
          slug: nextWorkspace.slug,
          name: nextWorkspace.name,
          role: nextWorkspace.role,
          avatarUrl: nextWorkspace.avatarUrl,
        });
      }
    });
    toast.success(t("status.roleChange.success"));
  }

  async function handleLeaveWorkspaceConfirm() {
    if (!leaveWorkspaceState) {
      return;
    }

    if (isCurrentUserLastOwner) {
      toast.error(tLeave("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const response = await runAsyncTransition(() => leaveWorkspaceAction(workspaceState.slug));

    if (!response.ok) {
      handleActionError(
        response.errorCode === "LAST_OWNER_GUARD"
          ? tLeave("status.lastOwnerGuard")
          : tLeave("status.failed")
      );
      return;
    }

    toast.success(tLeave("status.success"));

    finalizeAction(() => {
      removeWorkspace(workspaceState.id);
      router.replace(APP_HOME_PATH);
    });
  }

  async function handleRemoveMemberConfirm() {
    if (!removeMemberState) {
      return;
    }

    if (isRemoveMemberTargetLastOwner) {
      toast.error(t("status.lastOwnerGuard"));
      return;
    }

    setIsActionSubmitting(true);

    const response = await runAsyncTransition(() =>
      removeMemberAction(workspaceState.slug, removeMemberState.member.id)
    );

    if (!response.ok) {
      handleActionError(
        getActionErrorMessage(response.errorCode, t("status.memberRemove.error"), t)
      );
      return;
    }

    const nextMembers = members.filter((member) => member.id !== response.data.memberId);
    const nextWorkspace = deriveWorkspaceStateFromMembers(workspaceState, nextMembers);

    finalizeAction(() => {
      setMembers(nextMembers);
      setWorkspaceState(nextWorkspace);
    });
    toast.success(t("status.memberRemove.success"));
  }

  async function handleResendInvitationConfirm() {
    if (isInviteManagementReadOnly || !resendInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await runAsyncTransition(() =>
      resendInviteAction(workspaceState.slug, resendInvitationTarget.id, locale)
    );

    if (!response.ok) {
      handleActionError(
        getActionErrorMessage(response.errorCode, t("status.inviteResend.error"), t)
      );
      return;
    }

    finalizeAction(() => {
      setInvites((currentInvites) =>
        currentInvites.map((invite) =>
          invite.id === response.data.inviteId
            ? {
                ...invite,
                expiresAt: response.data.expiresAt,
                updatedAt: response.data.updatedAt,
                inviteUrl: response.data.inviteUrl,
              }
            : invite
        )
      );
    });
    toast.success(t("status.inviteResend.success"));
  }

  async function handleRemoveInvitationConfirm() {
    if (isInviteManagementReadOnly || !removeInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await runAsyncTransition(() =>
      revokeInviteAction(workspaceState.slug, removeInvitationTarget.id)
    );

    if (!response.ok) {
      handleActionError(
        getActionErrorMessage(response.errorCode, t("status.inviteRemove.error"), t)
      );
      return;
    }

    finalizeAction(() => {
      setInvites((currentInvites) =>
        currentInvites.filter((invite) => invite.id !== response.data.inviteId)
      );
    });
    toast.success(t("status.inviteRemove.success"));
  }

  return (
    <div className="grid gap-8">
      <WorkspaceInviteMembersSettingsItem
        workspace={workspaceState}
        onCreateInviteAction={handleCreateInviteAction}
      />

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
                    currentUserId={workspaceState.currentUserId}
                    actorRole={workspaceState.role}
                    ownerCount={ownerCount}
                    onChangeRoleRequestAction={handleChangeRoleRequest}
                    onLeaveWorkspaceRequestAction={handleLeaveWorkspaceRequest}
                    onRemoveMemberRequestAction={handleRemoveMemberRequest}
                  />
                </TabsContent>

                <TabsContent value="pending-invitations" className="grid gap-4">
                  {hasPendingInvitations ? (
                    <WorkspaceInvitationsTable
                      rows={invites}
                      isReadOnly={isInviteManagementReadOnly}
                      onCopyInvitationLinkAction={handleCopyInvitationLink}
                      onResendInvitationRequestAction={handleResendInvitationRequest}
                      onRemoveInvitationRequestAction={handleRemoveInvitationRequest}
                    />
                  ) : (
                    <WorkspacePendingInvitationsEmptyState />
                  )}
                </TabsContent>
              </Tabs>
            </SettingsItemContentBody>
          </SettingsItemContent>
        </SettingsItem>
      </div>

      <AlertDialog open={Boolean(changeRoleState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.changeRole.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.changeRole.description", {
                memberName: changeRoleState?.member.name ?? t("dialogs.common.thisMember"),
                workspaceName: workspaceState.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {changeRoleState && (
            <RadioGroup
              value={changeRoleState.selectedRole}
              onValueChange={handleChangeRoleSelection}
            >
              {roleOptions.map((option) => (
                <FieldLabel
                  key={option.value}
                  htmlFor={`workspace-member-role-${changeRoleState.member.id}-${option.value}`}
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{tRoles(option.labelKey)}</FieldTitle>
                      <FieldDescription>{tRoles(option.descriptionKey)}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      id={`workspace-member-role-${changeRoleState.member.id}-${option.value}`}
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
                !changeRoleState ||
                (isChangeRoleTargetLastOwner && changeRoleState.selectedRole !== "owner")
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

      <AlertDialog open={Boolean(leaveWorkspaceState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{tLeave("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{tLeave("dialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>

          {leaveWorkspaceState && <WorkspaceMemberSummaryRow member={leaveWorkspaceState.member} />}

          {isCurrentUserLastOwner && (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{tLeave("ownerGuardHint")}</AlertDescription>
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
              disabled={isActionSubmitting || !leaveWorkspaceState || isCurrentUserLastOwner}
              onClick={handleLeaveWorkspaceConfirm}
            >
              {isActionSubmitting ? (
                <Spinner />
              ) : (
                <LogOutIcon aria-hidden="true" className="size-4" />
              )}
              {isActionSubmitting
                ? tLeave("dialog.submit.pending")
                : tLeave("dialog.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeMemberState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeMember.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeMember.description", {
                workspaceName: workspaceState.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeMemberState && <WorkspaceMemberSummaryRow member={removeMemberState.member} />}

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
              disabled={isActionSubmitting || !removeMemberState || isRemoveMemberTargetLastOwner}
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
                workspaceName: workspaceState.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {resendInvitationTarget && (
            <WorkspaceInvitationSummaryRow invitation={resendInvitationTarget} />
          )}

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
                workspaceName: workspaceState.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeInvitationTarget && (
            <WorkspaceInvitationSummaryRow invitation={removeInvitationTarget} />
          )}

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

function deriveWorkspaceStateFromMembers(
  workspace: WorkspaceSettingsWorkspace,
  members: WorkspaceSettingsMember[]
): WorkspaceSettingsWorkspace {
  const currentUserMember =
    members.find((member) => member.userId === workspace.currentUserId) ?? null;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  if (!currentUserMember) {
    return workspace;
  }

  return {
    ...workspace,
    role: currentUserMember.role,
    isCurrentUserLastOwner: currentUserMember.role === "owner" && ownerCount === 1,
  };
}

function sortWorkspaceSettingsMembers(members: WorkspaceSettingsMember[]) {
  return [...members].sort((firstMember, secondMember) => {
    const roleOrderDifference =
      getWorkspaceRoleOrder(firstMember.role) - getWorkspaceRoleOrder(secondMember.role);

    if (roleOrderDifference !== 0) {
      return roleOrderDifference;
    }

    return getWorkspaceMemberSortKey(firstMember).localeCompare(
      getWorkspaceMemberSortKey(secondMember)
    );
  });
}

function getWorkspaceMemberSortKey(member: WorkspaceSettingsMember) {
  return member.email || member.name || member.userId;
}

function getWorkspaceRoleOrder(role: WorkspaceSettingsMember["role"]) {
  if (role === "owner") {
    return 0;
  }

  if (role === "admin") {
    return 1;
  }

  return 2;
}

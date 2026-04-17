"use client";

import { startTransition, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/features/workspaces/settings/members/workspace-invitations-table";
import { WorkspaceInviteMembersSettingsItem } from "@/features/workspaces/settings/members/workspace-invite-members-settings-item";
import { WorkspaceMembersTable } from "@/features/workspaces/settings/members/workspace-members-table";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";
import {
  getAssignableWorkspaceMemberRoleOptions,
  getWorkspaceMemberRoleLabel,
} from "@/features/workspaces/workspace-role-options";
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
import { getAvatarColorClass, getUserInitials, runAsyncTransition } from "@/lib/app-utils";

type ChangeRoleActionState = {
  type: "change-role";
  member: WorkspaceSettingsMember;
  selectedRole: WorkspaceMemberRole;
};

type ConfirmActionState =
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
    };

type ManagementActionState = ChangeRoleActionState | ConfirmActionState | null;

type WorkspaceInviteActionPatch = {
  inviteId: string;
  expiresAt: string;
  updatedAt: string;
  inviteUrl: string;
};

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
  const confirmActionState = actionState && actionState.type !== "change-role" ? actionState : null;
  const isChangeRoleTargetLastOwner = changeRoleState
    ? isLastWorkspaceOwner(changeRoleState.member.role, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner =
    confirmActionState?.type === "remove-member"
      ? isLastWorkspaceOwner(confirmActionState.member.role, ownerCount)
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
        currentInvites.map((invite) => patchWorkspaceInvite(invite, response.data))
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

  function applyMembersState(nextMembers: WorkspaceSettingsMember[]) {
    const nextWorkspace = deriveWorkspaceStateFromMembers(workspaceState, nextMembers);

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
    if (actionState?.type !== "change-role") {
      return;
    }

    if (!isWorkspaceMemberRole(value)) {
      return;
    }

    if (!canAssignWorkspaceMemberRole(workspaceState.role, value)) {
      return;
    }

    if (isLastWorkspaceOwner(actionState.member.role, ownerCount) && value !== "owner") {
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

    if (
      !canChangeWorkspaceMemberRole(
        workspaceState.role,
        changeRoleState.member.role,
        changeRoleState.selectedRole
      )
    ) {
      toast.error(t("errors.forbidden"));
      return;
    }

    setIsActionSubmitting(true);

    const response = await runAsyncTransition(() =>
      changeMemberRoleAction(
        workspaceState.slug,
        changeRoleState.member.id,
        changeRoleState.selectedRole
      )
    );

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, t("status.roleChange.error"), t));
      return;
    }

    finalizeAction(() => {
      applyMembersState(
        sortWorkspaceSettingsMembers(
          members.map((member) =>
            member.id === response.data.memberId ? { ...member, role: response.data.role } : member
          )
        )
      );
    });
    toast.success(t("status.roleChange.success"));
  }

  async function handleConfirmAction() {
    if (!confirmActionState) {
      return;
    }

    switch (confirmActionState.type) {
      case "leave-workspace": {
        if (isCurrentUserLastOwner) {
          toast.error(tLeave("status.lastOwnerGuard"));
          return;
        }

        setIsActionSubmitting(true);
        const response = await runAsyncTransition(() => leaveWorkspaceAction(workspaceState.slug));

        if (!response.ok) {
          setIsActionSubmitting(false);
          toast.error(
            response.errorCode === "LAST_OWNER_GUARD"
              ? tLeave("status.lastOwnerGuard")
              : tLeave("status.failed")
          );
          return;
        }

        finalizeAction(() => {
          removeWorkspace(workspaceState.id);
          router.replace(APP_HOME_PATH);
        });
        toast.success(tLeave("status.success"));
        return;
      }

      case "remove-member": {
        if (isRemoveMemberTargetLastOwner) {
          toast.error(t("status.lastOwnerGuard"));
          return;
        }

        setIsActionSubmitting(true);
        const response = await runAsyncTransition(() =>
          removeMemberAction(workspaceState.slug, confirmActionState.member.id)
        );

        if (!response.ok) {
          setIsActionSubmitting(false);
          toast.error(getActionErrorMessage(response.errorCode, t("status.memberRemove.error"), t));
          return;
        }

        finalizeAction(() => {
          applyMembersState(members.filter((member) => member.id !== response.data.memberId));
        });
        toast.success(t("status.memberRemove.success"));
        return;
      }

      case "resend-invitation": {
        if (isInviteManagementReadOnly) {
          return;
        }

        setIsActionSubmitting(true);
        const response = await runAsyncTransition(() =>
          resendInviteAction(workspaceState.slug, confirmActionState.invitation.id, locale)
        );

        if (!response.ok) {
          setIsActionSubmitting(false);
          toast.error(getActionErrorMessage(response.errorCode, t("status.inviteResend.error"), t));
          return;
        }

        finalizeAction(() => {
          setInvites((currentInvites) =>
            currentInvites.map((invite) => patchWorkspaceInvite(invite, response.data))
          );
        });
        toast.success(t("status.inviteResend.success"));
        return;
      }

      case "remove-invitation": {
        if (isInviteManagementReadOnly) {
          return;
        }

        setIsActionSubmitting(true);
        const response = await runAsyncTransition(() =>
          revokeInviteAction(workspaceState.slug, confirmActionState.invitation.id)
        );

        if (!response.ok) {
          setIsActionSubmitting(false);
          toast.error(getActionErrorMessage(response.errorCode, t("status.inviteRemove.error"), t));
          return;
        }

        finalizeAction(() => {
          setInvites((currentInvites) =>
            currentInvites.filter((invite) => invite.id !== response.data.inviteId)
          );
        });
        toast.success(t("status.inviteRemove.success"));
        return;
      }
    }
  }

  let confirmDialogTitle = "";
  let confirmDialogDescription = "";
  let confirmDialogSubmitLabel = "";
  let confirmDialogPendingLabel = "";
  let confirmDialogBody: ReactNode = null;
  let confirmDialogGuard: ReactNode = null;
  let confirmDialogVariant: "default" | "destructive" = "default";
  let confirmDialogIcon: ReactNode = null;
  let isConfirmDialogDisabled = !confirmActionState;

  if (confirmActionState) {
    switch (confirmActionState.type) {
      case "leave-workspace":
        confirmDialogTitle = tLeave("dialog.title");
        confirmDialogDescription = tLeave("dialog.description");
        confirmDialogSubmitLabel = tLeave("dialog.submit.default");
        confirmDialogPendingLabel = tLeave("dialog.submit.pending");
        confirmDialogBody = renderWorkspaceMemberSummary(
          confirmActionState.member,
          getWorkspaceMemberRoleLabel(confirmActionState.member.role, tRoles)
        );
        confirmDialogGuard = isCurrentUserLastOwner && (
          <Alert>
            <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
            <AlertDescription>{tLeave("ownerGuardHint")}</AlertDescription>
          </Alert>
        );
        confirmDialogVariant = "destructive";
        confirmDialogIcon = <LogOutIcon aria-hidden="true" className="size-4" />;
        isConfirmDialogDisabled = isCurrentUserLastOwner;
        break;

      case "remove-member":
        confirmDialogTitle = t("dialogs.removeMember.title");
        confirmDialogDescription = t("dialogs.removeMember.description", {
          workspaceName: workspaceState.name,
        });
        confirmDialogSubmitLabel = t("dialogs.removeMember.submit.default");
        confirmDialogPendingLabel = t("dialogs.removeMember.submit.pending");
        confirmDialogBody = renderWorkspaceMemberSummary(
          confirmActionState.member,
          getWorkspaceMemberRoleLabel(confirmActionState.member.role, tRoles)
        );
        confirmDialogGuard = isRemoveMemberTargetLastOwner && (
          <Alert>
            <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
            <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
          </Alert>
        );
        confirmDialogVariant = "destructive";
        isConfirmDialogDisabled = isRemoveMemberTargetLastOwner;
        break;

      case "resend-invitation":
        confirmDialogTitle = t("dialogs.resendInvite.title");
        confirmDialogDescription = t("dialogs.resendInvite.description", {
          workspaceName: workspaceState.name,
        });
        confirmDialogSubmitLabel = t("dialogs.resendInvite.submit.default");
        confirmDialogPendingLabel = t("dialogs.resendInvite.submit.pending");
        confirmDialogBody = renderWorkspaceInviteSummary(
          confirmActionState.invitation,
          getWorkspaceMemberRoleLabel(confirmActionState.invitation.role, tRoles)
        );
        isConfirmDialogDisabled = isInviteManagementReadOnly;
        break;

      case "remove-invitation":
        confirmDialogTitle = t("dialogs.removeInvite.title");
        confirmDialogDescription = t("dialogs.removeInvite.description", {
          workspaceName: workspaceState.name,
        });
        confirmDialogSubmitLabel = t("dialogs.removeInvite.submit.default");
        confirmDialogPendingLabel = t("dialogs.removeInvite.submit.pending");
        confirmDialogBody = renderWorkspaceInviteSummary(
          confirmActionState.invitation,
          getWorkspaceMemberRoleLabel(confirmActionState.invitation.role, tRoles)
        );
        confirmDialogVariant = "destructive";
        isConfirmDialogDisabled = isInviteManagementReadOnly;
        break;
    }
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
              {isActionSubmitting ? <Spinner /> : null}
              {isActionSubmitting
                ? t("dialogs.changeRole.submit.pending")
                : t("dialogs.changeRole.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(confirmActionState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>

          {confirmDialogBody}
          {confirmDialogGuard}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant={confirmDialogVariant}
              disabled={isActionSubmitting || isConfirmDialogDisabled}
              onClick={handleConfirmAction}
            >
              {isActionSubmitting ? <Spinner /> : confirmDialogIcon}
              {isActionSubmitting ? confirmDialogPendingLabel : confirmDialogSubmitLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function renderWorkspaceMemberSummary(
  member: WorkspaceSettingsMember,
  roleLabel: string
): ReactNode {
  const displayName = member.name ?? member.email;
  const initials = getUserInitials(displayName);
  const avatarColorClass = getAvatarColorClass(member.userId);

  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
          <AvatarFallback className={avatarColorClass}>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{member.email}</p>
        </div>
      </div>
      <span className="text-muted-foreground text-sm">{roleLabel}</span>
    </div>
  );
}

function renderWorkspaceInviteSummary(
  invitation: WorkspaceSettingsInvite,
  roleLabel: string
): ReactNode {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm font-medium">{invitation.emailNormalized}</span>
      <span className="text-muted-foreground text-sm">{roleLabel}</span>
    </div>
  );
}

function getActionErrorMessage(
  errorCode: string,
  fallbackMessage: string,
  t: (key: string) => string
): string {
  switch (errorCode) {
    case "LAST_OWNER_GUARD":
      return t("errors.lastOwnerGuard");
    case "RATE_LIMITED":
      return t("errors.rateLimited");
    case "FORBIDDEN":
      return t("errors.forbidden");
    case "NOT_FOUND":
      return t("errors.notFound");
    default:
      return fallbackMessage;
  }
}

function patchWorkspaceInvite(
  invite: WorkspaceSettingsInvite,
  patch: WorkspaceInviteActionPatch
): WorkspaceSettingsInvite {
  if (invite.id !== patch.inviteId) {
    return invite;
  }

  return {
    ...invite,
    expiresAt: patch.expiresAt,
    updatedAt: patch.updatedAt,
    inviteUrl: patch.inviteUrl,
  };
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
  return role === "owner" ? 0 : role === "admin" ? 1 : 2;
}

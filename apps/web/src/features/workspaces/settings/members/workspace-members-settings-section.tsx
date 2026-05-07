"use client";

import { startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SettingsItem,
  SettingsItemContent,
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import { leaveWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import {
  changeMemberRoleAction,
  createInviteAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/features/workspaces/settings/members/workspace-members-actions";
import {
  createWorkspaceInviteConfirmTarget,
  createWorkspaceMemberConfirmTarget,
  WorkspaceConfirmActionDialog,
  type WorkspaceConfirmActionModel,
  WorkspaceMemberRoleDialog,
  type WorkspaceMemberRoleDialogOption,
  type WorkspaceMembersActionSubmitOptions,
} from "@/features/workspaces/settings/members/workspace-members-action-dialogs";
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
  isLastWorkspaceOwner,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";
import { useApplyWorkspaceNavigationPatch } from "@/features/workspaces/workspace-navigation-context";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { runAsyncTransition } from "@/lib/app-utils";

const actionErrorMessageKeys: Record<string, string> = {
  LAST_OWNER_GUARD: "errors.lastOwnerGuard",
  RATE_LIMITED: "errors.rateLimited",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.notFound",
};

type ChangeRoleActionState = {
  type: "change-role";
  member: WorkspaceSettingsMember;
  selectedRole: WorkspaceMemberRole;
};

type ConfirmActionState =
  | {
      type: "remove-member" | "leave-workspace";
      member: WorkspaceSettingsMember;
    }
  | {
      type: "resend-invitation" | "remove-invitation";
      invitation: WorkspaceSettingsInvite;
    };

type ManagementActionState = ChangeRoleActionState | ConfirmActionState | null;

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
  const applyWorkspaceNavigationPatch = useApplyWorkspaceNavigationPatch();

  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const ownerCount = initialMembers.filter((member) => member.role === "owner").length;
  const currentUserMember =
    initialMembers.find((member) => member.userId === workspace.currentUserId) ?? null;
  const isCurrentUserLastOwner = currentUserMember
    ? isLastWorkspaceOwner(currentUserMember.role, ownerCount)
    : false;
  const isInviteManagementReadOnly = workspace.role === "member";
  const roleOptions = getAssignableWorkspaceMemberRoleOptions(workspace.role);
  const roleDialogOptions: WorkspaceMemberRoleDialogOption[] = roleOptions.map((option) => ({
    value: option.value,
    label: tRoles(option.labelKey),
  }));
  const changeRoleState = actionState?.type === "change-role" ? actionState : null;
  const confirmActionState = actionState && actionState.type !== "change-role" ? actionState : null;
  const isChangeRoleTargetLastOwner = changeRoleState
    ? isLastWorkspaceOwner(changeRoleState.member.role, ownerCount)
    : false;

  async function handleCreateInviteAction(input: {
    locale: AppLocale;
    email: string;
    role: "admin" | "member";
  }) {
    const response = await runAsyncTransition(() => createInviteAction(workspace.slug, input));

    if (response.ok) {
      refreshServerState();
    }

    return response;
  }

  function openChangeRoleDialog(member: WorkspaceSettingsMember) {
    setActionState({
      type: "change-role",
      member,
      selectedRole: member.role,
    });
  }

  function openMemberConfirmDialog(
    type: "remove-member" | "leave-workspace",
    member: WorkspaceSettingsMember
  ) {
    setActionState({ type, member });
  }

  function openInviteConfirmDialog(
    type: "resend-invitation" | "remove-invitation",
    invitation: WorkspaceSettingsInvite
  ) {
    if (!isInviteManagementReadOnly) {
      setActionState({ type, invitation });
    }
  }

  function handleActionDialogOpenChange(open: boolean) {
    if (!open && !isActionSubmitting) {
      setActionState(null);
    }
  }

  function handleChangeRoleSelection(value: string) {
    if (
      actionState?.type !== "change-role" ||
      !isWorkspaceMemberRole(value) ||
      !canAssignWorkspaceMemberRole(workspace.role, value) ||
      (isLastWorkspaceOwner(actionState.member.role, ownerCount) && value !== "owner")
    ) {
      return;
    }

    setActionState({
      ...actionState,
      selectedRole: value,
    });
  }

  function completeAction(refresh = true) {
    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);

      if (refresh) {
        router.refresh();
      }
    });
  }

  function refreshServerState() {
    startTransition(() => {
      router.refresh();
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

    await submitManagementAction({
      action: () =>
        changeMemberRoleAction(
          workspace.slug,
          changeRoleState.member.id,
          changeRoleState.selectedRole
        ),
      fallbackErrorMessage: t("status.roleChange.error"),
      successMessage: t("status.roleChange.success"),
    });
  }

  async function handleConfirmAction() {
    if (confirmActionModel) {
      await submitManagementAction(confirmActionModel.submitOptions);
    }
  }

  function getConfirmActionModel(state: ConfirmActionState): WorkspaceConfirmActionModel | null {
    switch (state.type) {
      case "leave-workspace":
        return {
          title: tLeave("dialog.title"),
          description: tLeave("dialog.description"),
          submitLabel: tLeave("dialog.submit.default"),
          pendingLabel: tLeave("dialog.submit.pending"),
          target: createWorkspaceMemberConfirmTarget(
            state.member,
            getWorkspaceMemberRoleLabel(state.member.role, tRoles)
          ),
          guard: isCurrentUserLastOwner
            ? {
                title: t("dialogs.lastOwnerGuard.title"),
                description: tLeave("ownerGuardHint"),
              }
            : undefined,
          variant: "destructive",
          disabled: isCurrentUserLastOwner,
          submitOptions: {
            action: () => leaveWorkspaceAction(workspace.slug),
            fallbackErrorMessage: tLeave("status.failed"),
            successMessage: tLeave("status.success"),
            refresh: false,
            getErrorMessage: (errorCode) =>
              errorCode === "LAST_OWNER_GUARD"
                ? tLeave("status.lastOwnerGuard")
                : tLeave("status.failed"),
            onSuccess: (response) => applyWorkspaceNavigationPatch(response.data?.navigationPatch),
          },
        };
      case "remove-member":
        return {
          title: t("dialogs.removeMember.title"),
          description: t("dialogs.removeMember.description", { workspaceName: workspace.name }),
          submitLabel: t("dialogs.removeMember.submit.default"),
          pendingLabel: t("dialogs.removeMember.submit.pending"),
          target: createWorkspaceMemberConfirmTarget(
            state.member,
            getWorkspaceMemberRoleLabel(state.member.role, tRoles)
          ),
          guard: isLastWorkspaceOwner(state.member.role, ownerCount)
            ? {
                title: t("dialogs.lastOwnerGuard.title"),
                description: t("dialogs.lastOwnerGuard.description"),
              }
            : undefined,
          variant: "destructive",
          disabled: isLastWorkspaceOwner(state.member.role, ownerCount),
          submitOptions: {
            action: () => removeMemberAction(workspace.slug, state.member.id),
            fallbackErrorMessage: t("status.memberRemove.error"),
            successMessage: t("status.memberRemove.success"),
          },
        };
      case "resend-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.resendInvite.title"),
              description: t("dialogs.resendInvite.description", { workspaceName: workspace.name }),
              submitLabel: t("dialogs.resendInvite.submit.default"),
              pendingLabel: t("dialogs.resendInvite.submit.pending"),
              target: createWorkspaceInviteConfirmTarget(
                state.invitation,
                getWorkspaceMemberRoleLabel(state.invitation.role, tRoles)
              ),
              disabled: isInviteManagementReadOnly,
              submitOptions: {
                action: () => resendInviteAction(workspace.slug, state.invitation.id, locale),
                fallbackErrorMessage: t("status.inviteResend.error"),
                successMessage: t("status.inviteResend.success"),
              },
            };
      case "remove-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.removeInvite.title"),
              description: t("dialogs.removeInvite.description", { workspaceName: workspace.name }),
              submitLabel: t("dialogs.removeInvite.submit.default"),
              pendingLabel: t("dialogs.removeInvite.submit.pending"),
              target: createWorkspaceInviteConfirmTarget(
                state.invitation,
                getWorkspaceMemberRoleLabel(state.invitation.role, tRoles)
              ),
              variant: "destructive",
              disabled: isInviteManagementReadOnly,
              submitOptions: {
                action: () => revokeInviteAction(workspace.slug, state.invitation.id),
                fallbackErrorMessage: t("status.inviteRemove.error"),
                successMessage: t("status.inviteRemove.success"),
              },
            };
    }
  }

  async function submitManagementAction(options: WorkspaceMembersActionSubmitOptions) {
    setIsActionSubmitting(true);

    const response = await runAsyncTransition(options.action);

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(
        options.getErrorMessage
          ? options.getErrorMessage(response.errorCode)
          : getActionErrorMessage(response.errorCode, options.fallbackErrorMessage, t)
      );
      return;
    }

    completeAction(options.refresh);
    options.onSuccess?.(response);
    toast.success(options.successMessage);
  }

  const confirmActionModel = confirmActionState ? getConfirmActionModel(confirmActionState) : null;

  return (
    <div className="grid gap-8">
      <WorkspaceInviteMembersSettingsItem
        workspace={workspace}
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
                    rows={initialMembers}
                    currentUserId={workspace.currentUserId}
                    actorRole={workspace.role}
                    ownerCount={ownerCount}
                    onChangeRoleRequestAction={openChangeRoleDialog}
                    onLeaveWorkspaceRequestAction={() => {
                      if (currentUserMember) {
                        openMemberConfirmDialog("leave-workspace", currentUserMember);
                      }
                    }}
                    onRemoveMemberRequestAction={(member) =>
                      openMemberConfirmDialog("remove-member", member)
                    }
                  />
                </TabsContent>

                <TabsContent value="pending-invitations" className="grid gap-4">
                  {initialInvites.length > 0 ? (
                    <WorkspaceInvitationsTable
                      rows={initialInvites}
                      isReadOnly={isInviteManagementReadOnly}
                      onResendInvitationRequestAction={(invitation) =>
                        openInviteConfirmDialog("resend-invitation", invitation)
                      }
                      onRemoveInvitationRequestAction={(invitation) =>
                        openInviteConfirmDialog("remove-invitation", invitation)
                      }
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

      <WorkspaceMemberRoleDialog
        open={Boolean(changeRoleState)}
        title={t("dialogs.changeRole.title")}
        description={t("dialogs.changeRole.description", {
          memberName: changeRoleState?.member.name ?? t("dialogs.common.thisMember"),
          workspaceName: workspace.name,
        })}
        cancelLabel={tCommon("cancel")}
        submitLabel={t("dialogs.changeRole.submit.default")}
        pendingLabel={t("dialogs.changeRole.submit.pending")}
        guardTitle={t("dialogs.lastOwnerGuard.title")}
        guardDescription={t("dialogs.lastOwnerGuard.description")}
        roleFieldIdPrefix={
          changeRoleState ? `workspace-member-role-${changeRoleState.member.id}` : null
        }
        roleOptions={roleDialogOptions}
        selectedRole={changeRoleState?.selectedRole ?? null}
        isSubmitting={isActionSubmitting}
        isTargetLastOwner={isChangeRoleTargetLastOwner}
        onOpenChange={handleActionDialogOpenChange}
        onRoleChange={handleChangeRoleSelection}
        onConfirm={handleChangeRoleConfirm}
      />

      <WorkspaceConfirmActionDialog
        open={Boolean(confirmActionState)}
        model={confirmActionModel}
        cancelLabel={tCommon("cancel")}
        isSubmitting={isActionSubmitting}
        onOpenChange={handleActionDialogOpenChange}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

function getActionErrorMessage(
  errorCode: string,
  fallbackMessage: string,
  t: (key: string) => string
): string {
  const translationKey = actionErrorMessageKeys[errorCode];

  return translationKey ? t(translationKey) : fallbackMessage;
}

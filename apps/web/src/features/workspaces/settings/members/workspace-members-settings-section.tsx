"use client";

import { type ReactNode, startTransition, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field";
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
import { leaveWorkspaceAction } from "@/features/workspaces/settings/general/workspace-general-actions";
import {
  changeMemberRoleAction,
  createInviteAction,
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
  isLastWorkspaceOwner,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";
import { useApplyWorkspaceNavigationPatch } from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationPatch } from "@/features/workspaces/workspace-navigation-types";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getAvatarColorClass, getUserInitials, runAsyncTransition } from "@/lib/app-utils";

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

type ActionSubmitResponse =
  | {
      ok: true;
      data?: Record<string, unknown> & {
        navigationPatch?: WorkspaceNavigationPatch;
      };
    }
  | {
      ok: false;
      errorCode: string;
    };

type ActionSubmitOptions = {
  action: () => Promise<ActionSubmitResponse>;
  fallbackErrorMessage: string;
  successMessage: string;
  refresh?: boolean;
  getErrorMessage?: (errorCode: string) => string;
  onSuccess?: (response: Extract<ActionSubmitResponse, { ok: true }>) => void;
};

type ConfirmActionConfig = ActionSubmitOptions & {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  body?: ReactNode;
  guard?: ReactNode;
  variant?: "destructive";
  disabled?: boolean;
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
    if (confirmActionConfig) {
      await submitManagementAction(confirmActionConfig);
    }
  }

  function getConfirmActionConfig(state: ConfirmActionState): ConfirmActionConfig | null {
    switch (state.type) {
      case "leave-workspace":
        return {
          title: tLeave("dialog.title"),
          description: tLeave("dialog.description"),
          submitLabel: tLeave("dialog.submit.default"),
          pendingLabel: tLeave("dialog.submit.pending"),
          body: renderWorkspaceMemberSummary(
            state.member,
            getWorkspaceMemberRoleLabel(state.member.role, tRoles)
          ),
          guard: isCurrentUserLastOwner && (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{tLeave("ownerGuardHint")}</AlertDescription>
            </Alert>
          ),
          variant: "destructive",
          disabled: isCurrentUserLastOwner,
          action: () => leaveWorkspaceAction(workspace.slug),
          fallbackErrorMessage: tLeave("status.failed"),
          successMessage: tLeave("status.success"),
          refresh: false,
          getErrorMessage: (errorCode) =>
            errorCode === "LAST_OWNER_GUARD"
              ? tLeave("status.lastOwnerGuard")
              : tLeave("status.failed"),
          onSuccess: (response) => applyWorkspaceNavigationPatch(response.data?.navigationPatch),
        };
      case "remove-member":
        return {
          title: t("dialogs.removeMember.title"),
          description: t("dialogs.removeMember.description", { workspaceName: workspace.name }),
          submitLabel: t("dialogs.removeMember.submit.default"),
          pendingLabel: t("dialogs.removeMember.submit.pending"),
          body: renderWorkspaceMemberSummary(
            state.member,
            getWorkspaceMemberRoleLabel(state.member.role, tRoles)
          ),
          guard: isLastWorkspaceOwner(state.member.role, ownerCount) && (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
            </Alert>
          ),
          variant: "destructive",
          disabled: isLastWorkspaceOwner(state.member.role, ownerCount),
          action: () => removeMemberAction(workspace.slug, state.member.id),
          fallbackErrorMessage: t("status.memberRemove.error"),
          successMessage: t("status.memberRemove.success"),
        };
      case "resend-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.resendInvite.title"),
              description: t("dialogs.resendInvite.description", { workspaceName: workspace.name }),
              submitLabel: t("dialogs.resendInvite.submit.default"),
              pendingLabel: t("dialogs.resendInvite.submit.pending"),
              body: renderWorkspaceInviteSummary(
                state.invitation,
                getWorkspaceMemberRoleLabel(state.invitation.role, tRoles)
              ),
              disabled: isInviteManagementReadOnly,
              action: () => resendInviteAction(workspace.slug, state.invitation.id, locale),
              fallbackErrorMessage: t("status.inviteResend.error"),
              successMessage: t("status.inviteResend.success"),
            };
      case "remove-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.removeInvite.title"),
              description: t("dialogs.removeInvite.description", { workspaceName: workspace.name }),
              submitLabel: t("dialogs.removeInvite.submit.default"),
              pendingLabel: t("dialogs.removeInvite.submit.pending"),
              body: renderWorkspaceInviteSummary(
                state.invitation,
                getWorkspaceMemberRoleLabel(state.invitation.role, tRoles)
              ),
              variant: "destructive",
              disabled: isInviteManagementReadOnly,
              action: () => revokeInviteAction(workspace.slug, state.invitation.id),
              fallbackErrorMessage: t("status.inviteRemove.error"),
              successMessage: t("status.inviteRemove.success"),
            };
    }
  }

  async function submitManagementAction(options: ActionSubmitOptions) {
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

  const confirmActionConfig = confirmActionState
    ? getConfirmActionConfig(confirmActionState)
    : null;

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

      <AlertDialog open={Boolean(changeRoleState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.changeRole.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.changeRole.description", {
                memberName: changeRoleState?.member.name ?? t("dialogs.common.thisMember"),
                workspaceName: workspace.name,
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

      <AlertDialog open={Boolean(confirmActionState)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmActionConfig?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmActionConfig?.description}</AlertDialogDescription>
          </AlertDialogHeader>

          {confirmActionConfig?.body}
          {confirmActionConfig?.guard}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant={confirmActionConfig?.variant}
              disabled={isActionSubmitting || Boolean(confirmActionConfig?.disabled)}
              onClick={handleConfirmAction}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting
                ? confirmActionConfig?.pendingLabel
                : confirmActionConfig?.submitLabel}
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

  return (
    <WorkspaceActionSummary roleLabel={roleLabel}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar>
          {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
          <AvatarFallback className={getAvatarColorClass(member.userId)}>
            {getUserInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{member.email}</p>
        </div>
      </div>
    </WorkspaceActionSummary>
  );
}

function renderWorkspaceInviteSummary(
  invitation: WorkspaceSettingsInvite,
  roleLabel: string
): ReactNode {
  return (
    <WorkspaceActionSummary roleLabel={roleLabel}>
      <span className="text-sm font-medium">{invitation.emailNormalized}</span>
    </WorkspaceActionSummary>
  );
}

function WorkspaceActionSummary({
  children,
  roleLabel,
}: {
  children: ReactNode;
  roleLabel: string;
}) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      {children}
      <span className="text-muted-foreground shrink-0 text-sm">{roleLabel}</span>
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

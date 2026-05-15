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
import { leaveOrganizationAction } from "@/features/organizations/settings/general/organization-general-actions";
import {
  changeMemberRoleAction,
  createInviteAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/features/organizations/settings/members/organization-members-actions";
import {
  createOrganizationInviteConfirmTarget,
  createOrganizationMemberConfirmTarget,
  OrganizationConfirmActionDialog,
  type OrganizationConfirmActionModel,
  OrganizationMemberRoleDialog,
  type OrganizationMemberRoleDialogOption,
  type OrganizationMembersActionSubmitOptions,
} from "@/features/organizations/settings/members/organization-members-action-dialogs";
import {
  OrganizationInvitationsTable,
  OrganizationPendingInvitationsEmptyState,
} from "@/features/organizations/settings/members/organization-invitations-table";
import { OrganizationInviteMembersSettingsItem } from "@/features/organizations/settings/members/organization-invite-members-settings-item";
import { OrganizationMembersTable } from "@/features/organizations/settings/members/organization-members-table";
import {
  addOrganizationSettingsInvite,
  removeOrganizationSettingsInvite,
  removeOrganizationSettingsMember,
  updateOrganizationSettingsInvite,
  updateOrganizationSettingsMemberRole,
} from "@/features/organizations/settings/members/organization-members-state";
import type {
  OrganizationSettingsInvite,
  OrganizationSettingsMember,
  OrganizationSettingsOrganization,
} from "@/features/organizations/settings/organization-settings-types";
import {
  getAssignableOrganizationMemberRoleOptions,
  getOrganizationMemberRoleLabel,
} from "@/features/organizations/organization-role-options";
import {
  canAssignOrganizationMemberRole,
  isLastOrganizationOwner,
  isOrganizationMemberRole,
  type OrganizationMemberRole,
} from "@/features/organizations/organization-role-rules";
import { useApplyOrganizationNavigationPatch } from "@/features/organizations/organization-navigation-context";
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
  member: OrganizationSettingsMember;
  selectedRole: OrganizationMemberRole;
};

type ConfirmActionState =
  | {
      type: "remove-member" | "leave-organization";
      member: OrganizationSettingsMember;
    }
  | {
      type: "resend-invitation" | "remove-invitation";
      invitation: OrganizationSettingsInvite;
    };

type ManagementActionState = ChangeRoleActionState | ConfirmActionState | null;

export function OrganizationMembersSettingsSection({
  organization,
  initialMembers,
  initialInvites,
}: {
  organization: OrganizationSettingsOrganization;
  initialMembers: OrganizationSettingsMember[];
  initialInvites: OrganizationSettingsInvite[];
}) {
  const t = useTranslations("pages.organization.members.management");
  const tCommon = useTranslations("pages.organization.common");
  const tLeave = useTranslations("pages.organization.general.leave");
  const tRoles = useTranslations("pages.organization.members.roles");
  const locale = useLocale() as AppLocale;
  const applyOrganizationNavigationPatch = useApplyOrganizationNavigationPatch();

  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const ownerCount = members.filter((member) => member.role === "owner").length;
  const currentUserMember =
    members.find((member) => member.userId === organization.currentUserId) ?? null;
  const isCurrentUserLastOwner = currentUserMember
    ? isLastOrganizationOwner(currentUserMember.role, ownerCount)
    : false;
  const isInviteManagementReadOnly = organization.role === "member";
  const roleOptions = getAssignableOrganizationMemberRoleOptions(organization.role);
  const roleDialogOptions: OrganizationMemberRoleDialogOption[] = roleOptions.map((option) => ({
    value: option.value,
    label: tRoles(option.labelKey),
  }));
  const changeRoleState = actionState?.type === "change-role" ? actionState : null;
  const confirmActionState = actionState && actionState.type !== "change-role" ? actionState : null;
  const isChangeRoleTargetLastOwner = changeRoleState
    ? isLastOrganizationOwner(changeRoleState.member.role, ownerCount)
    : false;

  async function handleCreateInviteAction(input: {
    locale: AppLocale;
    email: string;
    role: "admin" | "member";
  }) {
    const response = await runAsyncTransition(() => createInviteAction(organization.slug, input));

    if (response.ok) {
      startTransition(() => {
        setInvites((currentInvites) =>
          addOrganizationSettingsInvite(currentInvites, response.data.invite)
        );
      });
    }

    return response;
  }

  function openChangeRoleDialog(member: OrganizationSettingsMember) {
    setActionState({
      type: "change-role",
      member,
      selectedRole: member.role,
    });
  }

  function openMemberConfirmDialog(
    type: "remove-member" | "leave-organization",
    member: OrganizationSettingsMember
  ) {
    setActionState({ type, member });
  }

  function openInviteConfirmDialog(
    type: "resend-invitation" | "remove-invitation",
    invitation: OrganizationSettingsInvite
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
      !isOrganizationMemberRole(value) ||
      !canAssignOrganizationMemberRole(organization.role, value) ||
      (isLastOrganizationOwner(actionState.member.role, ownerCount) && value !== "owner")
    ) {
      return;
    }

    setActionState({
      ...actionState,
      selectedRole: value,
    });
  }

  function completeAction() {
    startTransition(() => {
      setIsActionSubmitting(false);
      setActionState(null);
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
          organization.slug,
          changeRoleState.member.id,
          changeRoleState.selectedRole
        ),
      fallbackErrorMessage: t("status.roleChange.error"),
      successMessage: t("status.roleChange.success"),
      onSuccess: () => {
        setMembers((currentMembers) =>
          updateOrganizationSettingsMemberRole(currentMembers, {
            memberId: changeRoleState.member.id,
            role: changeRoleState.selectedRole,
          })
        );
      },
    });
  }

  async function handleConfirmAction() {
    if (confirmActionModel) {
      await submitManagementAction(confirmActionModel.submitOptions);
    }
  }

  function getConfirmActionModel(state: ConfirmActionState): OrganizationConfirmActionModel | null {
    switch (state.type) {
      case "leave-organization":
        return {
          title: tLeave("dialog.title"),
          description: tLeave("dialog.description"),
          submitLabel: tLeave("dialog.submit.default"),
          pendingLabel: tLeave("dialog.submit.pending"),
          target: createOrganizationMemberConfirmTarget(
            state.member,
            getOrganizationMemberRoleLabel(state.member.role, tRoles)
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
            action: () => leaveOrganizationAction(organization.slug),
            fallbackErrorMessage: tLeave("status.failed"),
            successMessage: tLeave("status.success"),
            getErrorMessage: (errorCode) =>
              errorCode === "LAST_OWNER_GUARD"
                ? tLeave("status.lastOwnerGuard")
                : tLeave("status.failed"),
            onSuccess: (response) =>
              applyOrganizationNavigationPatch(response.data?.navigationPatch),
          },
        };
      case "remove-member":
        return {
          title: t("dialogs.removeMember.title"),
          description: t("dialogs.removeMember.description", {
            organizationName: organization.name,
          }),
          submitLabel: t("dialogs.removeMember.submit.default"),
          pendingLabel: t("dialogs.removeMember.submit.pending"),
          target: createOrganizationMemberConfirmTarget(
            state.member,
            getOrganizationMemberRoleLabel(state.member.role, tRoles)
          ),
          guard: isLastOrganizationOwner(state.member.role, ownerCount)
            ? {
                title: t("dialogs.lastOwnerGuard.title"),
                description: t("dialogs.lastOwnerGuard.description"),
              }
            : undefined,
          variant: "destructive",
          disabled: isLastOrganizationOwner(state.member.role, ownerCount),
          submitOptions: {
            action: () => removeMemberAction(organization.slug, state.member.id),
            fallbackErrorMessage: t("status.memberRemove.error"),
            successMessage: t("status.memberRemove.success"),
            onSuccess: () => {
              setMembers((currentMembers) =>
                removeOrganizationSettingsMember(currentMembers, state.member.id)
              );
            },
          },
        };
      case "resend-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.resendInvite.title"),
              description: t("dialogs.resendInvite.description", {
                organizationName: organization.name,
              }),
              submitLabel: t("dialogs.resendInvite.submit.default"),
              pendingLabel: t("dialogs.resendInvite.submit.pending"),
              target: createOrganizationInviteConfirmTarget(
                state.invitation,
                getOrganizationMemberRoleLabel(state.invitation.role, tRoles)
              ),
              disabled: isInviteManagementReadOnly,
              submitOptions: {
                action: () => resendInviteAction(organization.slug, state.invitation.id, locale),
                fallbackErrorMessage: t("status.inviteResend.error"),
                successMessage: t("status.inviteResend.success"),
                onSuccess: (response) => {
                  const data = response.data as {
                    inviteId: string;
                    expiresAt: string;
                    updatedAt: string;
                  };

                  setInvites((currentInvites) =>
                    updateOrganizationSettingsInvite(currentInvites, data)
                  );
                },
              },
            };
      case "remove-invitation":
        return isInviteManagementReadOnly
          ? null
          : {
              title: t("dialogs.removeInvite.title"),
              description: t("dialogs.removeInvite.description", {
                organizationName: organization.name,
              }),
              submitLabel: t("dialogs.removeInvite.submit.default"),
              pendingLabel: t("dialogs.removeInvite.submit.pending"),
              target: createOrganizationInviteConfirmTarget(
                state.invitation,
                getOrganizationMemberRoleLabel(state.invitation.role, tRoles)
              ),
              variant: "destructive",
              disabled: isInviteManagementReadOnly,
              submitOptions: {
                action: () => revokeInviteAction(organization.slug, state.invitation.id),
                fallbackErrorMessage: t("status.inviteRemove.error"),
                successMessage: t("status.inviteRemove.success"),
                onSuccess: (response) => {
                  const data = response.data as {
                    inviteId: string;
                  };

                  setInvites((currentInvites) =>
                    removeOrganizationSettingsInvite(currentInvites, data.inviteId)
                  );
                },
              },
            };
    }
  }

  async function submitManagementAction(options: OrganizationMembersActionSubmitOptions) {
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

    completeAction();
    options.onSuccess?.(response);
    toast.success(options.successMessage);
  }

  const confirmActionModel = confirmActionState ? getConfirmActionModel(confirmActionState) : null;

  return (
    <div className="grid gap-8">
      <OrganizationInviteMembersSettingsItem
        organization={organization}
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
                  <OrganizationMembersTable
                    rows={members}
                    currentUserId={organization.currentUserId}
                    actorRole={organization.role}
                    ownerCount={ownerCount}
                    onChangeRoleRequestAction={openChangeRoleDialog}
                    onLeaveOrganizationRequestAction={() => {
                      if (currentUserMember) {
                        openMemberConfirmDialog("leave-organization", currentUserMember);
                      }
                    }}
                    onRemoveMemberRequestAction={(member) =>
                      openMemberConfirmDialog("remove-member", member)
                    }
                  />
                </TabsContent>

                <TabsContent value="pending-invitations" className="grid gap-4">
                  {invites.length > 0 ? (
                    <OrganizationInvitationsTable
                      rows={invites}
                      isReadOnly={isInviteManagementReadOnly}
                      onResendInvitationRequestAction={(invitation) =>
                        openInviteConfirmDialog("resend-invitation", invitation)
                      }
                      onRemoveInvitationRequestAction={(invitation) =>
                        openInviteConfirmDialog("remove-invitation", invitation)
                      }
                    />
                  ) : (
                    <OrganizationPendingInvitationsEmptyState />
                  )}
                </TabsContent>
              </Tabs>
            </SettingsItemContentBody>
          </SettingsItemContent>
        </SettingsItem>
      </div>

      <OrganizationMemberRoleDialog
        open={Boolean(changeRoleState)}
        title={t("dialogs.changeRole.title")}
        description={t("dialogs.changeRole.description", {
          memberName: changeRoleState?.member.name ?? t("dialogs.common.thisMember"),
          organizationName: organization.name,
        })}
        cancelLabel={tCommon("cancel")}
        submitLabel={t("dialogs.changeRole.submit.default")}
        pendingLabel={t("dialogs.changeRole.submit.pending")}
        guardTitle={t("dialogs.lastOwnerGuard.title")}
        guardDescription={t("dialogs.lastOwnerGuard.description")}
        roleFieldIdPrefix={
          changeRoleState ? `organization-member-role-${changeRoleState.member.id}` : null
        }
        roleOptions={roleDialogOptions}
        selectedRole={changeRoleState?.selectedRole ?? null}
        isSubmitting={isActionSubmitting}
        isTargetLastOwner={isChangeRoleTargetLastOwner}
        onOpenChange={handleActionDialogOpenChange}
        onRoleChange={handleChangeRoleSelection}
        onConfirm={handleChangeRoleConfirm}
      />

      <OrganizationConfirmActionDialog
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

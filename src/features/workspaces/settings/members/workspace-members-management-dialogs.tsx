"use client";

import { useTranslations } from "next-intl";
import { LogOutIcon } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import type {
  WorkspaceMemberRoleDescriptionKey,
  WorkspaceMemberRoleLabelKey,
} from "@/features/workspaces/workspace-role-options";
import type { WorkspaceMemberRole } from "@/features/workspaces/workspace-role-rules";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
} from "@/features/workspaces/settings/workspace-settings-types";
import { WorkspaceInvitationSummaryRow } from "@/features/workspaces/settings/members/workspace-invitations-table";
import { WorkspaceMemberSummaryRow } from "@/features/workspaces/settings/members/workspace-members-table";

export function WorkspaceMembersManagementDialogs({
  workspaceName,
  changeRoleMember,
  leaveWorkspaceTarget,
  removeMemberTarget,
  resendInvitationTarget,
  removeInvitationTarget,
  isActionSubmitting,
  isCurrentUserLastOwner,
  isChangeRoleTargetLastOwner,
  isRemoveMemberTargetLastOwner,
  selectedRole,
  roleOptions,
  onActionDialogOpenChange,
  onChangeRoleSelection,
  onChangeRoleConfirm,
  onLeaveWorkspaceConfirm,
  onRemoveMemberConfirm,
  onResendInvitationConfirm,
  onRemoveInvitationConfirm,
}: {
  workspaceName: string;
  changeRoleMember: WorkspaceSettingsMember | null;
  leaveWorkspaceTarget: WorkspaceSettingsMember | null;
  removeMemberTarget: WorkspaceSettingsMember | null;
  resendInvitationTarget: WorkspaceSettingsInvite | null;
  removeInvitationTarget: WorkspaceSettingsInvite | null;
  isActionSubmitting: boolean;
  isCurrentUserLastOwner: boolean;
  isChangeRoleTargetLastOwner: boolean;
  isRemoveMemberTargetLastOwner: boolean;
  selectedRole: WorkspaceMemberRole | undefined;
  roleOptions: Array<{
    value: WorkspaceMemberRole;
    labelKey: WorkspaceMemberRoleLabelKey;
    descriptionKey: WorkspaceMemberRoleDescriptionKey;
  }>;
  onActionDialogOpenChange: (open: boolean) => void;
  onChangeRoleSelection: (value: string) => void;
  onChangeRoleConfirm: () => void;
  onLeaveWorkspaceConfirm: () => void;
  onRemoveMemberConfirm: () => void;
  onResendInvitationConfirm: () => void;
  onRemoveInvitationConfirm: () => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");
  const tCommon = useTranslations("pages.workspace.common");
  const tLeave = useTranslations("pages.workspace.general.leave");

  return (
    <>
      <AlertDialog open={Boolean(changeRoleMember)} onOpenChange={onActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.changeRole.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.changeRole.description", {
                memberName: changeRoleMember?.name ?? t("dialogs.common.thisMember"),
                workspaceName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {changeRoleMember ? (
            <RadioGroup value={selectedRole} onValueChange={onChangeRoleSelection}>
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
          ) : null}

          {isChangeRoleTargetLastOwner ? (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
            </Alert>
          ) : null}

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
                (isChangeRoleTargetLastOwner && selectedRole !== "owner")
              }
              onClick={onChangeRoleConfirm}
            >
              {isActionSubmitting ? <Spinner /> : null}
              {isActionSubmitting
                ? t("dialogs.changeRole.submit.pending")
                : t("dialogs.changeRole.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(leaveWorkspaceTarget)} onOpenChange={onActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{tLeave("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>{tLeave("dialog.description")}</AlertDialogDescription>
          </AlertDialogHeader>

          {leaveWorkspaceTarget ? (
            <WorkspaceMemberSummaryRow member={leaveWorkspaceTarget} />
          ) : null}

          {isCurrentUserLastOwner ? (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{tLeave("ownerGuardHint")}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !leaveWorkspaceTarget || isCurrentUserLastOwner}
              onClick={onLeaveWorkspaceConfirm}
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

      <AlertDialog open={Boolean(removeMemberTarget)} onOpenChange={onActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeMember.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeMember.description", {
                workspaceName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeMemberTarget ? <WorkspaceMemberSummaryRow member={removeMemberTarget} /> : null}

          {isRemoveMemberTargetLastOwner ? (
            <Alert>
              <AlertTitle>{t("dialogs.lastOwnerGuard.title")}</AlertTitle>
              <AlertDescription>{t("dialogs.lastOwnerGuard.description")}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeMemberTarget || isRemoveMemberTargetLastOwner}
              onClick={onRemoveMemberConfirm}
            >
              {isActionSubmitting ? <Spinner /> : null}
              {isActionSubmitting
                ? t("dialogs.removeMember.submit.pending")
                : t("dialogs.removeMember.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(resendInvitationTarget)} onOpenChange={onActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.resendInvite.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.resendInvite.description", {
                workspaceName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {resendInvitationTarget ? (
            <WorkspaceInvitationSummaryRow invitation={resendInvitationTarget} />
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              disabled={isActionSubmitting || !resendInvitationTarget}
              onClick={onResendInvitationConfirm}
            >
              {isActionSubmitting ? <Spinner /> : null}
              {isActionSubmitting
                ? t("dialogs.resendInvite.submit.pending")
                : t("dialogs.resendInvite.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeInvitationTarget)} onOpenChange={onActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogs.removeInvite.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogs.removeInvite.description", {
                workspaceName,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeInvitationTarget ? (
            <WorkspaceInvitationSummaryRow invitation={removeInvitationTarget} />
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeInvitationTarget}
              onClick={onRemoveInvitationConfirm}
            >
              {isActionSubmitting ? <Spinner /> : null}
              {isActionSubmitting
                ? t("dialogs.removeInvite.submit.pending")
                : t("dialogs.removeInvite.submit.default")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

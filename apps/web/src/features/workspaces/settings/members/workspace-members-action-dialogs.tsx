"use client";

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
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
} from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceMemberRole } from "@/features/workspaces/workspace-role-rules";
import type { WorkspaceNavigationPatch } from "@/features/workspaces/workspace-navigation-types";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";

export type WorkspaceMembersActionSubmitResponse =
  | {
      ok: true;
      data: object & {
        navigationPatch?: WorkspaceNavigationPatch;
      };
    }
  | {
      ok: false;
      errorCode: string;
    };

export type WorkspaceMembersActionSubmitOptions = {
  action: () => Promise<WorkspaceMembersActionSubmitResponse>;
  fallbackErrorMessage: string;
  successMessage: string;
  refresh?: boolean;
  getErrorMessage?: (errorCode: string) => string;
  onSuccess?: (response: Extract<WorkspaceMembersActionSubmitResponse, { ok: true }>) => void;
};

export type WorkspaceMemberRoleDialogOption = {
  value: WorkspaceMemberRole;
  label: string;
};

export type WorkspaceConfirmActionTarget =
  | {
      type: "member";
      displayName: string;
      email: string;
      userId: string;
      avatarUrl: string | null;
      roleLabel: string;
    }
  | {
      type: "invite";
      email: string;
      roleLabel: string;
    };

export type WorkspaceConfirmActionModel = {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  target: WorkspaceConfirmActionTarget;
  guard?: {
    title: string;
    description: string;
  };
  variant?: "destructive";
  disabled?: boolean;
  submitOptions: WorkspaceMembersActionSubmitOptions;
};

export function createWorkspaceMemberConfirmTarget(
  member: WorkspaceSettingsMember,
  roleLabel: string
): WorkspaceConfirmActionTarget {
  return {
    type: "member",
    displayName: member.name ?? member.email,
    email: member.email,
    userId: member.userId,
    avatarUrl: member.avatarUrl,
    roleLabel,
  };
}

export function createWorkspaceInviteConfirmTarget(
  invitation: WorkspaceSettingsInvite,
  roleLabel: string
): WorkspaceConfirmActionTarget {
  return {
    type: "invite",
    email: invitation.emailNormalized,
    roleLabel,
  };
}

export function WorkspaceMemberRoleDialog({
  open,
  title,
  description,
  cancelLabel,
  submitLabel,
  pendingLabel,
  guardTitle,
  guardDescription,
  roleFieldIdPrefix,
  roleOptions,
  selectedRole,
  isSubmitting,
  isTargetLastOwner,
  onOpenChange,
  onRoleChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  submitLabel: string;
  pendingLabel: string;
  guardTitle: string;
  guardDescription: string;
  roleFieldIdPrefix: string | null;
  roleOptions: WorkspaceMemberRoleDialogOption[];
  selectedRole: WorkspaceMemberRole | null;
  isSubmitting: boolean;
  isTargetLastOwner: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleChange: (role: string) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {selectedRole && roleFieldIdPrefix && (
          <RadioGroup value={selectedRole} onValueChange={onRoleChange}>
            {roleOptions.map((option) => (
              <FieldLabel key={option.value} htmlFor={`${roleFieldIdPrefix}-${option.value}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{option.label}</FieldTitle>
                  </FieldContent>
                  <RadioGroupItem
                    id={`${roleFieldIdPrefix}-${option.value}`}
                    value={option.value}
                    disabled={isSubmitting || (isTargetLastOwner && option.value !== "owner")}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        )}

        {isTargetLastOwner && (
          <Alert>
            <AlertTitle>{guardTitle}</AlertTitle>
            <AlertDescription>{guardDescription}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isSubmitting}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            size="lg"
            disabled={
              isSubmitting || !selectedRole || (isTargetLastOwner && selectedRole !== "owner")
            }
            onClick={onConfirm}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? pendingLabel : submitLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function WorkspaceConfirmActionDialog({
  open,
  model,
  cancelLabel,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  model: WorkspaceConfirmActionModel | null;
  cancelLabel: string;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{model?.title}</AlertDialogTitle>
          <AlertDialogDescription>{model?.description}</AlertDialogDescription>
        </AlertDialogHeader>

        {model && <WorkspaceActionSummary target={model.target} />}
        {model?.guard && (
          <Alert>
            <AlertTitle>{model.guard.title}</AlertTitle>
            <AlertDescription>{model.guard.description}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel size="lg" disabled={isSubmitting}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            size="lg"
            variant={model?.variant}
            disabled={isSubmitting || Boolean(model?.disabled)}
            onClick={onConfirm}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? model?.pendingLabel : model?.submitLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function WorkspaceActionSummary({ target }: { target: WorkspaceConfirmActionTarget }) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      {target.type === "member" ? (
        <WorkspaceMemberSummary target={target} />
      ) : (
        <span className="text-sm font-medium">{target.email}</span>
      )}
      <span className="text-muted-foreground shrink-0 text-sm">{target.roleLabel}</span>
    </div>
  );
}

function WorkspaceMemberSummary({
  target,
}: {
  target: Extract<WorkspaceConfirmActionTarget, { type: "member" }>;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar>
        {target.avatarUrl && <AvatarImage src={target.avatarUrl} alt="" />}
        <AvatarFallback className={getAvatarColorClass(target.userId)}>
          {getUserInitials(target.displayName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium">{target.displayName}</p>
        <p className="text-muted-foreground truncate text-xs">{target.email}</p>
      </div>
    </div>
  );
}

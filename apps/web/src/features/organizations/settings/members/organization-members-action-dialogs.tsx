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
  OrganizationSettingsInvite,
  OrganizationSettingsMember,
} from "@/features/organizations/settings/organization-settings-types";
import type { OrganizationMemberRole } from "@/features/organizations/organization-role-rules";
import type { OrganizationNavigationPatch } from "@/features/organizations/organization-navigation-types";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";

export type OrganizationMembersActionSubmitResponse =
  | {
      ok: true;
      data: object & {
        navigationPatch?: OrganizationNavigationPatch;
      };
    }
  | {
      ok: false;
      errorCode: string;
    };

export type OrganizationMembersActionSubmitOptions = {
  action: () => Promise<OrganizationMembersActionSubmitResponse>;
  fallbackErrorMessage: string;
  successMessage: string;
  getErrorMessage?: (errorCode: string) => string;
  onSuccess?: (response: Extract<OrganizationMembersActionSubmitResponse, { ok: true }>) => void;
};

export type OrganizationMemberRoleDialogOption = {
  value: OrganizationMemberRole;
  label: string;
};

export type OrganizationConfirmActionTarget =
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

export type OrganizationConfirmActionModel = {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  target: OrganizationConfirmActionTarget;
  guard?: {
    title: string;
    description: string;
  };
  variant?: "destructive";
  disabled?: boolean;
  submitOptions: OrganizationMembersActionSubmitOptions;
};

export function createOrganizationMemberConfirmTarget(
  member: OrganizationSettingsMember,
  roleLabel: string
): OrganizationConfirmActionTarget {
  return {
    type: "member",
    displayName: member.name ?? member.email,
    email: member.email,
    userId: member.userId,
    avatarUrl: member.avatarUrl,
    roleLabel,
  };
}

export function createOrganizationInviteConfirmTarget(
  invitation: OrganizationSettingsInvite,
  roleLabel: string
): OrganizationConfirmActionTarget {
  return {
    type: "invite",
    email: invitation.emailNormalized,
    roleLabel,
  };
}

export function OrganizationMemberRoleDialog({
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
  roleOptions: OrganizationMemberRoleDialogOption[];
  selectedRole: OrganizationMemberRole | null;
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

export function OrganizationConfirmActionDialog({
  open,
  model,
  cancelLabel,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  model: OrganizationConfirmActionModel | null;
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

        {model && <OrganizationActionSummary target={model.target} />}
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

function OrganizationActionSummary({ target }: { target: OrganizationConfirmActionTarget }) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      {target.type === "member" ? (
        <OrganizationMemberSummary target={target} />
      ) : (
        <span className="text-sm font-medium">{target.email}</span>
      )}
      <span className="text-muted-foreground shrink-0 text-sm">{target.roleLabel}</span>
    </div>
  );
}

function OrganizationMemberSummary({
  target,
}: {
  target: Extract<OrganizationConfirmActionTarget, { type: "member" }>;
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

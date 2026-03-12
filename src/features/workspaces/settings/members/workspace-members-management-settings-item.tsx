"use client";

import { useState } from "react";
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
import { getUserInitials } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  currentUserId,
}: {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
  invites: WorkspaceSettingsInvite[];
  currentUserId: string;
}) {
  const [membersState, setMembersState] = useState<WorkspaceSettingsMember[]>(members);
  const [invitesState, setInvitesState] = useState<WorkspaceSettingsInvite[]>(invites);
  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const ownerCount = membersState.filter((member) => member.role === "owner").length;

  const hasPendingInvitations = invitesState.length > 0;
  const changeRoleMember =
    actionState?.type === "change-role"
      ? (membersState.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const removeMemberTarget =
    actionState?.type === "remove-member"
      ? (membersState.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const resendInvitationTarget =
    actionState?.type === "resend-invitation"
      ? (invitesState.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const removeInvitationTarget =
    actionState?.type === "remove-invitation"
      ? (invitesState.find((invitation) => invitation.id === actionState.invitationId) ?? null)
      : null;
  const isChangeRoleTargetLastOwner = changeRoleMember
    ? isLastOwnerMember(changeRoleMember, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner = removeMemberTarget
    ? isLastOwnerMember(removeMemberTarget, ownerCount)
    : false;

  function handleChangeRoleRequest(member: WorkspaceSettingsMember) {
    setActionState({
      type: "change-role",
      memberId: member.id,
      selectedRole: member.role,
    });
  }

  function handleRemoveMemberRequest(member: WorkspaceSettingsMember) {
    if (isLastOwnerMember(member, ownerCount)) {
      return;
    }

    setActionState({
      type: "remove-member",
      memberId: member.id,
    });
  }

  function handleResendInvitationRequest(invitation: WorkspaceSettingsInvite) {
    setActionState({
      type: "resend-invitation",
      invitationId: invitation.id,
    });
  }

  function handleRemoveInvitationRequest(invitation: WorkspaceSettingsInvite) {
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
      toast.error("Last owner cannot be downgraded.");
      return;
    }

    setIsActionSubmitting(true);

    const nextRole = actionState.selectedRole;
    let actionResponse;

    if (nextRole === "owner" && changeRoleMember.role !== "owner") {
      actionResponse = await transferOwnershipAction(workspace.slug, changeRoleMember.id);
    } else {
      actionResponse = await changeMemberRoleAction(workspace.slug, changeRoleMember.id, nextRole);
    }

    if (!actionResponse.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(actionResponse.errorCode, "Role could not be changed."));
      return;
    }

    if (nextRole === "owner" && changeRoleMember.role !== "owner") {
      setMembersState((currentMembers) =>
        currentMembers.map((member) => {
          if (member.id === changeRoleMember.id) {
            return {
              ...member,
              role: "owner",
            };
          }

          if (member.userId === currentUserId && member.role === "owner") {
            return {
              ...member,
              role: "member",
            };
          }

          return member;
        })
      );
    } else {
      setMembersState((currentMembers) =>
        currentMembers.map((member) => {
          if (member.id !== changeRoleMember.id) {
            return member;
          }

          return {
            ...member,
            role: nextRole,
          };
        })
      );
    }

    setIsActionSubmitting(false);
    setActionState(null);
    toast.success("Role updated.");
  }

  async function handleRemoveMemberConfirm() {
    if (!removeMemberTarget) {
      return;
    }

    if (isRemoveMemberTargetLastOwner) {
      toast.error("Last owner cannot be removed.");
      return;
    }

    setIsActionSubmitting(true);

    const response = await removeMemberAction(workspace.slug, removeMemberTarget.id);

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, "Member could not be removed."));
      return;
    }

    setMembersState((currentMembers) =>
      currentMembers.filter((member) => member.id !== removeMemberTarget.id)
    );
    setIsActionSubmitting(false);
    setActionState(null);
    toast.success("Member removed.");
  }

  async function handleResendInvitationConfirm() {
    if (!resendInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await resendInviteAction(workspace.slug, resendInvitationTarget.id);

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, "Invite could not be resent."));
      return;
    }

    setIsActionSubmitting(false);
    setActionState(null);
    toast.success("Invite link resent.");
  }

  async function handleRemoveInvitationConfirm() {
    if (!removeInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);
    const response = await revokeInviteAction(workspace.slug, removeInvitationTarget.id);

    if (!response.ok) {
      setIsActionSubmitting(false);
      toast.error(getActionErrorMessage(response.errorCode, "Invitation could not be removed."));
      return;
    }

    setInvitesState((currentInvitations) =>
      currentInvitations.filter((invitation) => invitation.id !== removeInvitationTarget.id)
    );
    setIsActionSubmitting(false);
    setActionState(null);
    toast.success("Invitation removed.");
  }

  return (
    <div className="pt-6">
      <div className="flex flex-col gap-6">
        <SettingsItemContentHeader>
          <SettingsItemTitle>Members and invitations</SettingsItemTitle>
          <SettingsItemDescription>
            Review current members and pending invitations.
          </SettingsItemDescription>
        </SettingsItemContentHeader>

        <SettingsItemContentBody className="@container/members-management grid gap-4">
          <Tabs defaultValue="members" className="flex-col gap-4">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="pending-invitations">Pending invitations</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="grid gap-4">
              <div className="hidden @lg/members-management:block">
                <MembersTable
                  rows={membersState}
                  ownerCount={ownerCount}
                  onChangeRoleRequest={handleChangeRoleRequest}
                  onRemoveMemberRequest={handleRemoveMemberRequest}
                />
              </div>
              <div className="grid gap-3 @lg/members-management:hidden">
                {membersState.map((member) => (
                  <MemberDescriptionRow
                    key={member.id}
                    member={member}
                    ownerCount={ownerCount}
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
                      rows={invitesState}
                      onResendInvitationRequest={handleResendInvitationRequest}
                      onRemoveInvitationRequest={handleRemoveInvitationRequest}
                    />
                  </div>
                  <div className="grid gap-3 @lg/members-management:hidden">
                    {invitesState.map((invitation) => (
                      <PendingInvitationDescriptionRow
                        key={invitation.id}
                        invitation={invitation}
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
      </div>

      <AlertDialog open={Boolean(changeRoleMember)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Change member role?</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new role for <strong>{changeRoleMember?.name ?? "this member"}</strong> in{" "}
              <strong>{workspace.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {changeRoleMember && (
            <RadioGroup
              value={actionState?.type === "change-role" ? actionState.selectedRole : undefined}
              onValueChange={handleChangeRoleSelection}
            >
              {WORKSPACE_MEMBER_ROLE_OPTIONS.map((option) => (
                <FieldLabel
                  key={option.value}
                  htmlFor={`workspace-member-role-${changeRoleMember.id}-${option.value}`}
                >
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.label}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
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
              <AlertTitle>Last owner protection</AlertTitle>
              <AlertDescription>
                This member is the last owner of this workspace. Promote another member to owner
                before downgrading.
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              Cancel
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
              {isActionSubmitting ? "Saving..." : "Save role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(removeMemberTarget)} onOpenChange={handleActionDialogOpenChange}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member from workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately revoke access to <strong>{workspace.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeMemberTarget && <MemberSummaryRow member={removeMemberTarget} />}

          {isRemoveMemberTargetLastOwner && (
            <Alert>
              <AlertTitle>
                This member is the last owner. Add another owner before removing this member.
              </AlertTitle>
              <AlertDescription>
                This member is the last owner. Add another owner before removing this member.
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeMemberTarget || isRemoveMemberTargetLastOwner}
              onClick={handleRemoveMemberConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting ? "Removing..." : "Remove member"}
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
            <AlertDialogTitle>Resend invitation link?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a new invitation link for <strong>{workspace.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {resendInvitationTarget && <InvitationSummaryRow invitation={resendInvitationTarget} />}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              disabled={isActionSubmitting || !resendInvitationTarget}
              onClick={handleResendInvitationConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting ? "Resending..." : "Resend invite link"}
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
            <AlertDialogTitle>Remove invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the invite token and remove this pending invitation from{" "}
              <strong>{workspace.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {removeInvitationTarget && <InvitationSummaryRow invitation={removeInvitationTarget} />}

          <AlertDialogFooter>
            <AlertDialogCancel size="lg" disabled={isActionSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              size="lg"
              variant="destructive"
              disabled={isActionSubmitting || !removeInvitationTarget}
              onClick={handleRemoveInvitationConfirm}
            >
              {isActionSubmitting && <Spinner />}
              {isActionSubmitting ? "Removing..." : "Remove invitation"}
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

function getActionErrorMessage(errorCode: string, fallbackMessage: string): string {
  if (errorCode === "LAST_OWNER_GUARD") {
    return "Last owner cannot be changed or removed.";
  }

  if (errorCode === "RATE_LIMITED") {
    return "Please wait before trying again.";
  }

  if (errorCode === "FORBIDDEN") {
    return "You do not have permission to do this.";
  }

  if (errorCode === "NOT_FOUND") {
    return "Item was not found.";
  }

  return fallbackMessage;
}

function MembersTable({
  rows,
  ownerCount,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  rows: WorkspaceSettingsMember[];
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="min-w-72">
              <MemberIdentityCell member={member} />
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(member.role)}</TableCell>
            <TableCell className="text-right">
              <MembersActionMenu
                member={member}
                isLastOwner={isLastOwnerMember(member, ownerCount)}
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
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  rows: WorkspaceSettingsInvite[];
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="min-w-72">
              <p className="text-sm font-medium">{invitation.emailNormalized}</p>
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(invitation.role)}</TableCell>
            <TableCell className="text-right">
              <PendingInvitationActionMenu
                invitation={invitation}
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
  ownerCount,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>User</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell member={member} />
        </DescriptionDetails>

        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails>{getWorkspaceMemberRoleLabel(member.role)}</DescriptionDetails>

        <DescriptionTerm>Actions</DescriptionTerm>
        <DescriptionDetails>
          <MembersActionMenu
            member={member}
            isLastOwner={isLastOwnerMember(member, ownerCount)}
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
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>Email</DescriptionTerm>
        <DescriptionDetails>
          <span className="text-sm font-medium">{invitation.emailNormalized}</span>
        </DescriptionDetails>

        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails>{getWorkspaceMemberRoleLabel(invitation.role)}</DescriptionDetails>

        <DescriptionTerm>Actions</DescriptionTerm>
        <DescriptionDetails>
          <PendingInvitationActionMenu
            invitation={invitation}
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
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <MemberIdentityCell member={member} />
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(member.role)}
      </span>
    </div>
  );
}

function InvitationSummaryRow({ invitation }: { invitation: WorkspaceSettingsInvite }) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm font-medium">{invitation.emailNormalized}</span>
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(invitation.role)}
      </span>
    </div>
  );
}

function MembersActionMenu({
  member,
  isLastOwner,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  isLastOwner: boolean;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button type="button" variant="ghost" size="icon" aria-label="Open member actions">
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem onClick={() => onChangeRoleRequest(member)}>
          <PencilLineIcon aria-hidden="true" /> Change role
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveMemberRequest(member)}
          variant="destructive"
          disabled={isLastOwner}
        >
          <TrashIcon aria-hidden="true" /> Remove from workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitationActionMenu({
  invitation,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button type="button" variant="ghost" size="icon" aria-label="Open invitation actions">
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem onClick={() => onResendInvitationRequest(invitation)}>
          <SendIcon aria-hidden="true" /> Resend invite link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveInvitationRequest(invitation)}
          variant="destructive"
        >
          <TrashIcon aria-hidden="true" /> Remove invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitationsEmptyState() {
  return (
    <Empty className="bg-background border-border rounded-xl border py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>No pending invitations</EmptyTitle>
        <EmptyDescription>All invitations are accepted or expired.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

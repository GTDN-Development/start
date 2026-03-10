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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import {
  WORKSPACE_MEMBER_ROLE_OPTIONS,
  getWorkspaceMemberRoleLabel,
  isWorkspaceMemberRole,
  type WorkspaceInvitableRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/settings/members/workspace-member-roles";
import { WORKSPACE_SETTINGS_PREVIEW } from "@/features/workspaces/settings/workspace-settings-preview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInitials } from "@/lib/utils";

type WorkspaceMemberRow = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceMemberRole;
};

type PendingInvitationRow = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceInvitableRole;
};

function isLastOwnerMember(member: WorkspaceMemberRow, ownerCount: number): boolean {
  return member.role === "owner" && ownerCount === 1;
}

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

const DEFAULT_WORKSPACE_MEMBERS: WorkspaceMemberRow[] = [
  {
    id: "member-1",
    name: "Anna Novak",
    email: "anna@acme.studio",
    role: "owner",
  },
  {
    id: "member-2",
    name: "Martin Dvorak",
    email: "martin@acme.studio",
    role: "member",
  },
  {
    id: "member-3",
    name: "Eva Svobodova",
    email: "eva@acme.studio",
    role: "member",
  },
];

const DEFAULT_PENDING_INVITATIONS: PendingInvitationRow[] = [
  {
    id: "invite-1",
    name: "Petr Kral",
    email: "petr@partner.io",
    role: "member",
  },
  {
    id: "invite-2",
    name: "Jana Prochazkova",
    email: "jana@partner.io",
    role: "member",
  },
];

export function WorkspaceMembersManagementSettingsItem() {
  const [members, setMembers] = useState<WorkspaceMemberRow[]>(DEFAULT_WORKSPACE_MEMBERS);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitationRow[]>(
    DEFAULT_PENDING_INVITATIONS
  );
  const [actionState, setActionState] = useState<ManagementActionState>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const ownerCount = members.filter((member) => member.role === "owner").length;

  const hasPendingInvitations = pendingInvitations.length > 0;
  const changeRoleMember =
    actionState?.type === "change-role"
      ? (members.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const removeMemberTarget =
    actionState?.type === "remove-member"
      ? (members.find((member) => member.id === actionState.memberId) ?? null)
      : null;
  const resendInvitationTarget =
    actionState?.type === "resend-invitation"
      ? (pendingInvitations.find((invitation) => invitation.id === actionState.invitationId) ??
        null)
      : null;
  const removeInvitationTarget =
    actionState?.type === "remove-invitation"
      ? (pendingInvitations.find((invitation) => invitation.id === actionState.invitationId) ??
        null)
      : null;
  const isChangeRoleTargetLastOwner = changeRoleMember
    ? isLastOwnerMember(changeRoleMember, ownerCount)
    : false;
  const isRemoveMemberTargetLastOwner = removeMemberTarget
    ? isLastOwnerMember(removeMemberTarget, ownerCount)
    : false;

  function handleChangeRoleRequest(member: WorkspaceMemberRow) {
    setActionState({
      type: "change-role",
      memberId: member.id,
      selectedRole: member.role,
    });
  }

  function handleRemoveMemberRequest(member: WorkspaceMemberRow) {
    if (isLastOwnerMember(member, ownerCount)) {
      return;
    }

    setActionState({
      type: "remove-member",
      memberId: member.id,
    });
  }

  function handleResendInvitationRequest(invitation: PendingInvitationRow) {
    setActionState({
      type: "resend-invitation",
      invitationId: invitation.id,
    });
  }

  function handleRemoveInvitationRequest(invitation: PendingInvitationRow) {
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

    await Promise.resolve();

    const nextRole = actionState.selectedRole;

    setMembers((currentMembers) =>
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

    await Promise.resolve();

    setMembers((currentMembers) =>
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

    await Promise.resolve();

    setIsActionSubmitting(false);
    setActionState(null);
    toast.success("Invite link resent.");
  }

  async function handleRemoveInvitationConfirm() {
    if (!removeInvitationTarget) {
      return;
    }

    setIsActionSubmitting(true);

    await Promise.resolve();

    setPendingInvitations((currentInvitations) =>
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
          <StaticPlaceholder />
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
                  rows={members}
                  ownerCount={ownerCount}
                  onChangeRoleRequest={handleChangeRoleRequest}
                  onRemoveMemberRequest={handleRemoveMemberRequest}
                />
              </div>
              <div className="grid gap-3 @lg/members-management:hidden">
                {members.map((member) => (
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
                      rows={pendingInvitations}
                      onResendInvitationRequest={handleResendInvitationRequest}
                      onRemoveInvitationRequest={handleRemoveInvitationRequest}
                    />
                  </div>
                  <div className="grid gap-3 @lg/members-management:hidden">
                    {pendingInvitations.map((invitation) => (
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
              <strong>{WORKSPACE_SETTINGS_PREVIEW.name}</strong>.
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
              This will immediately revoke access to{" "}
              <strong>{WORKSPACE_SETTINGS_PREVIEW.name}</strong>.
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
              This will send a new invitation link for{" "}
              <strong>{WORKSPACE_SETTINGS_PREVIEW.name}</strong>.
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
              <strong>{WORKSPACE_SETTINGS_PREVIEW.name}</strong>.
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

function MembersTable({
  rows,
  ownerCount,
  onChangeRoleRequest,
  onRemoveMemberRequest,
}: {
  rows: WorkspaceMemberRow[];
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceMemberRow) => void;
  onRemoveMemberRequest: (member: WorkspaceMemberRow) => void;
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
              <MemberIdentityCell name={member.name} email={member.email} />
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
  rows: PendingInvitationRow[];
  onResendInvitationRequest: (invitation: PendingInvitationRow) => void;
  onRemoveInvitationRequest: (invitation: PendingInvitationRow) => void;
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
        {rows.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="min-w-72">
              <MemberIdentityCell name={invitation.name} email={invitation.email} />
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
  member: WorkspaceMemberRow;
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceMemberRow) => void;
  onRemoveMemberRequest: (member: WorkspaceMemberRow) => void;
}) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>User</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell name={member.name} email={member.email} />
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
  invitation: PendingInvitationRow;
  onResendInvitationRequest: (invitation: PendingInvitationRow) => void;
  onRemoveInvitationRequest: (invitation: PendingInvitationRow) => void;
}) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>User</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell name={invitation.name} email={invitation.email} />
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

function MemberIdentityCell({ name, email }: { name: string; email: string }) {
  const initials = getUserInitials(name || email);

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-muted-foreground truncate text-xs">{email}</p>
      </div>
    </div>
  );
}

function MemberSummaryRow({ member }: { member: WorkspaceMemberRow }) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <MemberIdentityCell name={member.name} email={member.email} />
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(member.role)}
      </span>
    </div>
  );
}

function InvitationSummaryRow({ invitation }: { invitation: PendingInvitationRow }) {
  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm font-medium">{invitation.email}</span>
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
  member: WorkspaceMemberRow;
  isLastOwner: boolean;
  onChangeRoleRequest: (member: WorkspaceMemberRow) => void;
  onRemoveMemberRequest: (member: WorkspaceMemberRow) => void;
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
  invitation: PendingInvitationRow;
  onResendInvitationRequest: (invitation: PendingInvitationRow) => void;
  onRemoveInvitationRequest: (invitation: PendingInvitationRow) => void;
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

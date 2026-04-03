"use client";

import { useTranslations } from "next-intl";
import {
  LogOutIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  TrashIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "@/components/ui/description-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  canManageWorkspaceMemberRole,
  getWorkspaceMemberRoleLabel,
  isLastWorkspaceOwner,
} from "@/features/workspaces/workspace-roles";
import type {
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";

export function WorkspaceMembersTable({
  rows,
  currentUserId,
  actorRole,
  ownerCount,
  onChangeRoleRequest,
  onLeaveWorkspaceRequest,
  onRemoveMemberRequest,
}: {
  rows: WorkspaceSettingsMember[];
  currentUserId: string;
  actorRole: WorkspaceSettingsWorkspace["role"];
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onLeaveWorkspaceRequest: () => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  return (
    <>
      <div className="hidden @lg/members-management:block">
        <WorkspaceMembersDataTable
          rows={rows}
          currentUserId={currentUserId}
          actorRole={actorRole}
          ownerCount={ownerCount}
          onChangeRoleRequest={onChangeRoleRequest}
          onLeaveWorkspaceRequest={onLeaveWorkspaceRequest}
          onRemoveMemberRequest={onRemoveMemberRequest}
        />
      </div>
      <div className="grid gap-3 @lg/members-management:hidden">
        {rows.map((member) => (
          <WorkspaceMemberDescriptionRow
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            actorRole={actorRole}
            ownerCount={ownerCount}
            onChangeRoleRequest={onChangeRoleRequest}
            onLeaveWorkspaceRequest={onLeaveWorkspaceRequest}
            onRemoveMemberRequest={onRemoveMemberRequest}
          />
        ))}
      </div>
    </>
  );
}

export function WorkspaceMemberSummaryRow({ member }: { member: WorkspaceSettingsMember }) {
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <WorkspaceMemberIdentityCell member={member} />
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(member.role, tRoles)}
      </span>
    </div>
  );
}

function WorkspaceMembersDataTable({
  rows,
  currentUserId,
  actorRole,
  ownerCount,
  onChangeRoleRequest,
  onLeaveWorkspaceRequest,
  onRemoveMemberRequest,
}: {
  rows: WorkspaceSettingsMember[];
  currentUserId: string;
  actorRole: WorkspaceSettingsWorkspace["role"];
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onLeaveWorkspaceRequest: () => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.members.user")}</TableHead>
          <TableHead>{t("table.members.role")}</TableHead>
          <TableHead className="text-right">{t("table.members.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="min-w-72">
              <WorkspaceMemberIdentityCell member={member} />
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(member.role, tRoles)}</TableCell>
            <TableCell className="text-right">
              <WorkspaceMembersActionMenu
                member={member}
                currentUserId={currentUserId}
                isChangeRoleDisabled={!canManageWorkspaceMemberRole(actorRole, member.role)}
                isRemoveDisabled={
                  !canManageWorkspaceMemberRole(actorRole, member.role) ||
                  isLastWorkspaceOwner(member.role, ownerCount)
                }
                onChangeRoleRequest={onChangeRoleRequest}
                onLeaveWorkspaceRequest={onLeaveWorkspaceRequest}
                onRemoveMemberRequest={onRemoveMemberRequest}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function WorkspaceMemberDescriptionRow({
  member,
  currentUserId,
  actorRole,
  ownerCount,
  onChangeRoleRequest,
  onLeaveWorkspaceRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  currentUserId: string;
  actorRole: WorkspaceSettingsWorkspace["role"];
  ownerCount: number;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onLeaveWorkspaceRequest: () => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>{t("table.members.user")}</DescriptionTerm>
        <DescriptionDetails>
          <WorkspaceMemberIdentityCell member={member} />
        </DescriptionDetails>

        <DescriptionTerm>{t("table.members.role")}</DescriptionTerm>
        <DescriptionDetails>{getWorkspaceMemberRoleLabel(member.role, tRoles)}</DescriptionDetails>

        <DescriptionTerm>{t("table.members.actions")}</DescriptionTerm>
        <DescriptionDetails>
          <WorkspaceMembersActionMenu
            member={member}
            currentUserId={currentUserId}
            isChangeRoleDisabled={!canManageWorkspaceMemberRole(actorRole, member.role)}
            isRemoveDisabled={
              !canManageWorkspaceMemberRole(actorRole, member.role) ||
              isLastWorkspaceOwner(member.role, ownerCount)
            }
            onChangeRoleRequest={onChangeRoleRequest}
            onLeaveWorkspaceRequest={onLeaveWorkspaceRequest}
            onRemoveMemberRequest={onRemoveMemberRequest}
          />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function WorkspaceMemberIdentityCell({ member }: { member: WorkspaceSettingsMember }) {
  const displayName = member.name ?? member.email;
  const initials = getUserInitials(displayName);
  const avatarColorClass = getAvatarColorClass(member.userId);

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
        <AvatarFallback className={avatarColorClass}>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">{member.email}</p>
      </div>
    </div>
  );
}

function WorkspaceMembersActionMenu({
  member,
  currentUserId,
  isChangeRoleDisabled,
  isRemoveDisabled,
  onChangeRoleRequest,
  onLeaveWorkspaceRequest,
  onRemoveMemberRequest,
}: {
  member: WorkspaceSettingsMember;
  currentUserId: string;
  isChangeRoleDisabled: boolean;
  isRemoveDisabled: boolean;
  onChangeRoleRequest: (member: WorkspaceSettingsMember) => void;
  onLeaveWorkspaceRequest: () => void;
  onRemoveMemberRequest: (member: WorkspaceSettingsMember) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const isCurrentUser = member.userId === currentUserId;
  const isActionMenuDisabled = isCurrentUser ? false : isChangeRoleDisabled && isRemoveDisabled;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("menus.members.ariaLabel")}
            disabled={isActionMenuDisabled}
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem
          onClick={() => onChangeRoleRequest(member)}
          disabled={isChangeRoleDisabled}
        >
          <PencilLineIcon aria-hidden="true" /> {t("menus.members.changeRole")}
        </DropdownMenuItem>
        {isCurrentUser ? (
          <DropdownMenuItem onClick={onLeaveWorkspaceRequest} variant="destructive">
            <LogOutIcon aria-hidden="true" /> {t("menus.members.leaveWorkspace")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onRemoveMemberRequest(member)}
            variant="destructive"
            disabled={isRemoveDisabled}
          >
            <TrashIcon aria-hidden="true" /> {t("menus.members.removeMember")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

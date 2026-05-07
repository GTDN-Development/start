"use client";

import { useTranslations } from "next-intl";
import { LogOutIcon, MoreHorizontalIcon, PencilLineIcon, TrashIcon } from "lucide-react";
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
  canManageOrganizationMemberRole,
  isLastOrganizationOwner,
} from "@/features/organizations/organization-role-rules";
import { getOrganizationMemberRoleLabel } from "@/features/organizations/organization-role-options";
import type {
  OrganizationSettingsMember,
  OrganizationSettingsOrganization,
} from "@/features/organizations/settings/organization-settings-types";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";

type OrganizationMembersTableProps = {
  rows: OrganizationSettingsMember[];
  currentUserId: string;
  actorRole: OrganizationSettingsOrganization["role"];
  ownerCount: number;
  onChangeRoleRequestAction: (member: OrganizationSettingsMember) => void;
  onLeaveOrganizationRequestAction: () => void;
  onRemoveMemberRequestAction: (member: OrganizationSettingsMember) => void;
};

type OrganizationMemberActionContext = Omit<OrganizationMembersTableProps, "rows">;

export function OrganizationMembersTable({
  rows,
  ...actionContext
}: OrganizationMembersTableProps) {
  const t = useTranslations("pages.organization.members.management");
  const tRoles = useTranslations("pages.organization.members.roles");

  return (
    <>
      <div className="hidden @lg/members-management:block">
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
                  <OrganizationMemberIdentityCell member={member} />
                </TableCell>
                <TableCell>{getOrganizationMemberRoleLabel(member.role, tRoles)}</TableCell>
                <TableCell className="text-right">
                  <OrganizationMembersActionMenu
                    {...createMemberActionMenuProps(member, actionContext)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid gap-3 @lg/members-management:hidden">
        {rows.map((member) => (
          <OrganizationMemberDescriptionRow
            key={member.id}
            member={member}
            actionContext={actionContext}
          />
        ))}
      </div>
    </>
  );
}

function OrganizationMemberDescriptionRow({
  member,
  actionContext,
}: {
  member: OrganizationSettingsMember;
  actionContext: OrganizationMemberActionContext;
}) {
  const t = useTranslations("pages.organization.members.management");
  const tRoles = useTranslations("pages.organization.members.roles");

  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>{t("table.members.user")}</DescriptionTerm>
        <DescriptionDetails>
          <OrganizationMemberIdentityCell member={member} />
        </DescriptionDetails>

        <DescriptionTerm>{t("table.members.role")}</DescriptionTerm>
        <DescriptionDetails>
          {getOrganizationMemberRoleLabel(member.role, tRoles)}
        </DescriptionDetails>

        <DescriptionTerm>{t("table.members.actions")}</DescriptionTerm>
        <DescriptionDetails>
          <OrganizationMembersActionMenu {...createMemberActionMenuProps(member, actionContext)} />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function createMemberActionMenuProps(
  member: OrganizationSettingsMember,
  context: OrganizationMemberActionContext
) {
  const isManageDisabled = !canManageOrganizationMemberRole(context.actorRole, member.role);

  return {
    member,
    currentUserId: context.currentUserId,
    isChangeRoleDisabled: isManageDisabled,
    isRemoveDisabled: isManageDisabled || isLastOrganizationOwner(member.role, context.ownerCount),
    onChangeRoleRequestAction: context.onChangeRoleRequestAction,
    onLeaveOrganizationRequestAction: context.onLeaveOrganizationRequestAction,
    onRemoveMemberRequestAction: context.onRemoveMemberRequestAction,
  };
}

function OrganizationMemberIdentityCell({ member }: { member: OrganizationSettingsMember }) {
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

function OrganizationMembersActionMenu({
  member,
  currentUserId,
  isChangeRoleDisabled,
  isRemoveDisabled,
  onChangeRoleRequestAction,
  onLeaveOrganizationRequestAction,
  onRemoveMemberRequestAction,
}: {
  member: OrganizationSettingsMember;
  currentUserId: string;
  isChangeRoleDisabled: boolean;
  isRemoveDisabled: boolean;
  onChangeRoleRequestAction: (member: OrganizationSettingsMember) => void;
  onLeaveOrganizationRequestAction: () => void;
  onRemoveMemberRequestAction: (member: OrganizationSettingsMember) => void;
}) {
  const t = useTranslations("pages.organization.members.management");
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
          onClick={() => onChangeRoleRequestAction(member)}
          disabled={isChangeRoleDisabled}
        >
          <PencilLineIcon aria-hidden="true" /> {t("menus.members.changeRole")}
        </DropdownMenuItem>
        {isCurrentUser ? (
          <DropdownMenuItem onClick={onLeaveOrganizationRequestAction} variant="destructive">
            <LogOutIcon aria-hidden="true" /> {t("menus.members.leaveOrganization")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => onRemoveMemberRequestAction(member)}
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

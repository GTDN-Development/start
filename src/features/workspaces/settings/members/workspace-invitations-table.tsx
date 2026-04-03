"use client";

import { useTranslations } from "next-intl";
import { CopyIcon, InboxIcon, MoreHorizontalIcon, SendIcon, TrashIcon } from "lucide-react";
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWorkspaceMemberRoleLabel } from "@/features/workspaces/workspace-role-options";
import type { WorkspaceSettingsInvite } from "@/features/workspaces/settings/workspace-settings-types";

export function WorkspaceInvitationsTable({
  rows,
  isReadOnly,
  onCopyInvitationLink,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  rows: WorkspaceSettingsInvite[];
  isReadOnly: boolean;
  onCopyInvitationLink: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  return (
    <>
      <div className="hidden @lg/members-management:block">
        <WorkspaceInvitationsDataTable
          rows={rows}
          isReadOnly={isReadOnly}
          onCopyInvitationLink={onCopyInvitationLink}
          onResendInvitationRequest={onResendInvitationRequest}
          onRemoveInvitationRequest={onRemoveInvitationRequest}
        />
      </div>
      <div className="grid gap-3 @lg/members-management:hidden">
        {rows.map((invitation) => (
          <WorkspaceInvitationDescriptionRow
            key={invitation.id}
            invitation={invitation}
            isReadOnly={isReadOnly}
            onCopyInvitationLink={onCopyInvitationLink}
            onResendInvitationRequest={onResendInvitationRequest}
            onRemoveInvitationRequest={onRemoveInvitationRequest}
          />
        ))}
      </div>
    </>
  );
}

export function WorkspacePendingInvitationsEmptyState() {
  const t = useTranslations("pages.workspace.members.management.empty");

  return (
    <Empty className="bg-background border-border rounded-xl border py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export function WorkspaceInvitationSummaryRow({
  invitation,
}: {
  invitation: WorkspaceSettingsInvite;
}) {
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-muted/50 flex items-center justify-between gap-3 rounded-lg px-3 py-2.5">
      <span className="text-sm font-medium">{invitation.emailNormalized}</span>
      <span className="text-muted-foreground text-sm">
        {getWorkspaceMemberRoleLabel(invitation.role, tRoles)}
      </span>
    </div>
  );
}

function WorkspaceInvitationsDataTable({
  rows,
  isReadOnly,
  onCopyInvitationLink,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  rows: WorkspaceSettingsInvite[];
  isReadOnly: boolean;
  onCopyInvitationLink: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("table.invites.email")}</TableHead>
          <TableHead>{t("table.invites.role")}</TableHead>
          <TableHead className="text-right">{t("table.invites.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((invitation) => (
          <TableRow key={invitation.id}>
            <TableCell className="min-w-72">
              <p className="text-sm font-medium">{invitation.emailNormalized}</p>
            </TableCell>
            <TableCell>{getWorkspaceMemberRoleLabel(invitation.role, tRoles)}</TableCell>
            <TableCell className="text-right">
              <WorkspaceInvitationActionMenu
                invitation={invitation}
                disabled={isReadOnly}
                onCopyInvitationLink={onCopyInvitationLink}
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

function WorkspaceInvitationDescriptionRow({
  invitation,
  isReadOnly,
  onCopyInvitationLink,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  isReadOnly: boolean;
  onCopyInvitationLink: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>{t("table.invites.email")}</DescriptionTerm>
        <DescriptionDetails>
          <span className="text-sm font-medium">{invitation.emailNormalized}</span>
        </DescriptionDetails>

        <DescriptionTerm>{t("table.invites.role")}</DescriptionTerm>
        <DescriptionDetails>
          {getWorkspaceMemberRoleLabel(invitation.role, tRoles)}
        </DescriptionDetails>

        <DescriptionTerm>{t("table.invites.actions")}</DescriptionTerm>
        <DescriptionDetails>
          <WorkspaceInvitationActionMenu
            invitation={invitation}
            disabled={isReadOnly}
            onCopyInvitationLink={onCopyInvitationLink}
            onResendInvitationRequest={onResendInvitationRequest}
            onRemoveInvitationRequest={onRemoveInvitationRequest}
          />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function WorkspaceInvitationActionMenu({
  invitation,
  disabled,
  onCopyInvitationLink,
  onResendInvitationRequest,
  onRemoveInvitationRequest,
}: {
  invitation: WorkspaceSettingsInvite;
  disabled: boolean;
  onCopyInvitationLink: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequest: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        nativeButton={true}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("menus.invites.ariaLabel")}
            disabled={disabled}
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem onClick={() => onCopyInvitationLink(invitation)} disabled={disabled}>
          <CopyIcon aria-hidden="true" /> {t("menus.invites.copyLink")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResendInvitationRequest(invitation)} disabled={disabled}>
          <SendIcon aria-hidden="true" /> {t("menus.invites.resend")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveInvitationRequest(invitation)}
          variant="destructive"
          disabled={disabled}
        >
          <TrashIcon aria-hidden="true" /> {t("menus.invites.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

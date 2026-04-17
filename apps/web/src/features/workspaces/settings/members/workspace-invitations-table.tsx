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
  onCopyInvitationLinkAction,
  onResendInvitationRequestAction,
  onRemoveInvitationRequestAction,
}: {
  rows: WorkspaceSettingsInvite[];
  isReadOnly: boolean;
  onCopyInvitationLinkAction: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequestAction: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequestAction: (invitation: WorkspaceSettingsInvite) => void;
}) {
  const t = useTranslations("pages.workspace.members.management");
  const tRoles = useTranslations("pages.workspace.members.roles");

  return (
    <>
      <div className="hidden @lg/members-management:block">
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
                  <WorkspaceInvitationActionsMenu
                    invitation={invitation}
                    isReadOnly={isReadOnly}
                    onCopyInvitationLinkAction={onCopyInvitationLinkAction}
                    onResendInvitationRequestAction={onResendInvitationRequestAction}
                    onRemoveInvitationRequestAction={onRemoveInvitationRequestAction}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 @lg/members-management:hidden">
        {rows.map((invitation) => (
          <div key={invitation.id} className="bg-background rounded-xl border px-3">
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
                <WorkspaceInvitationActionsMenu
                  invitation={invitation}
                  isReadOnly={isReadOnly}
                  onCopyInvitationLinkAction={onCopyInvitationLinkAction}
                  onResendInvitationRequestAction={onResendInvitationRequestAction}
                  onRemoveInvitationRequestAction={onRemoveInvitationRequestAction}
                />
              </DescriptionDetails>
            </DescriptionList>
          </div>
        ))}
      </div>
    </>
  );
}

function WorkspaceInvitationActionsMenu({
  invitation,
  isReadOnly,
  onCopyInvitationLinkAction,
  onResendInvitationRequestAction,
  onRemoveInvitationRequestAction,
}: {
  invitation: WorkspaceSettingsInvite;
  isReadOnly: boolean;
  onCopyInvitationLinkAction: (invitation: WorkspaceSettingsInvite) => void;
  onResendInvitationRequestAction: (invitation: WorkspaceSettingsInvite) => void;
  onRemoveInvitationRequestAction: (invitation: WorkspaceSettingsInvite) => void;
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
            disabled={isReadOnly}
          >
            <MoreHorizontalIcon aria-hidden="true" className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-44">
        <DropdownMenuItem
          onClick={() => onCopyInvitationLinkAction(invitation)}
          disabled={isReadOnly}
        >
          <CopyIcon aria-hidden="true" /> {t("menus.invites.copyLink")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onResendInvitationRequestAction(invitation)}
          disabled={isReadOnly}
        >
          <SendIcon aria-hidden="true" /> {t("menus.invites.resend")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onRemoveInvitationRequestAction(invitation)}
          variant="destructive"
          disabled={isReadOnly}
        >
          <TrashIcon aria-hidden="true" /> {t("menus.invites.remove")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

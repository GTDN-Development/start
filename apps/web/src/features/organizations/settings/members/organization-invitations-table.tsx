"use client";

import { useTranslations } from "next-intl";
import { InboxIcon, MoreHorizontalIcon, SendIcon, TrashIcon } from "lucide-react";
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
import { getOrganizationMemberRoleLabel } from "@/features/organizations/organization-role-options";
import type { OrganizationSettingsInvite } from "@/features/organizations/settings/organization-settings-types";

export function OrganizationInvitationsTable({
  rows,
  isReadOnly,
  onResendInvitationRequestAction,
  onRemoveInvitationRequestAction,
}: {
  rows: OrganizationSettingsInvite[];
  isReadOnly: boolean;
  onResendInvitationRequestAction: (invitation: OrganizationSettingsInvite) => void;
  onRemoveInvitationRequestAction: (invitation: OrganizationSettingsInvite) => void;
}) {
  const t = useTranslations("pages.organization.members.management");
  const tRoles = useTranslations("pages.organization.members.roles");
  const actionProps = {
    isReadOnly,
    onResendInvitationRequestAction,
    onRemoveInvitationRequestAction,
  };

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
                <TableCell>{getOrganizationMemberRoleLabel(invitation.role, tRoles)}</TableCell>
                <TableCell className="text-right">
                  <OrganizationInvitationActionsMenu invitation={invitation} {...actionProps} />
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
                {getOrganizationMemberRoleLabel(invitation.role, tRoles)}
              </DescriptionDetails>

              <DescriptionTerm>{t("table.invites.actions")}</DescriptionTerm>
              <DescriptionDetails>
                <OrganizationInvitationActionsMenu invitation={invitation} {...actionProps} />
              </DescriptionDetails>
            </DescriptionList>
          </div>
        ))}
      </div>
    </>
  );
}

function OrganizationInvitationActionsMenu({
  invitation,
  isReadOnly,
  onResendInvitationRequestAction,
  onRemoveInvitationRequestAction,
}: {
  invitation: OrganizationSettingsInvite;
  isReadOnly: boolean;
  onResendInvitationRequestAction: (invitation: OrganizationSettingsInvite) => void;
  onRemoveInvitationRequestAction: (invitation: OrganizationSettingsInvite) => void;
}) {
  const t = useTranslations("pages.organization.members.management");

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

export function OrganizationPendingInvitationsEmptyState() {
  const t = useTranslations("pages.organization.members.management.empty");

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

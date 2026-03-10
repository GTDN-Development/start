"use client";

import { InboxIcon, MoreHorizontalIcon, PencilLineIcon, TrashIcon, XIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SettingsItemContentBody,
  SettingsItemContentHeader,
  SettingsItemDescription,
  SettingsItemTitle,
} from "@/components/ui/settings-item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StaticPlaceholder } from "@/components/ui/static-placeholder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserInitials } from "@/lib/utils";

type WorkspaceMemberRole = "owner" | "member";

type WorkspaceMemberRow = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceMemberRole;
};

const WORKSPACE_MEMBERS: WorkspaceMemberRow[] = [
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

const PENDING_INVITATIONS: WorkspaceMemberRow[] = [];

export function WorkspaceMembersManagementSettingsItem() {
  const hasPendingInvitations = PENDING_INVITATIONS.length > 0;

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
                <MembersTable rows={WORKSPACE_MEMBERS} />
              </div>
              <div className="grid gap-3 @lg/members-management:hidden">
                {WORKSPACE_MEMBERS.map((member) => (
                  <MemberDescriptionRow key={member.id} member={member} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pending-invitations" className="grid gap-4">
              {hasPendingInvitations ? (
                <>
                  <div className="hidden @lg/members-management:block">
                    <PendingInvitationsTable rows={PENDING_INVITATIONS} />
                  </div>
                  <div className="grid gap-3 @lg/members-management:hidden">
                    {PENDING_INVITATIONS.map((invitation) => (
                      <PendingInvitationDescriptionRow
                        key={invitation.id}
                        invitation={invitation}
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
    </div>
  );
}

function MembersTable({ rows }: { rows: WorkspaceMemberRow[] }) {
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
            <TableCell className="capitalize">{member.role}</TableCell>
            <TableCell className="text-right">
              <MembersActionMenu />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PendingInvitationsTable({ rows }: { rows: WorkspaceMemberRow[] }) {
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
            <TableCell className="capitalize">{invitation.role}</TableCell>
            <TableCell className="text-right">
              <PendingInvitationActionButton />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function MemberDescriptionRow({ member }: { member: WorkspaceMemberRow }) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>User</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell name={member.name} email={member.email} />
        </DescriptionDetails>

        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails className="capitalize">{member.role}</DescriptionDetails>

        <DescriptionTerm>Actions</DescriptionTerm>
        <DescriptionDetails>
          <MembersActionMenu />
        </DescriptionDetails>
      </DescriptionList>
    </div>
  );
}

function PendingInvitationDescriptionRow({ invitation }: { invitation: WorkspaceMemberRow }) {
  return (
    <div className="bg-background rounded-xl border px-3">
      <DescriptionList>
        <DescriptionTerm>User</DescriptionTerm>
        <DescriptionDetails>
          <MemberIdentityCell name={invitation.name} email={invitation.email} />
        </DescriptionDetails>

        <DescriptionTerm>Role</DescriptionTerm>
        <DescriptionDetails className="capitalize">{invitation.role}</DescriptionDetails>

        <DescriptionTerm>Actions</DescriptionTerm>
        <DescriptionDetails>
          <PendingInvitationActionButton />
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

function MembersActionMenu() {
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
        <DropdownMenuItem>
          <PencilLineIcon aria-hidden="true" /> Change role
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive">
          <TrashIcon aria-hidden="true" /> Remove from workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PendingInvitationActionButton() {
  return (
    <Button type="button" size="icon" variant="destructive" aria-label="Cancel invitation">
      <XIcon aria-hidden="true" className="size-4" />
    </Button>
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

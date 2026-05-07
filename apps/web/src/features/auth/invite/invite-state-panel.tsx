import type { ReactNode } from "react";
import { AlertCircleIcon, CheckCircle2Icon, UsersIcon } from "lucide-react";
import {
  AuthHeroContent,
  AuthHeroDescription,
  AuthHeroTitle,
} from "@/features/auth/auth-page-shell";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";
import {
  OrganizationAvatar,
  OrganizationAvatarFallback,
  OrganizationAvatarImage,
} from "@/features/organizations/organization-avatar";

export type InviteStatePanelState =
  | "auth_required"
  | "pending"
  | "accepting"
  | "success"
  | "already_member"
  | "blocked"
  | "email_mismatch"
  | "error";

type InviteStatePanelOrganization = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

type InviteStatePanelProps = {
  state: InviteStatePanelState;
  organization?: InviteStatePanelOrganization;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
};

export function InviteStatePanel({
  state,
  organization,
  title,
  description,
  action,
}: InviteStatePanelProps) {
  const organizationAvatarColorClass = organization ? getAvatarColorClass(organization.id) : "";
  const organizationInitials = organization ? getUserInitials(organization.name) : "";

  return (
    <AuthHeroContent className="mx-auto flex w-full max-w-md flex-col justify-center">
      {organization && (
        <div className="mx-auto inline-flex max-w-full items-center gap-3">
          <OrganizationAvatar size="lg">
            {organization.avatarUrl ? (
              <OrganizationAvatarImage src={organization.avatarUrl} alt="" />
            ) : null}
            <OrganizationAvatarFallback
              className={cn(organizationAvatarColorClass, "text-xs font-semibold")}
            >
              {organizationInitials}
            </OrganizationAvatarFallback>
          </OrganizationAvatar>
        </div>
      )}
      {!organization && (
        <div className="mx-auto">
          <InviteStateIcon state={state} />
        </div>
      )}

      <AuthHeroTitle className="text-2xl/[1.1] sm:text-3xl/[1.1]">{title}</AuthHeroTitle>
      <AuthHeroDescription render={<div />} className="space-y-3">
        {description}
      </AuthHeroDescription>
      {action && <div className="pt-3">{action}</div>}
    </AuthHeroContent>
  );
}

function InviteStateIcon({ state }: { state: InviteStatePanelState }) {
  if (state === "accepting") {
    return <Spinner className="size-6" />;
  }

  if (state === "success" || state === "already_member") {
    return <CheckCircle2Icon aria-hidden="true" className="size-6" />;
  }

  if (state === "blocked" || state === "email_mismatch" || state === "error") {
    return <AlertCircleIcon aria-hidden="true" className="text-destructive size-6" />;
  }

  return <UsersIcon aria-hidden="true" className="size-6" />;
}

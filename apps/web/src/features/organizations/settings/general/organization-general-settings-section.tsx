"use client";

import { startTransition, useState } from "react";
import { OrganizationAvatarSettingsItem } from "@/features/organizations/settings/general/organization-avatar-settings-item";
import {
  deleteOrganizationAction,
  leaveOrganizationAction,
  updateOrganizationGeneralAction,
} from "@/features/organizations/settings/general/organization-general-actions";
import { OrganizationDangerSettingsItem } from "@/features/organizations/settings/general/organization-danger-settings-item";
import { OrganizationTextSettingsItem } from "@/features/organizations/settings/general/organization-text-settings-item";
import type { OrganizationSettingsOrganization } from "@/features/organizations/settings/organization-settings-types";
import { useApplyOrganizationNavigationPatch } from "@/features/organizations/organization-navigation-context";
import type {
  OrganizationNavigationItem,
  OrganizationNavigationPatch,
} from "@/features/organizations/organization-navigation-types";
import { runAsyncTransition } from "@/lib/app-utils";
import type { OrganizationResponse } from "@/features/organizations/organization-types";

type UpdateOrganizationGeneralActionInput = {
  name?: string;
  slug?: string;
  removeAvatar?: boolean;
  avatarFile?: File;
};

type UpdateOrganizationGeneralActionResult = OrganizationResponse<{
  organizationSlug: string;
  organization: OrganizationNavigationItem;
  navigationPatch: OrganizationNavigationPatch;
}>;

type OrganizationRemovalActionResult<TFlag extends "left" | "deleted"> = OrganizationResponse<
  Record<TFlag, true> & {
    navigationPatch: OrganizationNavigationPatch;
  }
>;

export function OrganizationGeneralSettingsSection({
  initialOrganization,
}: {
  initialOrganization: OrganizationSettingsOrganization;
}) {
  const applyOrganizationNavigationPatch = useApplyOrganizationNavigationPatch();
  const [organization, setOrganization] = useState(initialOrganization);

  async function handleUpdateOrganizationAction(
    input: UpdateOrganizationGeneralActionInput
  ): Promise<UpdateOrganizationGeneralActionResult> {
    const currentOrganization = organization;
    const response = await runAsyncTransition(() =>
      updateOrganizationGeneralAction(currentOrganization.slug, input)
    );

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      setOrganization({ ...currentOrganization, ...response.data.organization });
      applyOrganizationNavigationPatch(response.data.navigationPatch);
    });

    return response;
  }

  async function handleOrganizationRemovalAction<TFlag extends "left" | "deleted">(
    action: (organizationSlug: string) => Promise<OrganizationRemovalActionResult<TFlag>>
  ): Promise<OrganizationRemovalActionResult<TFlag>> {
    const currentOrganization = organization;
    const response = await runAsyncTransition(() => action(currentOrganization.slug));

    if (!response.ok) {
      return response;
    }

    startTransition(() => {
      applyOrganizationNavigationPatch(response.data.navigationPatch);
    });

    return response;
  }

  function handleLeaveOrganizationAction() {
    return handleOrganizationRemovalAction(leaveOrganizationAction);
  }

  function handleDeleteOrganizationAction() {
    return handleOrganizationRemovalAction(deleteOrganizationAction);
  }

  return (
    <div className="grid gap-8">
      <OrganizationTextSettingsItem
        key={`organization-general-name:${organization.name}:${organization.role}`}
        field="name"
        organization={organization}
        onUpdateOrganizationAction={handleUpdateOrganizationAction}
      />
      <OrganizationTextSettingsItem
        key={`organization-general-url:${organization.slug}:${organization.role}`}
        field="url"
        organization={organization}
        onUpdateOrganizationAction={handleUpdateOrganizationAction}
      />
      <OrganizationAvatarSettingsItem
        organization={organization}
        onUpdateOrganizationAction={handleUpdateOrganizationAction}
      />
      <OrganizationDangerSettingsItem
        kind="leave"
        organization={organization}
        onAction={handleLeaveOrganizationAction}
      />
      <OrganizationDangerSettingsItem
        kind="delete"
        organization={organization}
        onAction={handleDeleteOrganizationAction}
      />
    </div>
  );
}

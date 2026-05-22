"use server";

import {
  APP_HOME_PATH,
  getOrganizationOverviewHref,
  getOrganizationSettingsHref,
} from "@/config/routes";
import {
  createOrganizationInputSchema,
  updateOrganizationGeneralInputSchema,
  organizationAvatarMaxSizeBytes,
  organizationSlugSchema,
} from "@/features/organizations/organization-schemas";
import type {
  OrganizationNavigationItem,
  OrganizationNavigationPatch,
} from "@/features/organizations/organization-navigation-types";
import {
  clearActiveOrganizationSlugCookie,
  getActiveOrganizationSlugCookie,
  setActiveOrganizationSlugCookie,
} from "@/server/organizations/organization-cookie";
import {
  createBadRequestOrganizationResponse,
  finalizeOrganizationAction,
} from "@/server/organizations/organization-response";
import {
  createOrganization,
  deleteOrganization,
  leaveOrganization,
  updateOrganizationGeneral,
} from "@/server/organizations/organization-general-mutations";
import type {
  UserOrganization,
  OrganizationResponse,
} from "@/features/organizations/organization-types";

type OrganizationUpdateInput = {
  name?: string;
  slug?: string;
  removeAvatar?: boolean;
  avatarFile?: File;
};

type OrganizationNavigationPayload<TData> = TData & {
  navigationPatch: OrganizationNavigationPatch;
};

export async function createOrganizationAction(input: { name: string; slug?: string }): Promise<
  OrganizationResponse<
    OrganizationNavigationPayload<{
      organizationSlug: string;
      organization: OrganizationNavigationItem;
    }>
  >
> {
  const parsedInput = createOrganizationInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await createOrganization(parsedInput.data);

  return finalizeOrganizationAction(response, {
    mapData: async (data) => {
      await setActiveOrganizationSlugCookie(data.organization.slug);

      return createOrganizationNavigationPayload(data.organization, {
        activeOrganizationSlug: data.organization.slug,
        redirectHref: getOrganizationOverviewHref(data.organization.slug),
      });
    },
  });
}

export async function updateOrganizationGeneralAction(
  organizationSlug: string,
  input: OrganizationUpdateInput
): Promise<
  OrganizationResponse<
    OrganizationNavigationPayload<{
      organizationSlug: string;
      organization: OrganizationNavigationItem;
    }>
  >
> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedInput = updateOrganizationGeneralInputSchema.safeParse(input);

  if (!parsedOrganizationSlug.success || !parsedInput.success) {
    return createBadRequestOrganizationResponse();
  }

  if (parsedInput.data.avatarFile && !isOrganizationAvatarFileValid(parsedInput.data.avatarFile)) {
    return createBadRequestOrganizationResponse();
  }

  const response = await updateOrganizationGeneral(parsedOrganizationSlug.data, parsedInput.data);

  return finalizeOrganizationAction(response, {
    mapData: async (data) => {
      const activeOrganizationSlug = await getActiveOrganizationSlugCookie();
      const organizationSlugChanged = data.previousSlug !== data.organization.slug;
      const shouldUpdateActiveOrganizationCookie =
        organizationSlugChanged &&
        (activeOrganizationSlug === data.previousSlug ||
          (!activeOrganizationSlug && parsedOrganizationSlug.data === data.previousSlug));

      if (shouldUpdateActiveOrganizationCookie) {
        await setActiveOrganizationSlugCookie(data.organization.slug);
      }

      return createOrganizationNavigationPayload(data.organization, {
        ...(shouldUpdateActiveOrganizationCookie
          ? { activeOrganizationSlug: data.organization.slug }
          : {}),
        ...(organizationSlugChanged
          ? { redirectHref: getOrganizationSettingsHref(data.organization.slug) }
          : {}),
      });
    },
  });
}

export async function leaveOrganizationAction(
  organizationSlug: string
): Promise<OrganizationResponse<OrganizationNavigationPayload<{ left: true }>>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);

  if (!parsedOrganizationSlug.success) {
    return createBadRequestOrganizationResponse();
  }

  return finalizeOrganizationAction(await leaveOrganization(parsedOrganizationSlug.data), {
    mapData: async (data) => ({
      left: true as const,
      ...(await createOrganizationRemovalPayload(data.organizationId, parsedOrganizationSlug.data)),
    }),
  });
}

export async function deleteOrganizationAction(
  organizationSlug: string
): Promise<OrganizationResponse<OrganizationNavigationPayload<{ deleted: true }>>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);

  if (!parsedOrganizationSlug.success) {
    return createBadRequestOrganizationResponse();
  }

  return finalizeOrganizationAction(await deleteOrganization(parsedOrganizationSlug.data), {
    mapData: async (data) => ({
      deleted: true as const,
      ...(await createOrganizationRemovalPayload(data.organizationId, parsedOrganizationSlug.data)),
    }),
  });
}

function isOrganizationAvatarFileValid(avatarFile: File): boolean {
  return avatarFile.type.startsWith("image/") && avatarFile.size <= organizationAvatarMaxSizeBytes;
}

function createOrganizationNavigationPayload(
  organization: UserOrganization,
  patch: Omit<OrganizationNavigationPatch, "upsertOrganization"> = {}
) {
  const navigationItem: OrganizationNavigationItem = {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    role: organization.role,
    avatarUrl: organization.avatarUrl,
  };

  return {
    organizationSlug: organization.slug,
    organization: navigationItem,
    navigationPatch: {
      upsertOrganization: navigationItem,
      ...patch,
    },
  };
}

async function createOrganizationRemovalPayload(organizationId: string, organizationSlug: string) {
  const shouldClearActiveOrganization =
    (await getActiveOrganizationSlugCookie()) === organizationSlug;

  if (shouldClearActiveOrganization) {
    await clearActiveOrganizationSlugCookie();
  }

  return {
    navigationPatch: {
      removeOrganizationId: organizationId,
      ...(shouldClearActiveOrganization ? { activeOrganizationSlug: null } : {}),
      redirectHref: APP_HOME_PATH,
    },
  };
}

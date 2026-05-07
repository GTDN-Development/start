"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type {
  OrganizationNavigationItem,
  OrganizationNavigationPatch,
} from "./organization-navigation-types";

type OrganizationNavigationState = {
  activeOrganizationSlug: string | null;
  organizations: OrganizationNavigationItem[];
};

type OrganizationNavigationContextValue = OrganizationNavigationState & {
  upsertOrganization: (organization: OrganizationNavigationItem) => void;
  removeOrganization: (organizationId: string) => void;
  setActiveOrganizationSlug: (organizationSlug: string | null) => void;
};

type OrganizationNavigationProviderProps = {
  initialOrganizations: OrganizationNavigationItem[];
  initialActiveOrganizationSlug: string | null;
  children: React.ReactNode;
};

const OrganizationNavigationContext = createContext<OrganizationNavigationContextValue | null>(
  null
);

export function OrganizationNavigationProvider({
  initialOrganizations,
  initialActiveOrganizationSlug,
  children,
}: OrganizationNavigationProviderProps) {
  const [navigationState, setNavigationState] = useState<OrganizationNavigationState>({
    activeOrganizationSlug: initialActiveOrganizationSlug,
    organizations: initialOrganizations,
  });

  function upsertOrganization(organization: OrganizationNavigationItem) {
    setNavigationState((current) => {
      const previousOrganization =
        current.organizations.find(
          (candidateOrganization) => candidateOrganization.id === organization.id
        ) ?? null;

      const nextOrganizations = sortOrganizationNavigationItems(
        previousOrganization
          ? current.organizations.map((candidateOrganization) =>
              candidateOrganization.id === organization.id ? organization : candidateOrganization
            )
          : [...current.organizations, organization]
      );

      return {
        activeOrganizationSlug:
          previousOrganization && current.activeOrganizationSlug === previousOrganization.slug
            ? organization.slug
            : current.activeOrganizationSlug,
        organizations: nextOrganizations,
      };
    });
  }

  function removeOrganization(organizationId: string) {
    setNavigationState((current) => {
      const previousOrganization =
        current.organizations.find(
          (candidateOrganization) => candidateOrganization.id === organizationId
        ) ?? null;

      if (!previousOrganization) {
        return current;
      }

      return {
        activeOrganizationSlug:
          current.activeOrganizationSlug === previousOrganization.slug
            ? null
            : current.activeOrganizationSlug,
        organizations: current.organizations.filter(
          (candidateOrganization) => candidateOrganization.id !== organizationId
        ),
      };
    });
  }

  function setActiveOrganizationSlug(organizationSlug: string | null) {
    setNavigationState((current) => ({
      ...current,
      activeOrganizationSlug: organizationSlug,
    }));
  }

  return (
    <OrganizationNavigationContext.Provider
      value={{
        activeOrganizationSlug: navigationState.activeOrganizationSlug,
        organizations: navigationState.organizations,
        upsertOrganization,
        removeOrganization,
        setActiveOrganizationSlug,
      }}
    >
      {children}
    </OrganizationNavigationContext.Provider>
  );
}

export function useOrganizationNavigation() {
  const context = useContext(OrganizationNavigationContext);

  if (!context) {
    throw new Error("useOrganizationNavigation must be used within OrganizationNavigationProvider");
  }

  return context;
}

export function useOptionalOrganizationNavigation(): OrganizationNavigationContextValue | null {
  return useContext(OrganizationNavigationContext);
}

export function useApplyOrganizationNavigationPatch() {
  const router = useRouter();
  const organizationNavigation = useOptionalOrganizationNavigation();

  return function applyOrganizationNavigationPatch(
    patch: OrganizationNavigationPatch | null | undefined
  ) {
    if (!patch) {
      return;
    }

    if (patch.upsertOrganization) {
      organizationNavigation?.upsertOrganization(patch.upsertOrganization);
    }

    if (patch.removeOrganizationId) {
      organizationNavigation?.removeOrganization(patch.removeOrganizationId);
    }

    if ("activeOrganizationSlug" in patch) {
      organizationNavigation?.setActiveOrganizationSlug(patch.activeOrganizationSlug ?? null);
    }

    if (patch.redirectHref) {
      router.replace(patch.redirectHref);
    }
  };
}

function sortOrganizationNavigationItems(organizations: OrganizationNavigationItem[]) {
  return [...organizations].sort((firstOrganization, secondOrganization) =>
    firstOrganization.name.localeCompare(secondOrganization.name)
  );
}

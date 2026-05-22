"use server";

import { RedirectType } from "next/navigation";
import { APP_HOME_PATH, getOrganizationOverviewHref } from "@/config/routes";
import { redirect } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { isRecord } from "@/lib/app-utils";
import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import {
  clearActiveOrganizationSlugCookie,
  setActiveOrganizationSlugCookie,
} from "@/server/organizations/organization-cookie";
import { organizationSlugSchema } from "@/features/organizations/organization-schemas";
import type { OrganizationResponse } from "@/features/organizations/organization-types";
import { finalizeOrganizationAction } from "@/server/organizations/organization-response";
import { resolveAccessibleOrganizationForCurrentUser } from "@/server/organizations/organization-route-queries";

export type SwitchApplicationScopeInput =
  | {
      scope: "personal";
      locale: AppLocale;
    }
  | {
      scope: "organization";
      organizationSlug: string;
      locale: AppLocale;
    };

export type SwitchApplicationScopeResponse = OrganizationResponse<never>;

export async function switchApplicationScopeAction(
  input: SwitchApplicationScopeInput
): Promise<SwitchApplicationScopeResponse> {
  const parsedInput = parseSwitchApplicationScopeInput(input);

  if (!parsedInput) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  if (parsedInput.scope === "personal") {
    return switchPersonalApplicationScope(parsedInput.locale);
  }

  return switchOrganizationApplicationScope(parsedInput.organizationSlug, parsedInput.locale);
}

async function switchPersonalApplicationScope(
  locale: AppLocale
): Promise<SwitchApplicationScopeResponse> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    if ("cookieMutations" in currentUser) {
      await applyServerActionAuthCookies(currentUser.cookieMutations);
    }

    return {
      ok: false,
      errorCode: currentUser.errorCode,
    };
  }

  await clearActiveOrganizationSlugCookie();

  return redirect(
    {
      href: APP_HOME_PATH,
      locale,
    },
    RedirectType.replace
  );
}

async function switchOrganizationApplicationScope(
  organizationSlug: string,
  locale: AppLocale
): Promise<SwitchApplicationScopeResponse> {
  const response = await resolveAccessibleOrganizationForCurrentUser(organizationSlug);

  return finalizeOrganizationAction(response, {
    mapData: async (data): Promise<never> => {
      await setActiveOrganizationSlugCookie(data.organization.slug);

      return redirect(
        {
          href: getOrganizationOverviewHref(data.organization.slug),
          locale,
        },
        RedirectType.replace
      );
    },
  });
}

function parseSwitchApplicationScopeInput(
  input: SwitchApplicationScopeInput
): SwitchApplicationScopeInput | null {
  if (!isRecord(input) || !isAppLocale(input.locale)) {
    return null;
  }

  if (input.scope === "personal") {
    return {
      scope: "personal",
      locale: input.locale,
    };
  }

  if (input.scope === "organization") {
    const parsedOrganizationSlug = organizationSlugSchema.safeParse(input.organizationSlug);

    if (!parsedOrganizationSlug.success) {
      return null;
    }

    return {
      scope: "organization",
      locale: input.locale,
      organizationSlug: parsedOrganizationSlug.data,
    };
  }

  return null;
}

function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && routing.locales.includes(value as AppLocale);
}

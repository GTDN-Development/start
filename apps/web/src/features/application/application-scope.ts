import { APP_DOCUMENT_EXPORT_PATH, APP_HOME_PATH, ORGANIZATION_PATH_PREFIX } from "@/config/routes";

export type ApplicationScope = "personal" | "organization" | "other";

export function normalizeOrganizationSlug(
  organizationSlug: string | null | undefined
): string | null {
  const normalizedOrganizationSlug = organizationSlug?.trim() ?? "";

  if (!normalizedOrganizationSlug) {
    return null;
  }

  if (normalizedOrganizationSlug.startsWith("[") && normalizedOrganizationSlug.endsWith("]")) {
    return null;
  }

  return normalizedOrganizationSlug;
}

export function getOrganizationSlugFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const organizationRootPath = `/${segments[0] ?? ""}`;

  if (segments.length < 2 || organizationRootPath !== ORGANIZATION_PATH_PREFIX) {
    return null;
  }

  return normalizeOrganizationSlug(segments[1] ?? "");
}

export function isPersonalScopePath(pathname: string): boolean {
  return pathname === APP_HOME_PATH || pathname === APP_DOCUMENT_EXPORT_PATH;
}

export function isOrganizationScopePath(pathname: string): boolean {
  return (
    pathname === ORGANIZATION_PATH_PREFIX || pathname.startsWith(`${ORGANIZATION_PATH_PREFIX}/`)
  );
}

export function resolveApplicationScope(pathname: string): ApplicationScope {
  if (isOrganizationScopePath(pathname)) {
    return "organization";
  }

  if (isPersonalScopePath(pathname)) {
    return "personal";
  }

  return "other";
}

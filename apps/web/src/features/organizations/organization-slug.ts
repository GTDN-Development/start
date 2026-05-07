import { organizationConfig } from "@/config/organization";

export function toOrganizationSlug(
  value: string,
  maxLength: number = organizationConfig.limits.slugMaxLength
): string {
  const normalizedValue = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fallbackValue = normalizedValue || "organization";

  return trimOrganizationSlugLength(fallbackValue, maxLength);
}

export function trimOrganizationSlugLength(
  value: string,
  maxLength: number = organizationConfig.limits.slugMaxLength
): string {
  const normalizedValue = value.slice(0, maxLength).replace(/-+$/g, "");

  return normalizedValue || "organization";
}

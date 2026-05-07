import { organizationConfig } from "@/config/organization";

export function normalizeOrganizationName(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > organizationConfig.limits.nameMaxLength) {
    return null;
  }

  return normalizedValue;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

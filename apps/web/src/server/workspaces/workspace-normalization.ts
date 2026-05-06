import { workspaceConfig } from "@/config/workspace";

export function normalizeWorkspaceName(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > workspaceConfig.limits.nameMaxLength) {
    return null;
  }

  return normalizedValue;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

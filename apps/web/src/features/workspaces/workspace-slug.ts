import { workspaceConfig } from "@/config/workspace";

export function toWorkspaceSlug(
  value: string,
  maxLength: number = workspaceConfig.limits.slugMaxLength
): string {
  const normalizedValue = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fallbackValue = normalizedValue || "workspace";

  return trimWorkspaceSlugLength(fallbackValue, maxLength);
}

export function trimWorkspaceSlugLength(
  value: string,
  maxLength: number = workspaceConfig.limits.slugMaxLength
): string {
  const normalizedValue = value.slice(0, maxLength).replace(/-+$/g, "");

  return normalizedValue || "workspace";
}

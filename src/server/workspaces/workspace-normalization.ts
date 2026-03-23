import { randomBytes } from "node:crypto";
import type PocketBase from "pocketbase";
import { toWorkspaceSlug, trimWorkspaceSlugLength } from "@/features/workspaces/workspace-slug";
import {
  MAX_WORKSPACE_NAME_LENGTH,
  MAX_WORKSPACE_SLUG_LENGTH,
} from "@/server/workspaces/workspace-constants";
import { findWorkspaceBySlug } from "@/server/workspaces/workspace-repository";

export function normalizeWorkspaceName(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > MAX_WORKSPACE_NAME_LENGTH) {
    return null;
  }

  return normalizedValue;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolveUniqueWorkspaceSlug(
  pb: PocketBase,
  rawValue: string,
  currentWorkspaceId?: string
): Promise<string> {
  const baseSlug = toWorkspaceSlug(rawValue);

  for (let index = 0; index < 20; index += 1) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const candidateBase = trimWorkspaceSlugLength(
      baseSlug,
      MAX_WORKSPACE_SLUG_LENGTH - suffix.length
    );
    const candidateSlug = `${candidateBase}${suffix}`;
    const existingWorkspace = await findWorkspaceBySlug(pb, candidateSlug);

    if (!existingWorkspace || existingWorkspace.id === currentWorkspaceId) {
      return candidateSlug;
    }
  }

  const fallbackSuffix = randomBytes(2).toString("hex");
  const fallbackBase = trimWorkspaceSlugLength(
    baseSlug,
    MAX_WORKSPACE_SLUG_LENGTH - fallbackSuffix.length - 1
  );

  return `${fallbackBase}-${fallbackSuffix}`;
}

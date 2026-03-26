import { notFound } from "next/navigation";
import type {
  ServerWorkspaceResponse,
  UserWorkspace,
} from "@/server/workspaces/workspace-types";

export function requireWorkspaceRouteResult(
  response: ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>
): UserWorkspace {
  if (response.ok) {
    if (response.data.workspace) {
      return response.data.workspace;
    }

    notFound();
  }

  if (response.errorCode === "FORBIDDEN" || response.errorCode === "NOT_FOUND") {
    notFound();
  }

  throw new Error(`Failed to resolve workspace route: ${response.errorCode}`);
}

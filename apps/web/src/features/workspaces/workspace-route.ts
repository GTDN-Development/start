import { notFound } from "next/navigation";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";

export function requireWorkspaceRouteResult(
  response: ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>
): UserWorkspace {
  if (!response.ok) {
    if (response.errorCode === "FORBIDDEN") {
      notFound();
    }

    throw new Error(`Failed to resolve workspace route: ${response.errorCode}`);
  }

  if (!response.data.workspace) {
    notFound();
  }

  return response.data.workspace;
}

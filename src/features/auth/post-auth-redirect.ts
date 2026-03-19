"use client";

import { resolvePostAuthWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import { useRouter } from "@/i18n/navigation";

type AppRouter = ReturnType<typeof useRouter>;

export async function replaceToPostAuthDestination(router: AppRouter): Promise<void> {
  const workspaceResponse = await resolvePostAuthWorkspaceAction();

  if (workspaceResponse.ok) {
    router.replace({
      pathname: "/w/[workspaceSlug]/overview",
      params: {
        workspaceSlug: workspaceResponse.data.workspaceSlug,
      },
    });
    return;
  }

  router.replace("/overview");
}

"use client";

import { startTransition } from "react";
import { resolvePostAuthWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import { useRouter } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/utils";

type AppRouter = ReturnType<typeof useRouter>;

export async function replaceToPostAuthDestination(router: AppRouter): Promise<void> {
  const workspaceResponse = await runAsyncTransition(() => resolvePostAuthWorkspaceAction());

  if (workspaceResponse.ok) {
    startTransition(() => {
      router.replace({
        pathname: "/w/[workspaceSlug]/overview",
        params: {
          workspaceSlug: workspaceResponse.data.workspaceSlug,
        },
      });
    });
    return;
  }

  startTransition(() => {
    router.replace("/overview");
  });
}

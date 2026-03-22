import { startTransition } from "react";
import { resolvePostAuthWorkspaceAction } from "@/features/workspaces/actions/workspace-actions";
import type { AppHref } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";

type PostAuthRouter = {
  replace: (href: AppHref) => void;
};

export async function replaceToPostAuthDestination(router: PostAuthRouter): Promise<void> {
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

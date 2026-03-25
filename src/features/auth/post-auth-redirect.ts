import { startTransition } from "react";
import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  getInviteHref,
  getWorkspaceOverviewHref,
} from "@/config/routes";
import { resolvePostAuthDestinationAction } from "@/features/auth/actions/auth-actions";
import type { AppHref } from "@/i18n/navigation";
import { runAsyncTransition } from "@/lib/app-utils";

type PostAuthRouter = {
  replace: (href: AppHref) => void;
};

export async function replaceToPostAuthDestination(router: PostAuthRouter): Promise<void> {
  const destinationResponse = await runAsyncTransition(() => resolvePostAuthDestinationAction());

  if (!destinationResponse.ok) {
    startTransition(() => {
      router.replace(SIGN_IN_PATH);
    });
    return;
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    const workspaceSlug = destinationResponse.data.workspaceSlug;

    startTransition(() => {
      router.replace(getWorkspaceOverviewHref(workspaceSlug));
    });
    return;
  }

  if (destinationResponse.data.state === "invite_redirect") {
    const inviteToken = destinationResponse.data.inviteToken;

    startTransition(() => {
      router.replace(getInviteHref(inviteToken));
    });
    return;
  }

  startTransition(() => {
    router.replace(APP_HOME_PATH);
  });
}

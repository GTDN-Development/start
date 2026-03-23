import { startTransition } from "react";
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
      router.replace("/sign-in");
    });
    return;
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    const workspaceSlug = destinationResponse.data.workspaceSlug;

    startTransition(() => {
      router.replace({
        pathname: "/w/[workspaceSlug]/overview",
        params: {
          workspaceSlug,
        },
      });
    });
    return;
  }

  if (destinationResponse.data.state === "email_mismatch") {
    const invitedEmail = destinationResponse.data.invitedEmail;
    const currentEmail = destinationResponse.data.currentEmail;

    startTransition(() => {
      router.replace(
        createInviteResultHref({
          state: "email_mismatch",
          invitedEmail,
          currentEmail,
        })
      );
    });
    return;
  }

  if (destinationResponse.data.state === "invalid_or_expired") {
    startTransition(() => {
      router.replace(createInviteResultHref({ state: "invalid_or_expired" }));
    });
    return;
  }

  if (destinationResponse.data.state === "error") {
    startTransition(() => {
      router.replace(createInviteResultHref({ state: "error" }));
    });
    return;
  }

  startTransition(() => {
    router.replace("/app");
  });
}

function createInviteResultHref(
  input:
    | {
        state: "email_mismatch";
        invitedEmail: string;
        currentEmail: string;
      }
    | {
        state: "invalid_or_expired";
      }
    | {
        state: "error";
      }
): AppHref {
  const searchParams = new URLSearchParams({
    state: input.state,
  });

  if (input.state === "email_mismatch") {
    searchParams.set("invitedEmail", input.invitedEmail);
    searchParams.set("currentEmail", input.currentEmail);
  }

  return `/invite/result?${searchParams.toString()}` as AppHref;
}

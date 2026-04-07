"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS } from "@/config/auth";
import { signOut } from "@/features/auth/auth-client";
import { getPathname } from "@/i18n/navigation";

type UseSignOutReturn = {
  handleSignOut: () => Promise<void>;
  isPending: boolean;
};

export function useSignOut(): UseSignOutReturn {
  const locale = useLocale();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    const response = await signOut();

    if (response.ok) {
      window.location.assign(
        getPathname({
          href: AUTH_REDIRECTS.unauthenticatedTo,
          locale,
        })
      );
      return;
    }

    setIsPending(false);
  }

  return { handleSignOut, isPending };
}

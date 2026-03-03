"use client";

import { useState } from "react";
import { signOut } from "@/features/auth/auth-client";
import { AUTH_REDIRECTS } from "@/features/auth/auth-routes";
import { useRouter } from "@/i18n/navigation";

type UseSignOutReturn = {
  handleSignOut: () => Promise<void>;
  isPending: boolean;
};

export function useSignOut(): UseSignOutReturn {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut() {
    if (isPending) {
      return;
    }

    setIsPending(true);

    const response = await signOut();

    if (response.ok) {
      router.replace(AUTH_REDIRECTS.unauthenticatedTo);
      return;
    }

    setIsPending(false);
  }

  return { handleSignOut, isPending };
}

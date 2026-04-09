"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS } from "@/config/auth";
import { useSession } from "@/features/auth/auth-client";
import { getSessionSnapshot, subscribeToSessionStore } from "@/features/auth/auth-client-store";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { getPathname } from "@/i18n/navigation";
import type { AuthSessionSnapshot } from "@/features/auth/auth-types";

export function ApplicationAuthSync() {
  const locale = useLocale();
  const hasRedirectedRef = useRef(false);

  useSession();

  useMountEffect(function mountApplicationAuthSync() {
    function handleSessionSnapshot(snapshot: AuthSessionSnapshot) {
      if (snapshot.status === "authenticated") {
        hasRedirectedRef.current = false;
        return;
      }

      if (snapshot.status !== "unauthenticated" || hasRedirectedRef.current) {
        return;
      }

      hasRedirectedRef.current = true;

      window.location.assign(
        getPathname({
          href: AUTH_REDIRECTS.unauthenticatedTo,
          locale,
        })
      );
    }

    handleSessionSnapshot(getSessionSnapshot());

    return subscribeToSessionStore(function syncApplicationAuthState() {
      handleSessionSnapshot(getSessionSnapshot());
    });
  });

  return null;
}

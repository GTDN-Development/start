"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS } from "@/config/auth";
import { useSession } from "@/features/auth/auth-client";
import type { AuthSessionSnapshot } from "@/features/auth/auth-types";
import { getSessionSnapshot, subscribeToSessionStore } from "@/features/auth/auth-session-runtime";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { getPathname } from "@/i18n/navigation";

export function ApplicationAuthSync() {
  const locale = useLocale();
  const hasRedirectedRef = useRef(false);

  useSession();

  useMountEffect(function mountApplicationAuthRedirect() {
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

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";

const MIN_SYNC_INTERVAL_MS = 15_000;

type AuthSessionRefreshResponse = {
  ok: boolean;
  changed?: boolean;
};

export function AuthSessionSync() {
  const router = useRouter();
  const isRefreshingRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    async function refreshSessionIfNeeded() {
      if (document.visibilityState !== "visible") {
        return;
      }

      const now = Date.now();

      if (isRefreshingRef.current || now - lastRefreshAtRef.current < MIN_SYNC_INTERVAL_MS) {
        return;
      }

      isRefreshingRef.current = true;
      lastRefreshAtRef.current = now;

      try {
        const response = await fetch("/api/auth/session", {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as unknown;

        if (!isAuthSessionRefreshResponse(payload) || !payload.ok) {
          return;
        }

        if (payload.changed === true) {
          router.refresh();
        }
      } catch {
        return;
      } finally {
        isRefreshingRef.current = false;
      }
    }

    function handleWindowFocus() {
      void refreshSessionIfNeeded();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSessionIfNeeded();
      }
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return null;
}

function isAuthSessionRefreshResponse(value: unknown): value is AuthSessionRefreshResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.ok !== "boolean") {
    return false;
  }

  if ("changed" in record && typeof record.changed !== "boolean") {
    return false;
  }

  return true;
}

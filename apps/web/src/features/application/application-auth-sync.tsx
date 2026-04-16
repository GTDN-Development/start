"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS, authConfig } from "@/config/auth";
import { useAccountProfile } from "@/features/account/account-profile-context";
import { subscribeToAuthClientEvents } from "@/features/auth/auth-client-events";
import type { AuthSession, SessionResponse } from "@/features/auth/auth-types";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { getPathname } from "@/i18n/navigation";

const SESSION_ENDPOINT_PATH = "/api/auth/session";
const RECHECK_RATE_LIMIT_MS = 5_000;

export function ApplicationAuthSync() {
  const locale = useLocale();
  const { profile, setProfile } = useAccountProfile();
  const hasRedirectedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const lastCheckAtRef = useRef(0);
  const profileRef = useRef(profile);
  const setProfileRef = useRef(setProfile);

  profileRef.current = profile;
  setProfileRef.current = setProfile;

  useMountEffect(function mountApplicationAuthSync() {
    function stopInterval() {
      if (intervalIdRef.current === null) {
        return;
      }

      window.clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    function startIntervalIfEligible() {
      if (intervalIdRef.current !== null) {
        return;
      }

      if (document.visibilityState !== "visible" || navigator.onLine === false) {
        return;
      }

      intervalIdRef.current = window.setInterval(function recheckActiveTabSession() {
        void recheckSession();
      }, authConfig.session.activeTabRecheckIntervalMs);
    }

    function redirectToSignIn() {
      if (hasRedirectedRef.current) {
        return;
      }

      stopInterval();
      hasRedirectedRef.current = true;

      window.location.assign(
        getPathname({
          href: AUTH_REDIRECTS.unauthenticatedTo,
          locale,
        })
      );
    }

    function syncProfileFromSession(user: AuthSession["user"]) {
      const currentProfile = profileRef.current;

      if (
        currentProfile.id === user.id &&
        currentProfile.name === user.name &&
        currentProfile.email === user.email &&
        currentProfile.avatarUrl === user.avatarUrl
      ) {
        return;
      }

      setProfileRef.current(user);
    }

    async function executeSessionRecheck() {
      lastCheckAtRef.current = Date.now();

      const response = await fetchAuthSessionResponse();

      if (!response || !response.ok) {
        return;
      }

      const session = response.data.session;

      if (!session) {
        redirectToSignIn();
        return;
      }

      hasRedirectedRef.current = false;
      syncProfileFromSession(session.user);
    }

    async function recheckSession(input?: { force?: boolean }) {
      if (!input?.force && Date.now() - lastCheckAtRef.current < RECHECK_RATE_LIMIT_MS) {
        return;
      }

      if (inFlightRef.current) {
        await inFlightRef.current;
        return;
      }

      const request = executeSessionRecheck();
      inFlightRef.current = request;

      try {
        await request;
      } finally {
        inFlightRef.current = null;
      }
    }

    function handleAuthClientEvent(event: "auth-changed" | "signed-out") {
      if (event === "signed-out") {
        redirectToSignIn();
        return;
      }

      startIntervalIfEligible();
      void recheckSession({
        force: true,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        stopInterval();
        return;
      }

      startIntervalIfEligible();
      void recheckSession();
    }

    function handleWindowFocus() {
      startIntervalIfEligible();
      void recheckSession();
    }

    function handleWindowOnline() {
      startIntervalIfEligible();
      void recheckSession();
    }

    function handleWindowOffline() {
      stopInterval();
    }

    const unsubscribeAuthEvents = subscribeToAuthClientEvents(handleAuthClientEvent);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowOnline);
    window.addEventListener("offline", handleWindowOffline);

    startIntervalIfEligible();
    void recheckSession({
      force: true,
    });

    return function unmountApplicationAuthSync() {
      stopInterval();
      unsubscribeAuthEvents();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowOnline);
      window.removeEventListener("offline", handleWindowOffline);
    };
  });

  return null;
}

async function fetchAuthSessionResponse(): Promise<SessionResponse | null> {
  try {
    const response = await fetch(SESSION_ENDPOINT_PATH, {
      method: "GET",
      cache: "no-store",
    });
    const payload = (await response.json()) as unknown;

    if (isSessionResponse(payload)) {
      return payload;
    }
  } catch (_error) {
    return null;
  }

  return null;
}

function isSessionResponse(value: unknown): value is SessionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (payload.ok === true) {
    return "data" in payload;
  }

  if (payload.ok === false) {
    return typeof payload.errorCode === "string";
  }

  return false;
}

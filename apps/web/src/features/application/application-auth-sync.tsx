"use client";

import { useRef } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS } from "@/config/auth";
import { useAccountProfile } from "@/features/account/account-profile-context";
import { subscribeToAuthClientEvents } from "@/features/auth/auth-client-events";
import type { AuthSession, SessionResponse } from "@/features/auth/auth-types";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { getPathname } from "@/i18n/navigation";

const SESSION_ENDPOINT_PATH = "/api/auth/session";
const RECHECK_RATE_LIMIT_MS = 5_000;

export function ApplicationAuthSync() {
  const locale = useLocale();
  const { profile, patchProfile } = useAccountProfile();
  const hasRedirectedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const lastCheckAtRef = useRef(0);
  const profileRef = useRef(profile);
  const patchProfileRef = useRef(patchProfile);

  profileRef.current = profile;
  patchProfileRef.current = patchProfile;

  useMountEffect(function mountApplicationAuthSync() {
    function redirectToSignIn() {
      if (hasRedirectedRef.current) {
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

    function patchProfileFromSession(user: AuthSession["user"]) {
      const currentProfile = profileRef.current;

      if (
        currentProfile.name === user.name &&
        currentProfile.email === user.email &&
        currentProfile.avatarUrl === user.avatarUrl
      ) {
        return;
      }

      patchProfileRef.current({
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });
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
      patchProfileFromSession(session.user);
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

      void recheckSession({
        force: true,
      });
    }

    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") {
        return;
      }

      void recheckSession();
    }

    function handleWindowFocus() {
      void recheckSession();
    }

    function handleWindowOnline() {
      void recheckSession();
    }

    const unsubscribeAuthEvents = subscribeToAuthClientEvents(handleAuthClientEvent);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("online", handleWindowOnline);

    void recheckSession({
      force: true,
    });

    return function unmountApplicationAuthSync() {
      unsubscribeAuthEvents();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("online", handleWindowOnline);
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

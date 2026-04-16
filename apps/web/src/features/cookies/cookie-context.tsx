"use client";

import { useLocale } from "next-intl";
import { useSyncExternalStore, type ReactNode } from "react";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_NAME,
  type ConsentState,
  type CookieConsentEventType,
  acceptAllConsent,
  defaultConsent,
  isCookieConsentEnabled,
  parseConsentCookieValue,
  rejectAllConsent,
  serializeConsentCookieValue,
} from "@/config/cookie-consent";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { persistCookieConsentAction } from "./cookie-consent-actions";

const DEBUG_MODE = false;
const ENABLE_DEBUG_MODE = process.env.NODE_ENV === "development" && DEBUG_MODE;
const COOKIE_CONSENT_ENABLED = isCookieConsentEnabled();

type CookieStoreSnapshot = {
  consent: ConsentState;
  hasInteracted: boolean;
  isReady: boolean;
  isSettingsOpen: boolean;
  openSettingsNavigationId: number | null;
};

type CookieContextType = {
  consent: ConsentState;
  hasConsentedTo: (category: keyof ConsentState) => boolean;
  updateConsent: (category: keyof ConsentState, value: boolean) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: () => void;
  hasInteracted: boolean;
  isReady: boolean;
  isSettingsOpen: boolean;
  openSettingsDialog: () => void;
  closeSettingsDialog: () => void;
};

const cookieStoreSubscribers = new Set<() => void>();

const SERVER_COOKIE_STORE_SNAPSHOT = createInitialCookieStoreSnapshot();

let cookieStoreSnapshot = SERVER_COOKIE_STORE_SNAPSHOT;
let stopCookieVisibilitySync: (() => void) | null = null;

export function CookieContextProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useCookieContext(): CookieContextType {
  const locale = useLocale();
  const { navigationId } = useBrowserPathnameState();
  const snapshot = useSyncExternalStore(
    subscribeToCookieStore,
    getCookieStoreSnapshot,
    getServerCookieStoreSnapshot
  );
  const isSettingsOpen =
    snapshot.isSettingsOpen && snapshot.openSettingsNavigationId === navigationId;

  function updateConsent(category: keyof ConsentState, value: boolean) {
    if (category === "necessary") {
      return;
    }

    const currentSnapshot = getCookieStoreSnapshot();
    const nextConsent = {
      ...currentSnapshot.consent,
      [category]: value,
    };

    setCookieStoreSnapshot({
      ...currentSnapshot,
      consent: nextConsent,
    });
    logCookieDebugState({
      consent: nextConsent,
      hasInteracted: currentSnapshot.hasInteracted,
      isSettingsOpen,
    });
  }

  function acceptAll() {
    commitConsent({
      locale,
      consent: acceptAllConsent,
      eventType: "accept_all",
      isSettingsOpen,
    });
  }

  function rejectAll() {
    commitConsent({
      locale,
      consent: rejectAllConsent,
      eventType: "reject_all",
      isSettingsOpen,
    });
  }

  function savePreferences() {
    commitConsent({
      locale,
      consent: getCookieStoreSnapshot().consent,
      eventType: "save_preferences",
      isSettingsOpen,
    });
  }

  function hasConsentedTo(category: keyof ConsentState) {
    return snapshot.consent[category];
  }

  function openSettingsDialog() {
    const currentSnapshot = getCookieStoreSnapshot();

    if (!COOKIE_CONSENT_ENABLED || !currentSnapshot.isReady) {
      return;
    }

    setCookieStoreSnapshot({
      ...currentSnapshot,
      isSettingsOpen: true,
      openSettingsNavigationId: navigationId,
    });
    logCookieDebugState({
      consent: currentSnapshot.consent,
      hasInteracted: currentSnapshot.hasInteracted,
      isSettingsOpen: true,
    });
  }

  function closeSettingsDialog() {
    const currentSnapshot = getCookieStoreSnapshot();

    setCookieStoreSnapshot({
      ...currentSnapshot,
      isSettingsOpen: false,
      openSettingsNavigationId: null,
    });
    logCookieDebugState({
      consent: currentSnapshot.consent,
      hasInteracted: currentSnapshot.hasInteracted,
      isSettingsOpen: false,
    });
  }

  return {
    consent: snapshot.consent,
    hasConsentedTo,
    updateConsent,
    acceptAll,
    rejectAll,
    savePreferences,
    hasInteracted: snapshot.hasInteracted,
    isReady: snapshot.isReady,
    isSettingsOpen,
    openSettingsDialog,
    closeSettingsDialog,
  };
}

function subscribeToCookieStore(listener: () => void) {
  cookieStoreSubscribers.add(listener);
  primeCookieStoreSnapshot();
  ensureCookieVisibilitySync();

  return function unsubscribeCookieStore() {
    cookieStoreSubscribers.delete(listener);

    if (cookieStoreSubscribers.size === 0 && stopCookieVisibilitySync) {
      stopCookieVisibilitySync();
      stopCookieVisibilitySync = null;
    }
  };
}

function getCookieStoreSnapshot() {
  primeCookieStoreSnapshot();
  return cookieStoreSnapshot;
}

function getServerCookieStoreSnapshot() {
  return SERVER_COOKIE_STORE_SNAPSHOT;
}

function createInitialCookieStoreSnapshot(): CookieStoreSnapshot {
  if (!COOKIE_CONSENT_ENABLED) {
    return {
      consent: defaultConsent,
      hasInteracted: true,
      isReady: true,
      isSettingsOpen: false,
      openSettingsNavigationId: null,
    };
  }

  return {
    consent: defaultConsent,
    hasInteracted: false,
    isReady: false,
    isSettingsOpen: false,
    openSettingsNavigationId: null,
  };
}

function primeCookieStoreSnapshot() {
  if (!COOKIE_CONSENT_ENABLED || cookieStoreSnapshot.isReady || typeof document === "undefined") {
    return;
  }

  const consentState = readConsentStateFromDocument();

  setCookieStoreSnapshot({
    ...cookieStoreSnapshot,
    consent: consentState.consent,
    hasInteracted: consentState.hasInteracted,
    isReady: true,
  });
}

function ensureCookieVisibilitySync() {
  if (typeof document === "undefined" || stopCookieVisibilitySync) {
    return;
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "hidden") {
      return;
    }

    setCookieStoreSnapshot({
      ...getCookieStoreSnapshot(),
      isSettingsOpen: false,
      openSettingsNavigationId: null,
    });
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  stopCookieVisibilitySync = function stopVisibilitySync() {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}

function setCookieStoreSnapshot(nextSnapshot: CookieStoreSnapshot) {
  if (isSameCookieStoreSnapshot(cookieStoreSnapshot, nextSnapshot)) {
    return;
  }

  cookieStoreSnapshot = nextSnapshot;
  notifyCookieStoreSubscribers();
}

function notifyCookieStoreSubscribers() {
  for (const subscriber of cookieStoreSubscribers) {
    subscriber();
  }
}

function isSameCookieStoreSnapshot(current: CookieStoreSnapshot, next: CookieStoreSnapshot) {
  return (
    current.hasInteracted === next.hasInteracted &&
    current.isReady === next.isReady &&
    current.isSettingsOpen === next.isSettingsOpen &&
    current.openSettingsNavigationId === next.openSettingsNavigationId &&
    isSameConsentState(current.consent, next.consent)
  );
}

function isSameConsentState(current: ConsentState, next: ConsentState) {
  return (
    current.necessary === next.necessary &&
    current.functional === next.functional &&
    current.analytics === next.analytics &&
    current.marketing === next.marketing
  );
}

function setConsentCookie(consent: ConsentState) {
  if (typeof document === "undefined") {
    return;
  }

  try {
    const value = serializeConsentCookieValue(consent);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${COOKIE_NAME}=${value}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  } catch (error) {
    console.error("Error setting consent cookie:", error);
  }
}

function commitConsent(input: {
  locale: string;
  consent: ConsentState;
  eventType: CookieConsentEventType;
  isSettingsOpen: boolean;
}) {
  setConsentCookie(input.consent);

  setCookieStoreSnapshot({
    ...getCookieStoreSnapshot(),
    consent: input.consent,
    hasInteracted: true,
  });
  logCookieDebugState({
    consent: input.consent,
    hasInteracted: true,
    isSettingsOpen: input.isSettingsOpen,
  });

  void persistCookieConsentAction({
    eventType: input.eventType,
    consent: input.consent,
    locale: input.locale,
  }).catch((error) => {
    console.error("Error persisting cookie consent event:", error);
  });
}

function logCookieDebugState(input: {
  consent: ConsentState;
  hasInteracted: boolean;
  isSettingsOpen: boolean;
}) {
  if (!ENABLE_DEBUG_MODE) {
    return;
  }

  console.log("Cookie Consent State:", input);
}

function readConsentStateFromDocument(): {
  consent: ConsentState;
  hasInteracted: boolean;
} {
  if (typeof document === "undefined") {
    return {
      consent: defaultConsent,
      hasInteracted: false,
    };
  }

  const cookieValue = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!cookieValue) {
    return {
      consent: defaultConsent,
      hasInteracted: false,
    };
  }

  const parsedConsent = parseConsentCookieValue(cookieValue);

  if (!parsedConsent?.isCurrentVersion) {
    return {
      consent: defaultConsent,
      hasInteracted: false,
    };
  }

  return {
    consent: parsedConsent.consent,
    hasInteracted: true,
  };
}

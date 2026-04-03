"use client";

import { createContext, startTransition, useContext, useState, type ReactNode } from "react";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_NAME,
  type ConsentState,
  type CookieConsentEventType,
  acceptAllConsent,
  defaultConsent,
  isCookieConsentEnabled,
  rejectAllConsent,
  serializeConsentCookieValue,
} from "./cookie-consent";
import { useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { persistCookieConsentAction } from "./cookie-consent-actions";

// Enable logging of the current state and always display the consent banner
const DEBUG_MODE = false;

type CookieContextType = {
  // Current consent preferences
  consent: ConsentState;
  // Check if user has consented to a specific category
  hasConsentedTo: (category: keyof ConsentState) => boolean;
  // Update a specific consent category preference
  updateConsent: (category: keyof ConsentState, value: boolean) => void;
  // Explicit consent actions used by the banner and settings dialog
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: () => void;
  // Whether the user has interacted with the consent banner
  hasInteracted: boolean;
  // Whether the settings dialog is open
  isSettingsOpen: boolean;
  // Open the settings dialog
  openSettingsDialog: () => void;
  // Close the settings dialog
  closeSettingsDialog: () => void;
};

const CookieContext = createContext<CookieContextType | undefined>(undefined);

function setConsentCookie(consent: ConsentState): void {
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

// For safety the cookie consent works normally in production
const ENABLE_DEBUG_MODE = process.env.NODE_ENV === "development" && DEBUG_MODE;
const COOKIE_CONSENT_ENABLED = isCookieConsentEnabled();

type CookieContextProviderProps = {
  children: ReactNode;
  initialConsent?: ConsentState;
  initialHasInteracted?: boolean;
};

export function CookieContextProvider({
  children,
  initialConsent = defaultConsent,
  initialHasInteracted = false,
}: CookieContextProviderProps) {
  const router = useRouter();
  const locale = useLocale();

  const [consent, setConsent] = useState<ConsentState>(initialConsent);
  const [hasInteracted, setHasInteracted] = useState(
    ENABLE_DEBUG_MODE ? false : COOKIE_CONSENT_ENABLED ? initialHasInteracted : true
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  function updateConsent(category: keyof ConsentState, value: boolean) {
    if (category === "necessary") {
      return;
    }

    setConsent((previousConsent) => {
      const nextConsent = { ...previousConsent, [category]: value };
      logCookieDebugState({
        consent: nextConsent,
        hasInteracted,
        isSettingsOpen,
      });
      return nextConsent;
    });
  }

  function commitConsent(nextConsent: ConsentState, eventType: CookieConsentEventType) {
    setConsentCookie(nextConsent);
    setConsent(nextConsent);
    setHasInteracted(true);
    logCookieDebugState({
      consent: nextConsent,
      hasInteracted: true,
      isSettingsOpen,
    });

    void persistCookieConsentAction({
      eventType,
      consent: nextConsent,
      locale,
    }).catch((error) => {
      console.error("Error persisting cookie consent event:", error);
    });

    if (!isSameConsent(consent, nextConsent)) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  function acceptAll() {
    commitConsent(acceptAllConsent, "accept_all");
  }

  function rejectAll() {
    commitConsent(rejectAllConsent, "reject_all");
  }

  function savePreferences() {
    commitConsent(consent, "save_preferences");
  }

  function hasConsentedTo(category: keyof ConsentState): boolean {
    return consent[category];
  }

  function openSettingsDialog() {
    if (!COOKIE_CONSENT_ENABLED) {
      return;
    }

    setIsSettingsOpen(true);
    logCookieDebugState({
      consent,
      hasInteracted,
      isSettingsOpen: true,
    });
  }

  function closeSettingsDialog() {
    setIsSettingsOpen(false);
    logCookieDebugState({
      consent,
      hasInteracted,
      isSettingsOpen: false,
    });
  }

  return (
    <CookieContext.Provider
      value={{
        consent,
        hasConsentedTo,
        updateConsent,
        acceptAll,
        rejectAll,
        savePreferences,
        hasInteracted,
        isSettingsOpen,
        openSettingsDialog,
        closeSettingsDialog,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export function useCookieContext() {
  const context = useContext(CookieContext);

  if (context === undefined) {
    throw new Error("useCookieContext must be used within a CookieContextProvider");
  }

  return context;
}

function isSameConsent(a: ConsentState, b: ConsentState) {
  return (
    a.necessary === b.necessary &&
    a.functional === b.functional &&
    a.analytics === b.analytics &&
    a.marketing === b.marketing
  );
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

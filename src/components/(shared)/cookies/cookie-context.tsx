"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_NAME,
  type ConsentState,
  type CookieConsentEventRequest,
  type CookieConsentEventType,
  acceptAllConsent,
  defaultConsent,
  rejectAllConsent,
  serializeConsentCookieValue,
} from "./consent";

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
  const locale = useLocale();
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentState>(initialConsent);
  const [hasInteracted, setHasInteracted] = useState(
    ENABLE_DEBUG_MODE ? false : initialHasInteracted
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Debug mode: log state changes
  useEffect(() => {
    if (ENABLE_DEBUG_MODE) {
      // eslint-disable-next-line no-console
      console.log("Cookie Consent State:", {
        consent,
        hasInteracted,
        isSettingsOpen,
      });
    }
  }, [consent, hasInteracted, isSettingsOpen]);

  function updateConsent(category: keyof ConsentState, value: boolean) {
    if (category === "necessary") {
      return;
    }

    setConsent((prev) => ({ ...prev, [category]: value }));
  }

  function commitConsent(nextConsent: ConsentState, eventType: CookieConsentEventType) {
    const eventPayload: CookieConsentEventRequest = {
      consent: nextConsent,
      eventType,
      locale,
      idempotencyKey: createConsentEventIdempotencyKey(),
    };

    void persistConsentEvent(eventPayload);

    setConsentCookie(nextConsent);
    setConsent(nextConsent);
    setHasInteracted(true);

    if (!isSameConsent(consent, nextConsent)) {
      router.refresh();
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
    setIsSettingsOpen(true);
  }

  function closeSettingsDialog() {
    setIsSettingsOpen(false);
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

async function persistConsentEvent(payload: CookieConsentEventRequest) {
  try {
    const response = await fetch("/api/cookie-consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify(payload),
    });

    if (!response.ok && ENABLE_DEBUG_MODE) {
      console.error("Cookie consent event logging failed:", response.status);
    }
  } catch (error) {
    if (ENABLE_DEBUG_MODE) {
      console.error("Cookie consent event request failed:", error);
    }
  }
}

function createConsentEventIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `cce_${crypto.randomUUID()}`;
  }

  return `cce_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isSameConsent(a: ConsentState, b: ConsentState) {
  return (
    a.necessary === b.necessary &&
    a.functional === b.functional &&
    a.analytics === b.analytics &&
    a.marketing === b.marketing
  );
}

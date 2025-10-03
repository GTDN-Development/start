"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "cookie_consent";

// Enable logging of the current state and always display the consent banner
const ENABLE_DEBUG_MODE = false;

type ConsentState = {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type CookieContextType = {
  // Current consent preferences
  consent: ConsentState;
  // Check if user has consented to a specific category
  hasConsentedTo: (category: keyof ConsentState) => boolean;
  // Update a specific consent category preference
  updateConsent: (category: keyof ConsentState, value: boolean) => void;
  // Save current consent preferences to storage
  saveConsent: (consentToSave?: ConsentState) => void;
  // Whether the user has interacted with the consent banner
  hasInteracted: boolean;
  // Whether the context has mounted and loaded from storage
  isMounted: boolean;
  // Whether the settings dialog is open
  isSettingsOpen: boolean;
  // Open the settings dialog
  openSettingsDialog: () => void;
  // Close the settings dialog
  closeSettingsDialog: () => void;
};

const CookieContext = createContext<CookieContextType | undefined>(undefined);

const initialConsent: ConsentState = {
  necessary: true, // Necessary cookies are always enabled
  functional: false,
  analytics: false,
  marketing: false,
};

function getFromLocalStorage(key: string, defaultValue: ConsentState): ConsentState {
  if (typeof document === "undefined") {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
}

function setToLocalStorage(key: string, value: ConsentState): void {
  if (typeof document === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
}

export function CookieContextProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(initialConsent);
  const [isMounted, setIsMounted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const storedConsent = getFromLocalStorage(STORAGE_KEY, initialConsent);
    const hasStored =
      typeof document !== "undefined" && window.localStorage.getItem(STORAGE_KEY) !== null;
    setConsent(storedConsent);
    setHasInteracted(ENABLE_DEBUG_MODE ? false : hasStored);
    setIsMounted(true);
  }, []);

  // Debug mode: log state changes
  useEffect(() => {
    if (ENABLE_DEBUG_MODE && isMounted) {
      console.log("Cookie Consent State:", {
        consent,
        hasInteracted,
        isSettingsOpen,
      });
    }
  }, [consent, hasInteracted, isSettingsOpen, isMounted]);

  function updateConsent(category: keyof ConsentState, value: boolean) {
    if (category === "necessary") return;
    setConsent((prev) => ({ ...prev, [category]: value }));
  }

  function saveConsent(consentToSave?: ConsentState) {
    const finalConsent = consentToSave || consent;
    setToLocalStorage(STORAGE_KEY, finalConsent);
    setConsent(finalConsent);
    setHasInteracted(true);
  }

  function hasConsentedTo(category: keyof ConsentState): boolean {
    return isMounted && consent[category];
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
        saveConsent,
        hasInteracted,
        isMounted,
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
    throw new Error("useCookieContext must be used within a CookieProvider");
  }
  return context;
}

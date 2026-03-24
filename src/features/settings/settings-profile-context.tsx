"use client";

import * as React from "react";
import type { SettingsProfileSnapshot } from "@/features/settings/settings-profile";

type SettingsProfileContextValue = {
  profile: SettingsProfileSnapshot;
  patchProfile: (patch: Partial<SettingsProfileSnapshot>) => void;
  isAvatarUpdating: boolean;
  setIsAvatarUpdating: (isUpdating: boolean) => void;
};

const SettingsProfileContext = React.createContext<SettingsProfileContextValue | null>(null);

type SettingsProfileProviderProps = {
  initialProfile: SettingsProfileSnapshot;
  children: React.ReactNode;
};

export function SettingsProfileProvider({ initialProfile, children }: SettingsProfileProviderProps) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [isAvatarUpdating, setIsAvatarUpdating] = React.useState(false);

  function patchProfile(patch: Partial<SettingsProfileSnapshot>) {
    setProfile((current) => ({
      ...current,
      ...patch,
    }));
  }

  return (
    <SettingsProfileContext.Provider
      value={{
        profile,
        patchProfile,
        isAvatarUpdating,
        setIsAvatarUpdating,
      }}
    >
      {children}
    </SettingsProfileContext.Provider>
  );
}

export function useSettingsProfile() {
  const context = React.useContext(SettingsProfileContext);

  if (!context) {
    throw new Error("useSettingsProfile must be used within SettingsProfileProvider");
  }

  return context;
}

export function useOptionalSettingsProfile() {
  return React.useContext(SettingsProfileContext);
}

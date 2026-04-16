"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";

type AccountProfileContextValue = {
  profile: AccountProfileSnapshot;
  setProfile: (profile: AccountProfileSnapshot) => void;
  isAvatarUpdating: boolean;
  setIsAvatarUpdating: (isUpdating: boolean) => void;
};

const AccountProfileContext = createContext<AccountProfileContextValue | null>(null);

type AccountProfileProviderProps = {
  children: ReactNode;
  initialProfile: AccountProfileSnapshot;
};

export function AccountProfileProvider({ initialProfile, children }: AccountProfileProviderProps) {
  const [profile, setProfileState] = useState(initialProfile);
  const [isAvatarUpdating, setIsAvatarUpdating] = useState(false);

  function setProfile(profileSnapshot: AccountProfileSnapshot) {
    setProfileState(profileSnapshot);
  }

  return (
    <AccountProfileContext.Provider
      value={{
        profile,
        setProfile,
        isAvatarUpdating,
        setIsAvatarUpdating,
      }}
    >
      {children}
    </AccountProfileContext.Provider>
  );
}

export function useAccountProfile() {
  const context = useContext(AccountProfileContext);

  if (!context) {
    throw new Error("useAccountProfile must be used within AccountProfileProvider");
  }

  return context;
}

export function useOptionalAccountProfile() {
  return useContext(AccountProfileContext);
}

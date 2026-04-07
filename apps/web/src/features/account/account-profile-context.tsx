"use client";

import * as React from "react";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";

type AccountProfileContextValue = {
  profile: AccountProfileSnapshot;
  patchProfile: (patch: Partial<AccountProfileSnapshot>) => void;
  isAvatarUpdating: boolean;
  setIsAvatarUpdating: (isUpdating: boolean) => void;
};

const AccountProfileContext = React.createContext<AccountProfileContextValue | null>(null);

type AccountProfileProviderProps = {
  initialProfile: AccountProfileSnapshot;
  children: React.ReactNode;
};

export function AccountProfileProvider({ initialProfile, children }: AccountProfileProviderProps) {
  const [profile, setProfile] = React.useState(initialProfile);
  const [isAvatarUpdating, setIsAvatarUpdating] = React.useState(false);

  function patchProfile(patch: Partial<AccountProfileSnapshot>) {
    setProfile((current) => ({
      ...current,
      ...patch,
    }));
  }

  return (
    <AccountProfileContext.Provider
      value={{
        profile,
        patchProfile,
        isAvatarUpdating,
        setIsAvatarUpdating,
      }}
    >
      {children}
    </AccountProfileContext.Provider>
  );
}

export function useAccountProfile() {
  const context = React.useContext(AccountProfileContext);

  if (!context) {
    throw new Error("useAccountProfile must be used within AccountProfileProvider");
  }

  return context;
}

export function useOptionalAccountProfile() {
  return React.useContext(AccountProfileContext);
}

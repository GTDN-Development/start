"use client";

import { useSession } from "@/features/auth/auth-client";
import {
  getEmailVerificationState,
  isEmailUnverifiedUser,
  isEmailVerifiedUser,
  shouldShowEmailNotVerifiedBanner,
  type EmailVerificationState,
} from "@/features/auth/email-verification";

export type UseEmailVerificationResult = {
  sessionStatus: ReturnType<typeof useSession>["status"];
  isAuthenticated: boolean;
  isVerified: boolean;
  isUnverified: boolean;
  shouldShowBanner: boolean;
  state: EmailVerificationState;
};

export function useEmailVerification(): UseEmailVerificationResult {
  const sessionSnapshot = useSession();
  const user = sessionSnapshot.session?.user;
  const isAuthenticated = sessionSnapshot.status === "authenticated" && Boolean(user);
  const state = getEmailVerificationState(user);

  return {
    sessionStatus: sessionSnapshot.status,
    isAuthenticated,
    isVerified: isEmailVerifiedUser(user),
    isUnverified: isEmailUnverifiedUser(user),
    shouldShowBanner: shouldShowEmailNotVerifiedBanner(user),
    state,
  };
}

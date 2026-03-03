import type { AuthSession } from "@/features/auth/auth-contract";
import {
  getEmailVerificationStateFromSession,
  isEmailUnverifiedUser,
} from "@/features/auth/email-verification";

export type ServerEmailVerificationSnapshot = {
  isAuthenticated: boolean;
  shouldShowBanner: boolean;
  state: ReturnType<typeof getEmailVerificationStateFromSession>;
};

export function getServerEmailVerificationSnapshot(
  session: AuthSession | null
): ServerEmailVerificationSnapshot {
  return {
    isAuthenticated: Boolean(session),
    shouldShowBanner: isEmailUnverifiedUser(session?.user),
    state: getEmailVerificationStateFromSession(session),
  };
}

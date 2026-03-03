import type { AuthSession, AuthUser } from "@/features/auth/auth-contract";

export type EmailVerificationUser = Pick<AuthUser, "verified"> | null | undefined;

export type EmailVerificationState = "unauthenticated" | "verified" | "unverified";

export function getEmailVerificationState(user: EmailVerificationUser): EmailVerificationState {
  if (!user) {
    return "unauthenticated";
  }

  return user.verified === true ? "verified" : "unverified";
}

export function isEmailVerifiedUser(user: EmailVerificationUser): boolean {
  return getEmailVerificationState(user) === "verified";
}

export function isEmailUnverifiedUser(user: EmailVerificationUser): boolean {
  return getEmailVerificationState(user) === "unverified";
}

export function shouldShowEmailNotVerifiedBanner(user: EmailVerificationUser): boolean {
  return isEmailUnverifiedUser(user);
}

export function getEmailVerificationStateFromSession(
  session: AuthSession | null | undefined
): EmailVerificationState {
  return getEmailVerificationState(session?.user);
}

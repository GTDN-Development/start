import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";
import { authConfig } from "@/config/auth";

export const PB_AUTH_COOKIE_NAME = authConfig.cookies.authCookieName;
export const PB_AUTH_PERSIST_COOKIE_NAME = authConfig.cookies.persistCookieName;

export type AuthErrorCode =
  | "BAD_REQUEST"
  | "ACCOUNT_DELETE_BLOCKED_LAST_OWNER"
  | "INVALID_CREDENTIALS"
  | "EMAIL_NOT_VERIFIED"
  | "EMAIL_ALREADY_IN_USE"
  | "VALIDATION_ERROR"
  | "WEAK_PASSWORD"
  | "TURNSTILE_VERIFICATION_FAILED"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "UNKNOWN_ERROR";

export type SignUpActionInput = SignUpInput & {
  turnstileToken?: string;
};

export type RequestPasswordResetInput = {
  email: string;
  turnstileToken?: string;
};

export type RequestEmailVerificationInput = {
  email: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export type AuthSession = {
  user: AuthUser;
};

export type AuthSessionPayload = {
  session: AuthSession | null;
};

export type SignUpPayload = {
  created: true;
};

export type AuthSignOutPayload = {
  signedOut: true;
};

export type VerifyEmailPayload = {
  session: AuthSession | null;
};

export type ResetPasswordPayload = {
  passwordReset: true;
};

export type RequestPasswordResetPayload = {
  sent: true;
};

export type RequestEmailVerificationPayload = {
  sent: true;
};

export type ConfirmEmailChangePayload = {
  emailChanged: true;
};

export type AuthSuccessResponse<TData> = {
  ok: true;
  data: TData;
};

export type AuthErrorResponse = {
  ok: false;
  errorCode: AuthErrorCode;
};

export type AuthResponse<TData> = AuthSuccessResponse<TData> | AuthErrorResponse;

export type SignInResponse = AuthResponse<AuthSessionPayload>;
export type SignUpResponse = AuthResponse<SignUpPayload>;
export type SignOutResponse = AuthResponse<AuthSignOutPayload>;
export type SessionResponse = AuthResponse<AuthSessionPayload>;
export type VerifyEmailResponse = AuthResponse<VerifyEmailPayload>;
export type ResetPasswordResponse = AuthResponse<ResetPasswordPayload>;
export type RequestPasswordResetResponse = AuthResponse<RequestPasswordResetPayload>;
export type RequestEmailVerificationResponse = AuthResponse<RequestEmailVerificationPayload>;
export type ConfirmEmailChangeResponse = AuthResponse<ConfirmEmailChangePayload>;

export type AuthSessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export type AuthSessionSnapshot = {
  status: AuthSessionStatus;
  session: AuthSession | null;
};

export type AuthClient = {
  signIn: (input: SignInInput) => Promise<SignInResponse>;
  signUp: (input: SignUpActionInput) => Promise<SignUpResponse>;
  signOut: () => Promise<SignOutResponse>;
  useSession: () => AuthSessionSnapshot;
};

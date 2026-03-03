import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";

export const PB_AUTH_COOKIE_NAME = "pb_auth";
export const PB_AUTH_PERSIST_COOKIE_NAME = "pb_auth_persist";

export type AuthErrorCode =
  | "BAD_REQUEST"
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_IN_USE"
  | "VALIDATION_ERROR"
  | "WEAK_PASSWORD"
  | "UNAUTHORIZED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "UNKNOWN_ERROR";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
  avatarUrl: string | null;
};

export type AuthSession = {
  user: AuthUser;
};

export type AuthSessionPayload = {
  session: AuthSession | null;
};

export type AuthSignOutPayload = {
  signedOut: true;
};

export type VerifyEmailPayload = {
  verified: true;
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
  session: AuthSession | null;
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
export type SignUpResponse = AuthResponse<AuthSessionPayload>;
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
  signUp: (input: SignUpInput) => Promise<SignUpResponse>;
  signOut: () => Promise<SignOutResponse>;
  useSession: () => AuthSessionSnapshot;
};

export type AuthApiAction = "sign-in" | "sign-up" | "sign-out" | "session";

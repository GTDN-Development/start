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

export type SignUpVerificationEmailStatus = "sent" | "needs_resend";

export type SignUpPayload = {
  created: true;
  verificationEmailStatus: SignUpVerificationEmailStatus;
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

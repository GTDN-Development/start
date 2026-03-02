import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";

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

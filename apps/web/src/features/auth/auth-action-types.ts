import type { SignUpInput } from "@/features/auth/auth-schemas";

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

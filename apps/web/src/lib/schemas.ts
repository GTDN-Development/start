import { z } from "zod";
import { authConfig } from "@/config/auth";

export type AuthPasswordValidationMessages = {
  required?: string;
  min?: string;
  max?: string;
  uppercase?: string;
  number?: string;
  specialCharacter?: string;
};

type PasswordMatchRefineOptions<TValues extends Record<string, unknown>> = {
  passwordField?: keyof TValues & string;
  confirmPasswordField?: keyof TValues & string;
  message?: string;
};

export function normalizedEmailSchema() {
  return z.string().trim().toLowerCase().pipe(z.email());
}

export function passwordPolicySchema(messages?: AuthPasswordValidationMessages) {
  return z
    .string()
    .min(authConfig.passwordPolicy.minLength, {
      message: messages?.min,
    })
    .max(authConfig.passwordPolicy.maxLength, {
      message: messages?.max,
    })
    .refine((value) => /[A-Z]/.test(value), {
      message: messages?.uppercase,
    })
    .refine((value) => /\d/.test(value), {
      message: messages?.number,
    })
    .refine((value) => /[!@#$%^&*(),.?":{}|<>]/.test(value), {
      message: messages?.specialCharacter,
    });
}

export function requiredPasswordSchema(
  messages?: Pick<AuthPasswordValidationMessages, "required">
) {
  return z.string().trim().min(1, {
    message: messages?.required,
  });
}

export function turnstileTokenSchema(options?: { enabled?: boolean }) {
  if (options?.enabled === false) {
    return z.string().trim().optional().default("");
  }

  return z.string().trim().min(1);
}

export function requiredTokenSchema() {
  return z.string().trim().min(1);
}

export function refinePasswordMatch<TValues extends Record<string, unknown>>(
  options?: PasswordMatchRefineOptions<TValues>
) {
  const passwordField = (options?.passwordField ?? "password") as keyof TValues & string;
  const confirmPasswordField = (options?.confirmPasswordField ??
    "confirmPassword") as keyof TValues & string;

  return (values: TValues, context: z.RefinementCtx) => {
    if (values[passwordField] !== values[confirmPasswordField]) {
      context.addIssue({
        code: "custom",
        message: options?.message,
        path: [confirmPasswordField],
      });
    }
  };
}

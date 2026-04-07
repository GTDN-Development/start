import { z } from "zod";
import { authConfig } from "@/config/auth";

export type AuthPasswordValidationMessages = {
  min?: string;
  max?: string;
};

type PasswordMatchRefineOptions<TValues extends Record<string, unknown>> = {
  passwordField?: keyof TValues & string;
  confirmPasswordField?: keyof TValues & string;
  message?: string;
};

export function normalizedEmailSchema() {
  return z.string().trim().toLowerCase().pipe(z.email());
}

export function authPasswordSchema(messages?: AuthPasswordValidationMessages) {
  return z
    .string()
    .min(authConfig.limits.passwordMinLength, {
      message: messages?.min,
    })
    .max(authConfig.limits.passwordMaxLength, {
      message: messages?.max,
    });
}

export function requiredPasswordSchema() {
  return z.string().trim().min(1);
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

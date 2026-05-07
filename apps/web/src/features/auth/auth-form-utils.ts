import { z } from "zod";

type AuthFieldMeta = {
  isTouched: boolean;
  isValid: boolean;
};

export function isAuthFieldInvalid(meta: AuthFieldMeta, submissionAttempts: number): boolean {
  return (meta.isTouched || submissionAttempts > 0) && !meta.isValid;
}

export function createTurnstileFormSchema(enabled: boolean, message: string) {
  return z.object({
    turnstileToken: enabled
      ? z.string().min(1, {
          message,
        })
      : z.string(),
  });
}

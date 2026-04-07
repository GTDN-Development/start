import { z } from "zod";
import { authConfig } from "@/config/auth";
import {
  authPasswordSchema,
  normalizedEmailSchema,
  type AuthPasswordValidationMessages,
} from "@/lib/schemas";

export type { AuthPasswordValidationMessages };

export type SignInValidationMessages = {
  email: string;
  passwordMin: string;
  passwordMax: string;
};

export type SignUpValidationMessages = {
  firstNameMin: string;
  firstNameMax: string;
  lastNameMin: string;
  lastNameMax: string;
  email: string;
  passwordMin: string;
  passwordMax: string;
};

export const signInInputSchema = z.object({
  email: normalizedEmailSchema(),
  password: authPasswordSchema(),
  rememberMe: z.boolean(),
});

export const signUpInputSchema = createSignUpInputSchema();

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export function createAuthPasswordSchema(messages?: AuthPasswordValidationMessages) {
  return authPasswordSchema(messages);
}

export function createSignInFormSchema(messages: SignInValidationMessages) {
  return z.object({
    email: z.email({
      message: messages.email,
    }),
    password: createAuthPasswordSchema({
      min: messages.passwordMin,
      max: messages.passwordMax,
    }),
    rememberMe: z.boolean(),
  });
}

export function createSignUpFormSchema(messages: SignUpValidationMessages) {
  return createSignUpFormInputSchema(messages);
}

function createSignUpInputSchema() {
  return z.object({
    firstName: z
      .string()
      .min(authConfig.limits.firstNameMinLength)
      .max(authConfig.limits.firstNameMaxLength),
    lastName: z
      .string()
      .min(authConfig.limits.lastNameMinLength)
      .max(authConfig.limits.lastNameMaxLength),
    email: normalizedEmailSchema(),
    password: authPasswordSchema(),
  });
}

function createSignUpFormInputSchema(messages: SignUpValidationMessages) {
  return z.object({
    firstName: z
      .string()
      .min(authConfig.limits.firstNameMinLength, {
        message: messages.firstNameMin,
      })
      .max(authConfig.limits.firstNameMaxLength, {
        message: messages.firstNameMax,
      }),
    lastName: z
      .string()
      .min(authConfig.limits.lastNameMinLength, {
        message: messages.lastNameMin,
      })
      .max(authConfig.limits.lastNameMaxLength, {
        message: messages.lastNameMax,
      }),
    email: z.email({
      message: messages.email,
    }),
    password: createAuthPasswordSchema({
      min: messages.passwordMin,
      max: messages.passwordMax,
    }),
  });
}

import { z } from "zod";
import { authConfig } from "@/config/auth";
import {
  normalizedEmailSchema,
  passwordPolicySchema,
  requiredPasswordSchema,
  type AuthPasswordValidationMessages,
} from "@/lib/schemas";

export type { AuthPasswordValidationMessages };

export type SignInValidationMessages = {
  email: string;
  passwordRequired: string;
};

export type SignUpValidationMessages = {
  firstNameMin: string;
  firstNameMax: string;
  lastNameMin: string;
  lastNameMax: string;
  email: string;
  passwordMin: string;
  passwordMax: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumber: string;
  passwordSpecialCharacter: string;
};

export const signInInputSchema = z.object({
  email: normalizedEmailSchema(),
  password: requiredPasswordSchema(),
  rememberMe: z.boolean(),
});

export const signUpInputSchema = createSignUpInputSchema();

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export function createSignInFormSchema(messages: SignInValidationMessages) {
  return z.object({
    email: z.email({
      message: messages.email,
    }),
    password: requiredPasswordSchema({
      required: messages.passwordRequired,
    }),
    rememberMe: z.boolean(),
  });
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
    password: passwordPolicySchema(),
  });
}

export function createSignUpFormSchema(messages: SignUpValidationMessages) {
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
    password: passwordPolicySchema({
      min: messages.passwordMin,
      max: messages.passwordMax,
      uppercase: messages.passwordUppercase,
      lowercase: messages.passwordLowercase,
      number: messages.passwordNumber,
      specialCharacter: messages.passwordSpecialCharacter,
    }),
  });
}

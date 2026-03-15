import { z } from "zod";
import { authConfig } from "@/config/auth";

export type AuthPasswordValidationMessages = {
  min?: string;
  max?: string;
};

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
  confirmPassword: string;
  passwordMismatch: string;
};

export const signInInputSchema = z.object({
  email: z.email(),
  password: createAuthPasswordSchema(),
  rememberMe: z.boolean(),
});

export const signUpInputSchema = createSignUpSchema();

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;

export function createAuthPasswordSchema(messages?: AuthPasswordValidationMessages) {
  return z
    .string()
    .min(authConfig.limits.passwordMinLength, {
      message: messages?.min,
    })
    .max(authConfig.limits.passwordMaxLength, {
      message: messages?.max,
    });
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
  return createSignUpSchema(messages);
}

function createSignUpSchema(messages?: SignUpValidationMessages) {
  return z
    .object({
      firstName: z
        .string()
        .min(authConfig.limits.firstNameMinLength, {
          message: messages?.firstNameMin,
        })
        .max(authConfig.limits.firstNameMaxLength, {
          message: messages?.firstNameMax,
        }),
      lastName: z
        .string()
        .min(authConfig.limits.lastNameMinLength, {
          message: messages?.lastNameMin,
        })
        .max(authConfig.limits.lastNameMaxLength, {
          message: messages?.lastNameMax,
        }),
      email: z.email({
        message: messages?.email,
      }),
      password: createAuthPasswordSchema({
        min: messages?.passwordMin,
        max: messages?.passwordMax,
      }),
      confirmPassword: createAuthPasswordSchema({
        min: messages?.confirmPassword,
        max: messages?.passwordMax,
      }),
    })
    .superRefine((values, ctx) => {
      if (values.password !== values.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          message: messages?.passwordMismatch,
          path: ["confirmPassword"],
        });
      }
    });
}

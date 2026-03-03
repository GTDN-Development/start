import { z } from "zod";

export const AUTH_FIRST_NAME_MIN_LENGTH = 2;
export const AUTH_FIRST_NAME_MAX_LENGTH = 50;
export const AUTH_LAST_NAME_MIN_LENGTH = 2;
export const AUTH_LAST_NAME_MAX_LENGTH = 50;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 100;

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
    .min(AUTH_PASSWORD_MIN_LENGTH, {
      message: messages?.min,
    })
    .max(AUTH_PASSWORD_MAX_LENGTH, {
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
        .min(AUTH_FIRST_NAME_MIN_LENGTH, {
          message: messages?.firstNameMin,
        })
        .max(AUTH_FIRST_NAME_MAX_LENGTH, {
          message: messages?.firstNameMax,
        }),
      lastName: z
        .string()
        .min(AUTH_LAST_NAME_MIN_LENGTH, {
          message: messages?.lastNameMin,
        })
        .max(AUTH_LAST_NAME_MAX_LENGTH, {
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

import { z } from "zod";
import { accountConfig } from "@/config/account";
import {
  authPasswordSchema,
  normalizedEmailSchema,
  refinePasswordMatch,
  requiredPasswordSchema,
} from "@/lib/schemas";

export const accountProfileNameMaxLength = accountConfig.limits.profileNameMaxLength;
export const accountAvatarMaxSizeBytes = accountConfig.limits.avatarMaxSizeBytes;

export const accountProfileInputSchema = z.object({
  name: z.string().trim().max(accountProfileNameMaxLength),
});

export const accountAvatarUploadInputSchema = z.object({
  avatar: z.custom<File>((value) => value instanceof File),
});

export const accountEmailChangeInputSchema = z.object({
  newEmail: normalizedEmailSchema(),
});

export const accountPasswordUpdateInputSchema = z
  .object({
    currentPassword: requiredPasswordSchema(),
    newPassword: authPasswordSchema(),
    confirmPassword: authPasswordSchema(),
  })
  .superRefine(
    refinePasswordMatch<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>({
      passwordField: "newPassword",
    })
  );

export const accountDeleteInputSchema = z.object({
  password: requiredPasswordSchema(),
});

export type AccountPasswordFormValues = z.infer<typeof accountPasswordUpdateInputSchema>;
export type AccountProfileFormValues = z.infer<typeof accountProfileInputSchema>;
export type AccountEmailChangeInput = z.infer<typeof accountEmailChangeInputSchema>;

export type AccountProfileNameValidationMessages = {
  max: string;
};

export type AccountEmailChangeValidationMessages = {
  email: string;
  sameAsCurrent: string;
  confirmed: string;
};

export type AccountPasswordValidationMessages = {
  currentPasswordRequired: string;
  newPasswordMin: string;
  newPasswordMax: string;
  newPasswordSameAsCurrent: string;
  confirmPasswordRequired: string;
  confirmPasswordMismatch: string;
};

export type AccountDeleteValidationMessages = {
  passwordRequired: string;
  acknowledged: string;
};

export function createAccountProfileNameFormSchema(messages: AccountProfileNameValidationMessages) {
  return z.object({
    name: z.string().trim().max(accountProfileNameMaxLength, {
      message: messages.max,
    }),
  });
}

export function createAccountEmailChangeValueSchema(messages?: { email?: string }) {
  return z
    .string()
    .trim()
    .toLowerCase()
    .pipe(
      z.email({
        message: messages?.email,
      })
    );
}

export function createAccountEmailChangeFormSchema(
  messages: AccountEmailChangeValidationMessages,
  normalizedCurrentEmail: string
) {
  return z.object({
    newEmail: createAccountEmailChangeValueSchema({
      email: messages.email,
    }).refine((value) => value !== normalizedCurrentEmail, {
      message: messages.sameAsCurrent,
    }),
    confirmed: z.boolean().refine((value) => value === true, {
      message: messages.confirmed,
    }),
  });
}

export function createAccountPasswordFormSchema(messages: AccountPasswordValidationMessages) {
  return z
    .object({
      currentPassword: z.string(),
      newPassword: authPasswordSchema({
        min: messages.newPasswordMin,
        max: messages.newPasswordMax,
      }),
      confirmPassword: z.string(),
    })
    .superRefine((value, context) => {
      if (!value.currentPassword.trim()) {
        context.addIssue({
          code: "custom",
          path: ["currentPassword"],
          message: messages.currentPasswordRequired,
        });
      }

      if (!value.confirmPassword) {
        context.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: messages.confirmPasswordRequired,
        });
      } else {
        refinePasswordMatch<AccountPasswordFormValues>({
          passwordField: "newPassword",
          message: messages.confirmPasswordMismatch,
        })(value, context);
      }

      if (
        value.currentPassword &&
        value.newPassword &&
        value.currentPassword === value.newPassword
      ) {
        context.addIssue({
          code: "custom",
          path: ["newPassword"],
          message: messages.newPasswordSameAsCurrent,
        });
      }
    });
}

export function createAccountDeleteFormSchema(messages: AccountDeleteValidationMessages) {
  return z.object({
    password: z.string().trim().min(1, {
      message: messages.passwordRequired,
    }),
    isDeletionAcknowledged: z.boolean().refine((value) => value === true, {
      message: messages.acknowledged,
    }),
  });
}

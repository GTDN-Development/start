import { z } from "zod";
import { WORKSPACE_INVITABLE_ROLE_VALUES } from "@/features/workspaces/workspace-role-rules";
import { workspaceConfig } from "@/config/workspace";
import { normalizedEmailSchema } from "@/lib/schemas";

export const workspaceNameMaxLength = workspaceConfig.limits.nameMaxLength;
export const workspaceSlugMaxLength = workspaceConfig.limits.slugMaxLength;
export const workspaceAvatarMaxSizeBytes = workspaceConfig.limits.avatarMaxSizeBytes;

export const workspaceNameSchema = z.string().trim().min(1).max(workspaceNameMaxLength);
export const workspaceSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(workspaceSlugMaxLength)
  .regex(workspaceConfig.validation.slugPattern);
export const workspaceIdSchema = z.string().trim().min(1);
export const workspaceInviteEmailSchema = normalizedEmailSchema();

export const createWorkspaceInputSchema = z.object({
  name: workspaceNameSchema,
  slug: workspaceSlugSchema.optional(),
});

export const updateWorkspaceGeneralInputSchema = z
  .object({
    name: workspaceNameSchema.optional(),
    slug: workspaceSlugSchema.optional(),
    removeAvatar: z.boolean().optional(),
    avatarFile: z.custom<File>((value) => value instanceof File).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.name === undefined &&
      value.slug === undefined &&
      value.removeAvatar !== true &&
      value.avatarFile === undefined
    ) {
      context.addIssue({
        code: "custom",
      });
    }

    if (value.avatarFile && value.removeAvatar === true) {
      context.addIssue({
        code: "custom",
        path: ["avatarFile"],
      });
    }
  });

export function createWorkspaceInviteInputSchema<TLocale extends string>(
  localeSchema: z.ZodType<TLocale>
) {
  return z.object({
    locale: localeSchema,
    email: workspaceInviteEmailSchema,
    role: z.enum(WORKSPACE_INVITABLE_ROLE_VALUES),
  });
}

export type WorkspaceCreateValidationMessages = {
  required: string;
  max: string;
};

export type WorkspaceUrlValidationMessages = {
  required: string;
  max: string;
};

export type WorkspaceConfirmationValidationMessages = {
  confirmationRequired: string;
  confirmationMismatch: string;
  acknowledged: string;
};

export function createWorkspaceNameFormSchema(messages: WorkspaceCreateValidationMessages) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: messages.required,
      })
      .max(workspaceNameMaxLength, {
        message: messages.max,
      }),
  });
}

export function createWorkspaceUrlFormSchema(messages: WorkspaceUrlValidationMessages) {
  return z.object({
    url: z
      .string()
      .trim()
      .min(1, {
        message: messages.required,
      })
      .max(workspaceSlugMaxLength, {
        message: messages.max,
      }),
  });
}

export function createWorkspaceLeaveFormSchema(
  workspaceSlug: string,
  messages: WorkspaceConfirmationValidationMessages
) {
  return z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: messages.confirmationRequired,
      })
      .refine((value) => value === workspaceSlug, {
        message: messages.confirmationMismatch,
      }),
    isLeavingAcknowledged: z.boolean().refine((value) => value === true, {
      message: messages.acknowledged,
    }),
  });
}

export function createWorkspaceDeleteFormSchema(
  workspaceSlug: string,
  messages: WorkspaceConfirmationValidationMessages
) {
  return z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: messages.confirmationRequired,
      })
      .refine((value) => value === workspaceSlug, {
        message: messages.confirmationMismatch,
      }),
    isDeletionAcknowledged: z.boolean().refine((value) => value === true, {
      message: messages.acknowledged,
    }),
  });
}

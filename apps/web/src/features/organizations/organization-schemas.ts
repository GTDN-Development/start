import { z } from "zod";
import { ORGANIZATION_INVITABLE_ROLE_VALUES } from "@/features/organizations/organization-role-rules";
import { organizationConfig } from "@/config/organization";
import { normalizedEmailSchema } from "@/lib/schemas";

export const organizationNameMaxLength = organizationConfig.limits.nameMaxLength;
export const organizationSlugMaxLength = organizationConfig.limits.slugMaxLength;
export const organizationAvatarMaxSizeBytes = organizationConfig.limits.avatarMaxSizeBytes;

export const organizationNameSchema = z.string().trim().min(1).max(organizationNameMaxLength);
export const organizationSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(organizationSlugMaxLength)
  .regex(organizationConfig.validation.slugPattern);
export const organizationIdSchema = z.string().trim().min(1);
export const organizationInviteEmailSchema = normalizedEmailSchema();

export const createOrganizationInputSchema = z.object({
  name: organizationNameSchema,
  slug: organizationSlugSchema.optional(),
});

export const updateOrganizationGeneralInputSchema = z
  .object({
    name: organizationNameSchema.optional(),
    slug: organizationSlugSchema.optional(),
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

export function createOrganizationInviteInputSchema<TLocale extends string>(
  localeSchema: z.ZodType<TLocale>
) {
  return z.object({
    locale: localeSchema,
    email: organizationInviteEmailSchema,
    role: z.enum(ORGANIZATION_INVITABLE_ROLE_VALUES),
  });
}

export type OrganizationCreateValidationMessages = {
  required: string;
  max: string;
};

export type OrganizationConfirmationValidationMessages = {
  confirmationRequired: string;
  confirmationMismatch: string;
  acknowledged: string;
};

export function createOrganizationNameFormSchema(messages: OrganizationCreateValidationMessages) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, {
        message: messages.required,
      })
      .max(organizationNameMaxLength, {
        message: messages.max,
      }),
  });
}

export function createOrganizationSlugTextFormSchema(
  messages: OrganizationCreateValidationMessages
) {
  return z.object({
    slug: z
      .string()
      .trim()
      .min(1, {
        message: messages.required,
      })
      .max(organizationSlugMaxLength, {
        message: messages.max,
      }),
  });
}

export function createOrganizationConfirmationFormSchema(
  organizationSlug: string,
  messages: OrganizationConfirmationValidationMessages
) {
  return z.object({
    confirmationUrl: z
      .string()
      .trim()
      .min(1, {
        message: messages.confirmationRequired,
      })
      .refine((value) => value === organizationSlug, {
        message: messages.confirmationMismatch,
      }),
    isAcknowledged: z.boolean().refine((value) => value === true, {
      message: messages.acknowledged,
    }),
  });
}

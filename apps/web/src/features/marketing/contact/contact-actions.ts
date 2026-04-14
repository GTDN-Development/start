"use server";

import { headers } from "next/headers";
import type Mail from "nodemailer/lib/mailer";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { isTurnstileEnabled } from "@/config/security";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import { requireCurrentWritableUser } from "@/server/auth/current-user";
import { sendFormEmail } from "@/server/email/email-transport";
import { renderEmail } from "@/server/email/render-email";
import { buildContactFormEmail } from "@/server/email/templates/contact-form.builder";
import { buildSupportFormEmail } from "@/server/email/templates/support-form.builder";
import {
  SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES,
  type SupportAttachmentValue,
} from "@/features/marketing/contact/support-attachments";

const turnstileEnabled = isTurnstileEnabled();

const contactFormPayloadSchema = z.object({
  fullName: z.string().trim().min(1),
  email: normalizedEmailSchema(),
  phone: z.string().trim().min(1),
  message: z.string().trim().min(1),
  gdprConsent: z.literal(true),
  turnstileToken: turnstileTokenSchema({
    enabled: turnstileEnabled,
  }),
});

const supportFormPayloadSchema = z.object({
  message: z.string().trim().min(1),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        data: z.string(),
        mimeType: z.string(),
        size: z.number().int().nonnegative(),
      })
    )
    .optional()
    .default([]),
});

type MarketingActionErrorCode = "BAD_REQUEST" | "INTERNAL_ERROR" | "TURNSTILE_VERIFICATION_FAILED";

export type MarketingActionResponse =
  | { ok: true }
  | { ok: false; errorCode: MarketingActionErrorCode };

export async function submitContactFormAction(input: {
  fullName: string;
  email: string;
  phone: string;
  message: string;
  gdprConsent: boolean;
  turnstileToken?: string;
}): Promise<MarketingActionResponse> {
  const parsedInput = contactFormPayloadSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  const turnstileVerification = await verifyMarketingTurnstileToken(
    parsedInput.data.turnstileToken
  );

  if (!turnstileVerification.success) {
    return createErrorResponse("TURNSTILE_VERIFICATION_FAILED");
  }

  try {
    await sendFormEmail(
      await renderEmail(
        await buildContactFormEmail({
          locale: routing.defaultLocale,
          fullName: parsedInput.data.fullName,
          email: parsedInput.data.email,
          phone: parsedInput.data.phone,
          message: parsedInput.data.message,
          submittedAt: new Date(),
        })
      )
    );

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Contact form action error:", error);

    return createErrorResponse("INTERNAL_ERROR");
  }
}

export async function submitSupportFormAction(input: {
  message: string;
  attachments?: SupportAttachmentValue[];
}): Promise<MarketingActionResponse> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    await applyServerActionAuthCookies(currentUser.setCookie);

    return createErrorResponse("BAD_REQUEST");
  }

  const parsedInput = supportFormPayloadSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  if (
    getSupportAttachmentsTotalDecodedSize(parsedInput.data.attachments) >
    SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES
  ) {
    return createErrorResponse("BAD_REQUEST");
  }

  try {
    const attachments: Mail.Attachment[] | undefined =
      parsedInput.data.attachments.length > 0
        ? parsedInput.data.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.data, "base64"),
            contentType: attachment.mimeType,
          }))
        : undefined;

    await sendFormEmail(
      await renderEmail(
        await buildSupportFormEmail({
          locale: routing.defaultLocale,
          email: currentUser.user.email,
          message: parsedInput.data.message,
          submittedAt: new Date(),
          attachments,
        })
      )
    );

    return { ok: true };
  } catch (error) {
    console.error("Support form action error:", error);
    return createErrorResponse("INTERNAL_ERROR");
  }
}

async function verifyMarketingTurnstileToken(turnstileToken: string) {
  const requestHeaders = await headers();
  const clientIP = getClientIPFromHeaders(requestHeaders);

  return verifyTurnstileToken(turnstileToken, clientIP);
}

function createErrorResponse(errorCode: MarketingActionErrorCode): MarketingActionResponse {
  return {
    ok: false,
    errorCode,
  };
}

function getSupportAttachmentsTotalDecodedSize(attachments: SupportAttachmentValue[]): number {
  return attachments.reduce(
    (total, attachment) => total + Buffer.byteLength(attachment.data, "base64"),
    0
  );
}

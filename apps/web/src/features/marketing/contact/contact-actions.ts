"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { isTurnstileEnabled } from "@/config/security";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { createPocketBaseClient } from "@/server/pocketbase/pocketbase-server";
import { withInternalPocketBaseHeaders } from "@/server/pocketbase/pocketbase-internal";
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
  message: z.string().trim().min(10).max(1000),
  attachments: z
    .array(
      z.object({
        filename: z.string().trim().min(1),
        data: z.base64(),
        mimeType: z.string().trim().min(1),
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
    const pb = createPocketBaseClient();

    await pb.send(
      "/api/web/contact-requests/email",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          fullName: parsedInput.data.fullName,
          email: parsedInput.data.email,
          phone: parsedInput.data.phone,
          message: parsedInput.data.message,
        },
      })
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
    await applyServerActionAuthCookies(currentUser.cookieMutations);

    return createErrorResponse("BAD_REQUEST");
  }

  const parsedInput = supportFormPayloadSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  const attachments = parsedInput.data.attachments.map((attachment) => ({
    filename: attachment.filename,
    content: Buffer.from(attachment.data, "base64"),
    contentType: attachment.mimeType,
    size: attachment.size,
  }));
  const totalAttachmentSize = attachments.reduce(
    (total, attachment) => total + attachment.content.byteLength,
    0
  );
  const hasInvalidAttachmentSize = attachments.some(
    (attachment, index) =>
      attachment.content.byteLength !== parsedInput.data.attachments[index].size
  );

  if (totalAttachmentSize > SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES || hasInvalidAttachmentSize) {
    return createErrorResponse("BAD_REQUEST");
  }

  try {
    await currentUser.pb.send(
      "/api/web/support-requests/email",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          message: parsedInput.data.message,
          attachments:
            attachments.length > 0
              ? attachments.map((attachment) => ({
                  filename: attachment.filename,
                  bytes: Array.from(attachment.content),
                  mimeType: attachment.contentType,
                  size: attachment.size,
                }))
              : undefined,
        },
      })
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

"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { formatEmailTimestamp } from "@/lib/utils";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { escapeHtml, sendFormEmail } from "@/server/email/send-form-email";
import { requireCurrentUser } from "@/server/auth/current-user";
import {
  SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES,
  type SupportAttachmentValue,
} from "@/features/marketing/contact/support-attachments";

const contactFormPayloadSchema = z.object({
  fullName: z.string().trim().min(1),
  email: normalizedEmailSchema(),
  phone: z.string().trim().min(1),
  message: z.string().trim().min(1),
  gdprConsent: z.literal(true),
  turnstileToken: turnstileTokenSchema(),
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

const newsletterPayloadSchema = z.object({
  email: normalizedEmailSchema(),
  turnstileToken: turnstileTokenSchema(),
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
  turnstileToken: string;
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
    const timestamp = formatEmailTimestamp();
    const messageHtml = escapeHtml(parsedInput.data.message).replace(/\n/g, "<br>");

    await sendFormEmail({
      subject: `Nová zpráva z kontaktního formuláře - ${parsedInput.data.fullName}`,
      html: `
        <h2>Nová zpráva z kontaktního formuláře</h2>
        <p><strong>Jméno a příjmení:</strong> ${escapeHtml(parsedInput.data.fullName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(parsedInput.data.email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(parsedInput.data.phone)}</p>
        <p><strong>Zpráva:</strong></p>
        <p>${messageHtml}</p>
        <p><em>Odesláno: ${timestamp}</em></p>
      `,
      text: `
          Nová zpráva z kontaktního formuláře

          Jméno a příjmení: ${parsedInput.data.fullName}
          Email: ${parsedInput.data.email}
          Telefon: ${parsedInput.data.phone}
          Zpráva: ${parsedInput.data.message}

          Odesláno: ${timestamp}
      `,
    });

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
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return createErrorResponse("BAD_REQUEST");
  }

  const parsedInput = supportFormPayloadSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  if (getSupportAttachmentsTotalDecodedSize(parsedInput.data.attachments) > SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES) {
    return createErrorResponse("BAD_REQUEST");
  }

  try {
    const timestamp = formatEmailTimestamp();
    const messageHtml = escapeHtml(parsedInput.data.message).replace(/\n/g, "<br>");
    const userEmail = escapeHtml(currentUser.user.email);

    const attachments =
      parsedInput.data.attachments.length > 0
        ? parsedInput.data.attachments.map((attachment) => ({
            filename: attachment.filename,
            content: Buffer.from(attachment.data, "base64"),
            contentType: attachment.mimeType,
          }))
        : undefined;

    await sendFormEmail({
      subject: `Nová zpráva z formuláře podpory - ${userEmail}`,
      html: `
        <h2>Nová zpráva z formuláře podpory</h2>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Zpráva:</strong></p>
        <p>${messageHtml}</p>
        <p><em>Odesláno: ${timestamp}</em></p>
      `,
      text: `
          Nová zpráva z formuláře podpory

          Email: ${userEmail}
          Zpráva: ${parsedInput.data.message}

          Odesláno: ${timestamp}
      `,
      attachments,
    });

    return { ok: true };
  } catch (error) {
    console.error("Support form action error:", error);
    return createErrorResponse("INTERNAL_ERROR");
  }
}

export async function submitNewsletterFormAction(input: {
  email: string;
  turnstileToken: string;
}): Promise<MarketingActionResponse> {
  const parsedInput = newsletterPayloadSchema.safeParse(input);

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
    const timestamp = formatEmailTimestamp();

    await sendFormEmail({
      subject: `Nové přihlášení k newsletteru - ${parsedInput.data.email}`,
      html: `
        <h2>Nové přihlášení k newsletteru</h2>
        <p><strong>Email:</strong> ${escapeHtml(parsedInput.data.email)}</p>
        <p><em>Přihlášeno: ${timestamp}</em></p>
      `,
      text: `
          Nové přihlášení k newsletteru

          Email: ${parsedInput.data.email}

          Přihlášeno: ${timestamp}
      `,
    });

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Newsletter form action error:", error);

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

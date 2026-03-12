"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { formatEmailTimestamp } from "@/lib/utils";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { escapeHtml, sendFormEmail } from "@/server/email/send-form-email";

const contactFormPayloadSchema = z.object({
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  email: z.email().transform((value) => value.trim()),
  phone: z.string().trim().min(1),
  message: z.string().trim().min(1),
  gdprConsent: z.literal(true),
  turnstileToken: z.string().min(1),
});

const newsletterPayloadSchema = z.object({
  email: z.email().transform((value) => value.trim()),
  turnstileToken: z.string().min(1),
});

type MarketingActionErrorCode = "BAD_REQUEST" | "INTERNAL_ERROR" | "TURNSTILE_VERIFICATION_FAILED";

export type MarketingActionResponse =
  | { ok: true }
  | { ok: false; errorCode: MarketingActionErrorCode };

export async function submitContactFormAction(input: {
  name: string;
  surname: string;
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
      subject: `Nová zpráva z kontaktního formuláře - ${parsedInput.data.name} ${parsedInput.data.surname}`,
      html: `
        <h2>Nová zpráva z kontaktního formuláře</h2>
        <p><strong>Jméno:</strong> ${escapeHtml(parsedInput.data.name)}</p>
        <p><strong>Příjmení:</strong> ${escapeHtml(parsedInput.data.surname)}</p>
        <p><strong>Email:</strong> ${escapeHtml(parsedInput.data.email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(parsedInput.data.phone)}</p>
        <p><strong>Zpráva:</strong></p>
        <p>${messageHtml}</p>
        <p><em>Odesláno: ${timestamp}</em></p>
      `,
      text: `
          Nová zpráva z kontaktního formuláře

          Jméno: ${parsedInput.data.name}
          Příjmení: ${parsedInput.data.surname}
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

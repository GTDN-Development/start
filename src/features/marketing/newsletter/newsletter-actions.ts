"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { isTurnstileEnabled } from "@/config/security";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { sendFormEmail } from "@/server/email/email-transport";
import { renderEmail } from "@/server/email/render-email";
import { buildNewsletterSignupEmail } from "@/server/email/templates/newsletter-signup.builder";

const turnstileEnabled = isTurnstileEnabled();

const newsletterPayloadSchema = z.object({
  email: normalizedEmailSchema(),
  turnstileToken: turnstileTokenSchema({
    enabled: turnstileEnabled,
  }),
});

type NewsletterActionErrorCode = "BAD_REQUEST" | "INTERNAL_ERROR" | "TURNSTILE_VERIFICATION_FAILED";

type NewsletterActionResponse = { ok: true } | { ok: false; errorCode: NewsletterActionErrorCode };

export async function submitNewsletterFormAction(input: {
  email: string;
  turnstileToken?: string;
}): Promise<NewsletterActionResponse> {
  const parsedInput = newsletterPayloadSchema.safeParse(input);

  if (!parsedInput.success) {
    return createErrorResponse("BAD_REQUEST");
  }

  const turnstileVerification = await verifyNewsletterTurnstileToken(
    parsedInput.data.turnstileToken
  );

  if (!turnstileVerification.success) {
    return createErrorResponse("TURNSTILE_VERIFICATION_FAILED");
  }

  try {
    await sendFormEmail(
      await renderEmail(
        await buildNewsletterSignupEmail({
          locale: routing.defaultLocale,
          email: parsedInput.data.email,
          subscribedAt: new Date(),
        })
      )
    );

    return {
      ok: true,
    };
  } catch (error) {
    console.error("Newsletter form action error:", error);

    return createErrorResponse("INTERNAL_ERROR");
  }
}

async function verifyNewsletterTurnstileToken(turnstileToken: string) {
  const requestHeaders = await headers();
  const clientIP = getClientIPFromHeaders(requestHeaders);

  return verifyTurnstileToken(turnstileToken, clientIP);
}

function createErrorResponse(errorCode: NewsletterActionErrorCode): NewsletterActionResponse {
  return {
    ok: false,
    errorCode,
  };
}

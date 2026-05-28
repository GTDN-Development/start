"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { routing, type AppLocale } from "@/i18n/routing";
import { isTurnstileEnabled } from "@/config/security";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { createPocketBaseClient } from "@/server/pocketbase/pocketbase-server";
import { withInternalPocketBaseHeaders } from "@/server/pocketbase/pocketbase-internal";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";

const turnstileEnabled = isTurnstileEnabled();

const newsletterPayloadSchema = z.object({
  email: normalizedEmailSchema(),
  locale: z.enum(routing.locales),
  turnstileToken: turnstileTokenSchema({
    enabled: turnstileEnabled,
  }),
});

type NewsletterActionErrorCode = "BAD_REQUEST" | "INTERNAL_ERROR" | "TURNSTILE_VERIFICATION_FAILED";

type NewsletterActionResponse = { ok: true } | { ok: false; errorCode: NewsletterActionErrorCode };

export async function submitNewsletterFormAction(input: {
  email: string;
  locale: string;
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

  const subscriptionResult = await recordNewsletterSubscription({
    email: parsedInput.data.email,
    locale: parsedInput.data.locale,
  });

  if (!subscriptionResult.ok) {
    return createErrorResponse("INTERNAL_ERROR");
  }

  return {
    ok: true,
  };
}

async function recordNewsletterSubscription(input: { email: string; locale: AppLocale }): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
    }
> {
  try {
    const pb = createPocketBaseClient();

    await pb.send(
      "/api/start/newsletter-signups",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          email: input.email,
          locale: input.locale,
        },
      })
    );

    return {
      ok: true,
    };
  } catch (error) {
    logServiceError("newsletter", "recordNewsletterSubscription", error);

    return {
      ok: false,
    };
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

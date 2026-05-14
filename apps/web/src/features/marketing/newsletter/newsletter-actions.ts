"use server";

import { headers } from "next/headers";
import { ClientResponseError } from "pocketbase";
import { z } from "zod";
import { routing, type AppLocale } from "@/i18n/routing";
import { isTurnstileEnabled } from "@/config/security";
import { normalizedEmailSchema, turnstileTokenSchema } from "@/lib/schemas";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { sendFormEmail } from "@/server/email/email-transport";
import { renderEmail } from "@/server/email/render-email";
import { buildNewsletterSignupEmail } from "@/server/email/templates/newsletter-signup.builder";
import { createPocketBaseClient } from "@/server/pocketbase/pocketbase-server";
import { hasValidationCode, logServiceError } from "@/server/pocketbase/pocketbase-utils";

const NEWSLETTER_SUBSCRIPTION_SOURCE = "marketing_newsletter_form";

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

  if (subscriptionResult.status === "created") {
    await sendNewsletterSignupNotification({
      email: parsedInput.data.email,
      locale: parsedInput.data.locale,
    });
  }

  return {
    ok: true,
  };
}

async function recordNewsletterSubscription(input: { email: string; locale: AppLocale }): Promise<
  | {
      ok: true;
      status: "created" | "duplicate";
    }
  | {
      ok: false;
    }
> {
  try {
    const pb = createPocketBaseClient();

    await pb.collection("newsletter_subscriptions").create({
      email: input.email,
      locale: input.locale,
      source: NEWSLETTER_SUBSCRIPTION_SOURCE,
    });

    return {
      ok: true,
      status: "created",
    };
  } catch (error) {
    if (
      error instanceof ClientResponseError &&
      hasValidationCode(error.response?.data, "email", "validation_not_unique")
    ) {
      return {
        ok: true,
        status: "duplicate",
      };
    }

    logServiceError("newsletter", "recordNewsletterSubscription", error);

    return {
      ok: false,
    };
  }
}

async function sendNewsletterSignupNotification(input: { email: string; locale: AppLocale }) {
  try {
    await sendFormEmail(
      await renderEmail(
        await buildNewsletterSignupEmail({
          locale: input.locale,
          email: input.email,
          subscribedAt: new Date(),
        })
      )
    );
  } catch (error) {
    logServiceError("newsletter", "sendNewsletterSignupNotification", error);
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

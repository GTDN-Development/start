import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api-route";
import { escapeHtml, sendFormEmail } from "@/lib/form-email";
import { verifyTurnstileToken, getClientIP } from "@/lib/turnstile";
import { formatEmailTimestamp } from "@/lib/utils";

const newsletterPayloadSchema = z.object({
  email: z.email().transform((value) => value.trim()),
  turnstileToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, newsletterPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const clientIP = getClientIP(request);
    const turnstileResult = await verifyTurnstileToken(body.turnstileToken, clientIP);

    if (!turnstileResult.success) {
      return jsonError("TURNSTILE_VERIFICATION_FAILED", 400);
    }

    const timestamp = formatEmailTimestamp();

    await sendFormEmail({
      subject: `New newsletter subscription - ${body.email}`,
      html: `
        <h2>New newsletter subscription</h2>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><em>Subscribed: ${timestamp}</em></p>
      `,
      text: `
          New newsletter subscription

          Email: ${body.email}

          Subscribed: ${timestamp}
      `,
    });

    return jsonOk({ message: "Successfully subscribed to newsletter!" }, 200);
  } catch (error) {
    console.error("Newsletter API error:", error);
    return jsonError("INTERNAL_ERROR", 500);
  }
}

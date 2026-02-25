import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api-route";
import { escapeHtml, sendFormEmail } from "@/lib/form-email";
import { verifyTurnstileToken, getClientIP } from "@/lib/turnstile";
import { formatEmailTimestamp } from "@/lib/utils";

const contactFormPayloadSchema = z.object({
  name: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  email: z.email().transform((value) => value.trim()),
  phone: z.string().trim().min(1),
  message: z.string().trim().min(1),
  gdprConsent: z.literal(true),
  turnstileToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, contactFormPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const clientIP = getClientIP(request);
    const turnstileResult = await verifyTurnstileToken(body.turnstileToken, clientIP);

    if (!turnstileResult.success) {
      return jsonError("TURNSTILE_VERIFICATION_FAILED", 400);
    }

    const timestamp = formatEmailTimestamp();
    const messageHtml = escapeHtml(body.message).replace(/\n/g, "<br>");

    await sendFormEmail({
      subject: `New contact form message from ${body.name} ${body.surname}`,
      html: `
        <h2>New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(body.name)}</p>
        <p><strong>Surname:</strong> ${escapeHtml(body.surname)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(body.phone)}</p>
        <p><strong>Message:</strong></p>
        <p>${messageHtml}</p>
        <p><em>Sent: ${timestamp}</em></p>
      `,
      text: `
          New contact form message

          Name: ${body.name}
          Surname: ${body.surname}
          Email: ${body.email}
          Phone: ${body.phone}
          Message: ${body.message}

          Sent: ${timestamp}
      `,
    });

    return jsonOk({ message: "Message sent successfully!" }, 200);
  } catch (error) {
    console.error("Contact form API error:", error);
    return jsonError("INTERNAL_ERROR", 500);
  }
}

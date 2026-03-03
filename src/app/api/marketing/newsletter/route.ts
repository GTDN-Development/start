import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendFormEmail } from "@/server/email/send-form-email";
import { verifyTurnstileToken, getClientIP } from "@/server/captcha/turnstile";
import { parseRequestJson } from "@/server/http/request-utils";
import { formatEmailTimestamp } from "@/lib/utils";

const newsletterPayloadSchema = z.object({
  email: z.email().transform((value) => value.trim()),
  turnstileToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const parsedBody = newsletterPayloadSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const body = parsedBody.data;

    const clientIP = getClientIP(request);
    const turnstileResult = await verifyTurnstileToken(body.turnstileToken, clientIP);

    if (!turnstileResult.success) {
      return NextResponse.json(
        { ok: false, errorCode: "TURNSTILE_VERIFICATION_FAILED" },
        { status: 400 }
      );
    }

    const timestamp = formatEmailTimestamp();

    await sendFormEmail({
      subject: `Nové přihlášení k newsletteru - ${body.email}`,
      html: `
        <h2>Nové přihlášení k newsletteru</h2>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><em>Přihlášeno: ${timestamp}</em></p>
      `,
      text: `
          Nové přihlášení k newsletteru

          Email: ${body.email}

          Přihlášeno: ${timestamp}
      `,
    });

    return NextResponse.json(
      { ok: true, message: "Successfully subscribed to newsletter!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

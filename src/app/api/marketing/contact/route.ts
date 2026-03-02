import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { escapeHtml, sendFormEmail } from "@/server/email/send-form-email";
import { verifyTurnstileToken, getClientIP } from "@/server/captcha/turnstile";
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
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const parsedBody = contactFormPayloadSchema.safeParse(rawBody);

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
    const messageHtml = escapeHtml(body.message).replace(/\n/g, "<br>");

    await sendFormEmail({
      subject: `Nová zpráva z kontaktního formuláře - ${body.name} ${body.surname}`,
      html: `
        <h2>Nová zpráva z kontaktního formuláře</h2>
        <p><strong>Jméno:</strong> ${escapeHtml(body.name)}</p>
        <p><strong>Příjmení:</strong> ${escapeHtml(body.surname)}</p>
        <p><strong>Email:</strong> ${escapeHtml(body.email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(body.phone)}</p>
        <p><strong>Zpráva:</strong></p>
        <p>${messageHtml}</p>
        <p><em>Odesláno: ${timestamp}</em></p>
      `,
      text: `
          Nová zpráva z kontaktního formuláře

          Jméno: ${body.name}
          Příjmení: ${body.surname}
          Email: ${body.email}
          Telefon: ${body.phone}
          Zpráva: ${body.message}

          Odesláno: ${timestamp}
      `,
    });

    return NextResponse.json({ ok: true, message: "Message sent successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Contact form API error:", error);
    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

async function parseRequestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

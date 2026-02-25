import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ClientResponseError } from "pocketbase";
import { z } from "zod";
import { createPocketBaseClient } from "@/lib/pocketbase/server";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api-route";
import type { CookieConsentEventsRecord } from "@/types/pocketbase";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_VERSION,
  COOKIE_SUBJECT_KEY_NAME,
  type CookieConsentEventRequest,
  normalizeConsent,
} from "@/components/(shared)/cookies/consent";

const cookieConsentEventRequestSchema = z.object({
  consent: z
    .object({
      necessary: z.literal(true),
      functional: z.boolean(),
      analytics: z.boolean(),
      marketing: z.boolean(),
    })
    .transform((value) => normalizeConsent(value)),
  eventType: z.enum(["accept_all", "reject_all", "save_preferences", "withdraw"]),
  locale: z.string().trim().min(2).max(20),
  idempotencyKey: z.string().trim().min(8).max(128),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, cookieConsentEventRequestSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const cookieStore = await cookies();
    const subjectKeyCookie = cookieStore.get(COOKIE_SUBJECT_KEY_NAME)?.value?.trim();
    const subjectKey = subjectKeyCookie || createSubjectKey();

    const pb = await createCookieConsentWriterClient();
    const recordData = createRecordData(body, subjectKey);

    await pb.collection("cookie_consent_events").create(recordData);

    const response = jsonOk(201);
    setSubjectKeyCookie(response, subjectKeyCookie, subjectKey);

    return response;
  } catch (error) {
    if (isDuplicateIdempotencyKeyError(error)) {
      return jsonOk({ duplicate: true }, 200);
    }

    console.error("Cookie consent API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function createRecordData(body: CookieConsentEventRequest, subjectKey: string) {
  return {
    subject_key: subjectKey,
    event_type: body.eventType,
    preferences: body.consent.functional,
    analytics: body.consent.analytics,
    marketing: body.consent.marketing,
    consent_version: COOKIE_CONSENT_VERSION,
    consent_snapshot: body.consent,
    locale: body.locale,
    idempotency_key: body.idempotencyKey,
  } satisfies Pick<
    CookieConsentEventsRecord,
    | "subject_key"
    | "event_type"
    | "preferences"
    | "analytics"
    | "marketing"
    | "consent_version"
    | "consent_snapshot"
    | "locale"
    | "idempotency_key"
  >;
}

function setSubjectKeyCookie(
  response: NextResponse,
  existingSubjectKey: string | undefined,
  subjectKey: string
) {
  if (existingSubjectKey) {
    return;
  }

  response.cookies.set({
    name: COOKIE_SUBJECT_KEY_NAME,
    value: subjectKey,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
  });
}

async function createCookieConsentWriterClient() {
  const pb = createPocketBaseClient();
  const email = getRequiredWriterEnv("PB_SUPERUSER_EMAIL");
  const password = getRequiredWriterEnv("PB_SUPERUSER_PASSWORD");

  await pb.collection("_superusers").authWithPassword(email, password);

  return pb;
}

function getRequiredWriterEnv(name: "PB_SUPERUSER_EMAIL" | "PB_SUPERUSER_PASSWORD") {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  throw new Error(`Missing PocketBase cookie consent writer credential: ${name}`);
}

function createSubjectKey() {
  const id = crypto.randomUUID().replace(/-/g, "");
  return `ccs_${id}`;
}

function isDuplicateIdempotencyKeyError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  const data = getObjectRecord(error.response?.data);
  const idempotencyFieldError = getObjectRecord(data.idempotency_key);

  return idempotencyFieldError.code === "validation_not_unique";
}

function getObjectRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

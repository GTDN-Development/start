import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import PocketBase, { ClientResponseError } from "pocketbase";
import { createPocketBaseClient } from "@/lib/pocketbase/server";
import type { CookieConsentEventsRecord } from "@/types/pocketbase";
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_VERSION,
  COOKIE_SUBJECT_KEY_NAME,
  type ConsentState,
  type CookieConsentEventRequest,
  type CookieConsentEventType,
  normalizeConsent,
} from "@/components/(shared)/cookies/consent";

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);

    if (!body) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const subjectKeyCookie = cookieStore.get(COOKIE_SUBJECT_KEY_NAME)?.value?.trim();
    const subjectKey = subjectKeyCookie || createSubjectKey();

    const pb = await createCookieConsentWriterClient();
    const recordData = createRecordData(body, subjectKey);

    await pb.collection("cookie_consent_events").create(recordData);

    const response = NextResponse.json({ ok: true }, { status: 201 });
    setSubjectKeyCookie(response, subjectKeyCookie, subjectKey);

    return response;
  } catch (error) {
    if (isDuplicateIdempotencyKeyError(error)) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    console.error("Cookie consent API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

async function parseRequestBody(request: NextRequest): Promise<CookieConsentEventRequest | null> {
  let rawBody: unknown;

  try {
    rawBody = (await request.json()) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(rawBody)) {
    return null;
  }

  const eventType = parseEventType(rawBody.eventType);
  const locale = parseLocale(rawBody.locale);
  const idempotencyKey = parseIdempotencyKey(rawBody.idempotencyKey);

  if (!eventType || !locale || !idempotencyKey) {
    return null;
  }

  const consent = parseConsent(rawBody.consent);

  if (!consent) {
    return null;
  }

  return {
    consent,
    eventType,
    locale,
    idempotencyKey,
  };
}

function parseConsent(value: unknown): ConsentState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.necessary !== true) {
    return null;
  }

  if (typeof value.functional !== "boolean") {
    return null;
  }

  if (typeof value.analytics !== "boolean") {
    return null;
  }

  if (typeof value.marketing !== "boolean") {
    return null;
  }

  return normalizeConsent(value);
}

function parseEventType(value: unknown): CookieConsentEventType | null {
  if (
    value === "accept_all" ||
    value === "reject_all" ||
    value === "save_preferences" ||
    value === "withdraw"
  ) {
    return value;
  }

  return null;
}

function parseLocale(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length < 2 || normalized.length > 20) {
    return null;
  }

  return normalized;
}

function parseIdempotencyKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!normalized || normalized.length < 8 || normalized.length > 128) {
    return null;
  }

  return normalized;
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

  await authenticateSuperuser(pb, email, password);

  return pb;
}

function getRequiredWriterEnv(name: "PB_SUPERUSER_EMAIL" | "PB_SUPERUSER_PASSWORD") {
  const value = process.env[name]?.trim();

  if (value) {
    return value;
  }

  throw new Error(`Missing PocketBase cookie consent writer credential: ${name}`);
}

async function authenticateSuperuser(pb: PocketBase, email: string, password: string) {
  await pb.collection("_superusers").authWithPassword(email, password);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

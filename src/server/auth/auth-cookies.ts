import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

type ParsedSetCookie = {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

export async function applyServerActionAuthCookies(setCookie: string[] | undefined): Promise<void> {
  if (!setCookie?.length) {
    return;
  }

  const cookieStore = await cookies();

  for (const setCookieValue of setCookie) {
    const parsedCookie = parseSetCookie(setCookieValue);

    if (!parsedCookie) {
      continue;
    }

    cookieStore.set(getWritableCookie(parsedCookie));
  }
}

export function appendAuthCookiesToResponse(
  response: NextResponse,
  setCookie: string[] | undefined
): NextResponse {
  if (!setCookie?.length) {
    return response;
  }

  for (const setCookieValue of setCookie) {
    const parsedCookie = parseSetCookie(setCookieValue);

    if (!parsedCookie) {
      continue;
    }

    response.cookies.set(getWritableCookie(parsedCookie));
  }

  return response;
}

function parseSetCookie(setCookieValue: string): ParsedSetCookie | null {
  const segments = setCookieValue
    .split(";")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const baseSegment = segments[0];
  const separatorIndex = baseSegment.indexOf("=");

  if (separatorIndex < 1) {
    return null;
  }

  const name = baseSegment.slice(0, separatorIndex);
  const value = baseSegment.slice(separatorIndex + 1);

  const parsedCookie: ParsedSetCookie = {
    name,
    value,
  };

  for (const segment of segments.slice(1)) {
    const [attributeName, ...attributeValueParts] = segment.split("=");
    const normalizedAttributeName = attributeName.trim().toLowerCase();
    const attributeValue = attributeValueParts.join("=").trim();

    if (normalizedAttributeName === "path") {
      parsedCookie.path = attributeValue;
      continue;
    }

    if (normalizedAttributeName === "domain") {
      parsedCookie.domain = attributeValue;
      continue;
    }

    if (normalizedAttributeName === "expires") {
      const parsedDate = new Date(attributeValue);

      if (!Number.isNaN(parsedDate.getTime())) {
        parsedCookie.expires = parsedDate;
      }
      continue;
    }

    if (normalizedAttributeName === "max-age") {
      const parsedMaxAge = Number.parseInt(attributeValue, 10);

      if (Number.isFinite(parsedMaxAge)) {
        parsedCookie.maxAge = parsedMaxAge;
      }
      continue;
    }

    if (normalizedAttributeName === "secure") {
      parsedCookie.secure = true;
      continue;
    }

    if (normalizedAttributeName === "httponly") {
      parsedCookie.httpOnly = true;
      continue;
    }

    if (normalizedAttributeName === "samesite") {
      const normalizedSameSite = normalizeSameSite(attributeValue);

      if (normalizedSameSite) {
        parsedCookie.sameSite = normalizedSameSite;
      }
    }
  }

  return parsedCookie;
}

function normalizeSameSite(value: string): ParsedSetCookie["sameSite"] | null {
  const normalizedValue = value.toLowerCase();

  if (normalizedValue === "lax" || normalizedValue === "strict" || normalizedValue === "none") {
    return normalizedValue;
  }

  return null;
}

function isClearedCookie(cookie: ParsedSetCookie): boolean {
  if (cookie.maxAge !== undefined && cookie.maxAge <= 0) {
    return true;
  }

  if (cookie.expires && cookie.expires.getTime() <= 0) {
    return true;
  }

  return cookie.value.length === 0;
}

function getWritableCookie(cookie: ParsedSetCookie): ParsedSetCookie {
  if (!isClearedCookie(cookie)) {
    return cookie;
  }

  return {
    ...cookie,
    value: "",
    maxAge: 0,
    expires: new Date(0),
  };
}

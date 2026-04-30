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

    cookieStore.set(parsedCookie);
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
    response.headers.append("Set-Cookie", setCookieValue);
  }

  return response;
}

function parseSetCookie(setCookieValue: string): ParsedSetCookie | null {
  const [baseSegment, ...attributeSegments] = setCookieValue
    .split(";")
    .map((segment) => segment.trim());

  if (!baseSegment) {
    return null;
  }

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

  for (const segment of attributeSegments) {
    if (!segment) {
      continue;
    }

    const [attributeName, ...attributeValueParts] = segment.split("=");
    const normalizedName = attributeName.trim().toLowerCase();
    const attributeValue = attributeValueParts.join("=").trim();

    if (normalizedName === "path") {
      parsedCookie.path = attributeValue;
      continue;
    }

    if (normalizedName === "domain") {
      parsedCookie.domain = attributeValue;
      continue;
    }

    if (normalizedName === "expires") {
      const parsedDate = new Date(attributeValue);

      if (!Number.isNaN(parsedDate.getTime())) {
        parsedCookie.expires = parsedDate;
      }
      continue;
    }

    if (normalizedName === "max-age") {
      const parsedMaxAge = Number.parseInt(attributeValue, 10);

      if (Number.isFinite(parsedMaxAge)) {
        parsedCookie.maxAge = parsedMaxAge;
      }
      continue;
    }

    if (normalizedName === "secure") {
      parsedCookie.secure = true;
      continue;
    }

    if (normalizedName === "httponly") {
      parsedCookie.httpOnly = true;
      continue;
    }

    if (normalizedName === "samesite") {
      const sameSite = attributeValue.toLowerCase();

      if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
        parsedCookie.sameSite = sameSite;
      }
    }
  }

  return getWritableCookie(parsedCookie);
}

function getWritableCookie(cookie: ParsedSetCookie): ParsedSetCookie {
  const isCleared =
    cookie.value.length === 0 ||
    (cookie.maxAge !== undefined && cookie.maxAge <= 0) ||
    (cookie.expires !== undefined && cookie.expires.getTime() <= 0);

  if (!isCleared) {
    return cookie;
  }

  return {
    ...cookie,
    value: "",
    maxAge: 0,
    expires: new Date(0),
  };
}

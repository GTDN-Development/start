import { NextRequest } from "next/server";

export function hasValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    const parsedOrigin = new URL(origin).origin;

    return parsedOrigin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

export async function parseRequestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

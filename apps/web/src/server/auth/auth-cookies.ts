import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { cookieSerialize } from "pocketbase";

export type AuthCookieMutation = {
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

export type AuthCookieMutations = AuthCookieMutation[] | undefined;

export async function applyServerActionAuthCookies(
  cookieMutations: AuthCookieMutations
): Promise<void> {
  if (!cookieMutations?.length) {
    return;
  }

  const cookieStore = await cookies();

  for (const mutation of cookieMutations) {
    cookieStore.set(mutation);
  }
}

export function appendAuthCookiesToResponse(
  response: NextResponse,
  cookieMutations: AuthCookieMutations
): NextResponse {
  if (!cookieMutations?.length) {
    return response;
  }

  for (const mutation of cookieMutations) {
    response.headers.append("Set-Cookie", serializeAuthCookieMutation(mutation));
  }

  return response;
}

export function serializeAuthCookieMutation(mutation: AuthCookieMutation): string {
  const { name, value, ...options } = mutation;

  return cookieSerialize(name, value, options);
}

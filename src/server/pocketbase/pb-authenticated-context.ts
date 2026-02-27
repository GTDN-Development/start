import type { NextRequest, NextResponse } from "next/server";
import {
  createPocketBaseClient,
  loadPocketBaseAuthFromCookieHeader,
  setPocketBaseAuthCookie,
} from "@/server/pocketbase/pb-client";

export type AuthenticatedUserApiContext = {
  pb: ReturnType<typeof createPocketBaseClient>;
  userId: string;
  authRecord: unknown;
};

export function getAuthenticatedUserApiContext(
  request: NextRequest
): AuthenticatedUserApiContext | null {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    return null;
  }

  const pb = createPocketBaseClient();

  if (!loadPocketBaseAuthFromCookieHeader(pb, cookieHeader) || !pb.authStore.record) {
    return null;
  }

  const userId = getAuthRecordId(pb.authStore.record);

  if (!userId) {
    pb.authStore.clear();
    return null;
  }

  return {
    pb,
    userId,
    authRecord: pb.authStore.record,
  };
}

export async function refreshAuthenticatedUserApiSession(
  pb: ReturnType<typeof createPocketBaseClient>
) {
  try {
    await pb.collection("users").authRefresh();
    return true;
  } catch (error) {
    console.error("PocketBase user auth refresh failed in API route:", error);
    pb.authStore.clear();
    return false;
  }
}

export function setAuthenticatedUserApiCookie(
  response: NextResponse,
  pb: ReturnType<typeof createPocketBaseClient>
) {
  setPocketBaseAuthCookie(response, pb);
}

function getAuthRecordId(record: unknown) {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const value = (record as Record<string, unknown>).id;

  return typeof value === "string" && value.trim() ? value : null;
}

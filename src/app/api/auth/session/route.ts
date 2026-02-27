import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/server/http/json";
import {
  POCKETBASE_AUTH_COOKIE_NAME,
  clearPocketBaseAuthCookie,
  createPocketBaseClient,
  loadPocketBaseAuthFromCookieHeader,
} from "@/server/pocketbase/pb-client";

type SessionSnapshot = {
  id: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  updated: string | null;
  verified: boolean;
};

type UnauthenticatedSessionResponseOptions = {
  changed: boolean;
  clearCookie: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const pb = createPocketBaseClient();
    const cookieHeader = request.headers.get("cookie") ?? "";
    const hasAuthCookie = request.cookies.has(POCKETBASE_AUTH_COOKIE_NAME);

    if (!loadPocketBaseAuthFromCookieHeader(pb, cookieHeader) || !pb.authStore.record) {
      return createUnauthenticatedSessionResponse({
        changed: hasAuthCookie,
        clearCookie: hasAuthCookie,
      });
    }

    const previousSnapshot = getSessionSnapshot(pb.authStore.record);

    try {
      await pb.collection("users").authRefresh();
    } catch (error) {
      if (
        error instanceof ClientResponseError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        return createUnauthenticatedSessionResponse({
          changed: true,
          clearCookie: true,
        });
      }

      throw error;
    }

    if (!pb.authStore.isValid || !pb.authStore.record) {
      return createUnauthenticatedSessionResponse({
        changed: true,
        clearCookie: true,
      });
    }

    const nextSnapshot = getSessionSnapshot(pb.authStore.record);
    const changed = !areSessionSnapshotsEqual(previousSnapshot, nextSnapshot);
    const response = jsonOk(
      {
        authenticated: true,
        changed,
      },
      200
    );

    return response;
  } catch (error) {
    console.error("Auth session refresh API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function createUnauthenticatedSessionResponse(options: UnauthenticatedSessionResponseOptions) {
  const response = jsonOk(
    {
      authenticated: false,
      changed: options.changed,
    },
    200
  );

  if (options.clearCookie) {
    clearPocketBaseAuthCookie(response);
  }

  return response;
}

function areSessionSnapshotsEqual(a: SessionSnapshot, b: SessionSnapshot) {
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.avatar === b.avatar &&
    a.updated === b.updated &&
    a.verified === b.verified
  );
}

function getSessionSnapshot(record: unknown): SessionSnapshot {
  if (!isRecord(record)) {
    return {
      id: null,
      email: null,
      name: null,
      avatar: null,
      updated: null,
      verified: false,
    };
  }

  return {
    id: getOptionalString(record.id),
    email: getOptionalString(record.email),
    name: getOptionalString(record.name),
    avatar: getOptionalString(record.avatar),
    updated: getOptionalString(record.updated),
    verified: typeof record.verified === "boolean" ? record.verified : false,
  };
}

function getOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

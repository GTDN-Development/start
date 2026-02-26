import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";
import { clearPocketBaseAuthCookie } from "@/server/pocketbase/server";
import {
  getAuthenticatedUserApiContext,
  refreshAuthenticatedUserApiSession,
  setAuthenticatedUserApiCookie,
} from "@/server/pocketbase/authenticated-user-api";

const updatePasswordPayloadSchema = z
  .object({
    oldPassword: z.string().min(1),
    password: z.string().min(8).max(100),
    passwordConfirm: z.string().min(1),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"],
  });

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, updatePasswordPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    await userContext.pb.collection("users").update(userContext.userId, {
      oldPassword: body.oldPassword,
      password: body.password,
      passwordConfirm: body.passwordConfirm,
    });

    const hasRefreshedSession = await refreshAuthenticatedUserApiSession(userContext.pb);
    const response = jsonOk({ sessionExpired: !hasRefreshedSession }, 200);

    if (hasRefreshedSession) {
      setAuthenticatedUserApiCookie(response, userContext.pb);
    } else {
      clearPocketBaseAuthCookie(response);
    }

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        return jsonError("INVALID_PASSWORD_INPUT", 400);
      }

      if (error.status === 401 || error.status === 403) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    console.error("Change account password API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

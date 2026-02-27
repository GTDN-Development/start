import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createPocketBaseClient, setPocketBaseAuthCookie } from "@/server/pocketbase/pb-client";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";

const signUpPayloadSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string(),
  confirmPassword: z.string(),
  termsAccepted: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, signUpPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    if (body.password.length < 8 || body.confirmPassword.length < 8) {
      return jsonError("BAD_REQUEST", 400);
    }

    if (body.password !== body.confirmPassword) {
      return jsonError("PASSWORD_MISMATCH", 400);
    }

    if (!body.termsAccepted) {
      return jsonError("TERMS_NOT_ACCEPTED", 400);
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").create({
      email: body.email,
      password: body.password,
      passwordConfirm: body.confirmPassword,
      name: `${body.firstName} ${body.lastName}`.trim(),
    });

    await requestVerificationEmail(pb, body.email);

    try {
      await pb.collection("users").authWithPassword(body.email, body.password);

      const response = jsonOk({ redirectTo: authRedirectPaths.dashboard }, 201);
      setPocketBaseAuthCookie(response, pb);

      return response;
    } catch (error) {
      console.error("Sign-up auto-login skipped:", error);

      return jsonOk({ redirectTo: authRedirectPaths.login }, 201);
    }
  } catch (error) {
    if (isEmailAlreadyInUseError(error)) {
      return jsonError("EMAIL_ALREADY_IN_USE", 409);
    }

    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return jsonError("VALIDATION_ERROR", 400);
    }

    console.error("Sign-up API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function isEmailAlreadyInUseError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  const data = getResponseData(error.response.data);
  const emailError = getResponseData(data.email);

  return emailError.code === "validation_not_unique";
}

async function requestVerificationEmail(pb: ReturnType<typeof createPocketBaseClient>, email: string) {
  try {
    await pb.collection("users").requestVerification(email);
  } catch (error) {
    console.error("Sign-up verification email request failed:", error);
  }
}

function getResponseData(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}

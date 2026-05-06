import type { AuthErrorCode, AuthResponse } from "@/features/auth/auth-types";
import { applyServerActionAuthCookies, type AuthCookieMutations } from "@/server/auth/auth-cookies";

export type ServerAuthResponse<TData> =
  | {
      ok: true;
      data: TData;
      cookieMutations?: AuthCookieMutations;
    }
  | {
      ok: false;
      errorCode: AuthErrorCode;
      cookieMutations?: AuthCookieMutations;
    };

export function createAuthErrorResponse<TData>(errorCode: AuthErrorCode): AuthResponse<TData> {
  return {
    ok: false,
    errorCode,
  };
}

export function createBadRequestAuthResponse<TData>(): AuthResponse<TData> {
  return createAuthErrorResponse("BAD_REQUEST");
}

export function toAuthApiResponse<TData>(response: ServerAuthResponse<TData>): AuthResponse<TData> {
  if (response.ok) {
    return {
      ok: true,
      data: response.data,
    };
  }

  return createAuthErrorResponse(response.errorCode);
}

export async function finalizeAuthAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerActionAuthCookies(response.cookieMutations);

  return toAuthApiResponse(response);
}

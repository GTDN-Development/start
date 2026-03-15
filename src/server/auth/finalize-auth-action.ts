import type { AuthResponse } from "@/features/auth/auth-contract";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { toAuthApiResponse, type ServerAuthResponse } from "@/server/auth/auth-service";

export async function finalizeAuthAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerAuthCookies(response.setCookie);

  return toAuthApiResponse(response);
}

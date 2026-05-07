import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import type { OrganizationResponse } from "@/features/organizations/organization-types";
import type { ServerOrganizationResponse } from "@/server/organizations/organization-types";

type FinalizeOrganizationActionOptions<TData, TResult> = {
  onSuccess?: (data: TData) => void | Promise<void>;
  mapData?: (data: TData) => TResult | Promise<TResult>;
};

export function createBadRequestOrganizationResponse<TData>(): OrganizationResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}

export async function finalizeOrganizationAction<TData, TResult = TData>(
  response: ServerOrganizationResponse<TData>,
  options: FinalizeOrganizationActionOptions<TData, TResult> = {}
): Promise<OrganizationResponse<TResult>> {
  if (response.ok) {
    await options.onSuccess?.(response.data);
  }

  await applyServerActionAuthCookies(response.cookieMutations);

  if (!response.ok) {
    return {
      ok: false,
      errorCode: response.errorCode,
    };
  }

  return {
    ok: true,
    data: options.mapData
      ? await options.mapData(response.data)
      : (response.data as unknown as TResult),
  };
}

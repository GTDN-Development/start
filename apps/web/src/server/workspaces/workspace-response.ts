import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import type { WorkspaceResponse } from "@/features/workspaces/workspace-types";
import type { ServerWorkspaceResponse } from "@/server/workspaces/workspace-types";

type FinalizeWorkspaceActionOptions<TData, TResult> = {
  onSuccess?: (data: TData) => void | Promise<void>;
  mapData?: (data: TData) => TResult | Promise<TResult>;
};

export function createBadRequestWorkspaceResponse<TData>(): WorkspaceResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}

export async function finalizeWorkspaceAction<TData, TResult = TData>(
  response: ServerWorkspaceResponse<TData>,
  options: FinalizeWorkspaceActionOptions<TData, TResult> = {}
): Promise<WorkspaceResponse<TResult>> {
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

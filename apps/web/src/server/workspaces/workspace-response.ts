import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import type {
  ServerWorkspaceResponse,
  WorkspaceResponse,
} from "@/server/workspaces/workspace-types";

type FinalizeWorkspaceActionOptions<TData, TResult> = {
  onSuccess?: (data: TData) => void | Promise<void>;
  mapData?: (data: TData) => TResult;
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

  await applyServerActionAuthCookies(response.setCookie);

  if (!response.ok) {
    return {
      ok: false,
      errorCode: response.errorCode,
    };
  }

  if (!options.mapData) {
    return {
      ok: true,
      data: response.data as unknown as TResult,
    };
  }

  return {
    ok: true,
    data: options.mapData(response.data),
  };
}

import { parseAuthRedirectPath, type AuthRedirectPath } from "@/features/auth/auth-redirects";

export type AuthFormApiResponse = {
  ok?: boolean;
  errorCode?: string;
  redirectTo?: AuthRedirectPath;
};

export async function readAuthFormApiResponse(response: Response): Promise<AuthFormApiResponse | null> {
  try {
    const data = (await response.json()) as unknown;

    if (!isRecord(data)) {
      return null;
    }

    return {
      ok: data.ok === true ? true : undefined,
      errorCode: typeof data.errorCode === "string" ? data.errorCode : undefined,
      redirectTo: parseAuthRedirectPath(data.redirectTo),
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

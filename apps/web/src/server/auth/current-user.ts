import {
  resolveActionAuthUser,
  resolveReadOnlyAuthUser,
  type ResolvedActionAuthUserResult,
  type ResolvedReadOnlyAuthUserResult,
} from "@/server/auth/auth-resolution";

export type RequireCurrentUserResult = ResolvedReadOnlyAuthUserResult;
export type RequireCurrentActionUserResult = ResolvedActionAuthUserResult;

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  return resolveReadOnlyAuthUser();
}

export async function requireCurrentActionUser(): Promise<RequireCurrentActionUserResult> {
  return resolveActionAuthUser();
}

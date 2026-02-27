import type { AuthRedirectPath } from "./auth-redirects";

export type AuthFormApiResponse = {
  ok?: boolean;
  errorCode?: string;
  redirectTo?: AuthRedirectPath;
};

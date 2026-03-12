export const AUTH_PROTECTED_ROUTE_PREFIXES = ["/overview", "/w", "/account"] as const;

export const AUTH_REDIRECTS = {
  unauthenticatedTo: "/sign-in",
  authenticatedTo: "/overview",
} as const;

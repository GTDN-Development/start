export const AUTH_PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/account"] as const;

export const AUTH_REDIRECTS = {
  unauthenticatedTo: "/login",
  authenticatedTo: "/dashboard",
} as const;

export type ServerCookieOptions = {
  path: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  domain?: string;
  expires?: Date;
  maxAge?: number;
};

export function getBaseServerCookieOptions(): ServerCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

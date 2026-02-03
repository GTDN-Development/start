export type CookieCategory = "essential" | "functional" | "analytics" | "marketing";

export type Cookie = {
  name: string;
  provider: string;
  purpose: string;
  duration: string;
  category: CookieCategory;
  storageType?: "cookie" | "localStorage" | "sessionStorage";
};

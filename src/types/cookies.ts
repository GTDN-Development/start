export type CookieCategory = "essential" | "functional" | "analytics" | "marketing";
export type CookieStorageType = "cookie" | "localStorage" | "sessionStorage";

export type CookiePurposeKey =
  | "cookieConsent"
  | "theme"
  | "ga"
  | "gaWildcard"
  | "gid"
  | "gat"
  | "gclAu";

export type CookieDuration =
  | {
      kind: "session";
    }
  | {
      kind: "persistent";
    }
  | {
      kind: "relative";
      value: number;
      unit: "minute" | "hour" | "day" | "month" | "year";
    };

export type Cookie = {
  name: string;
  provider: string;
  purposeKey: CookiePurposeKey;
  duration: CookieDuration;
  category: CookieCategory;
  storageType?: CookieStorageType;
  thirdParty: boolean;
  requiresConsent: boolean;
};

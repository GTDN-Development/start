export type CookieCategory = "essential" | "functional" | "analytics" | "marketing";
export type CookieStorageType = "cookie" | "localStorage" | "sessionStorage";

export type CookiePurposeKey =
  | "cookieConsent"
  | "consentSubject"
  | "authSession"
  | "authPersist"
  | "deviceSession"
  | "pendingInvite"
  | "locale"
  | "theme"
  | "sidebarState"
  | "activeWorkspace"
  | "ga"
  | "gaWildcard";

export type CookieDuration =
  | {
      kind: "session";
    }
  | {
      kind: "persistent";
    }
  | {
      kind: "conditional";
      labelKey: "sessionOrTokenExpiry" | "sessionOrOneYear" | "sessionOrNinetyDays";
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

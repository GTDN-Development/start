export type CookieCategory = "essential" | "functional" | "analytics" | "marketing";
export type CookieStorageType = "cookie" | "localStorage" | "sessionStorage";

export type CookiePurposeKey =
  | "cookieConsent"
  | "consentSubject"
  | "authSession"
  | "authPersist"
  | "pendingInvite"
  | "locale"
  | "theme"
  | "sidebarState"
  | "activeOrganization"
  | "turnstileSecurity"
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
      labelKey: "sessionOrTokenExpiry" | "sessionOrOneYear" | "providerManagedSecurity";
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

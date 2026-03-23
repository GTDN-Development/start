import type { Cookie } from "@/types/cookies";

export type TermsOfServiceConfig = {
  minimumAge: number;
  withdrawalPeriodDays: number;
  changeNoticeDays: number;
  liabilityCapAmount: number;
  liabilityCapCurrency: "EUR" | "CZK" | "USD";
  liabilityLookbackMonths: number;
  governingLawKey: "czechRepublic";
  courtVenueKey: "czechRepublic";
  features: {
    paidPlans: boolean;
    autoRenewal: boolean;
    trials: boolean;
    betaFeatures: boolean;
    consumers: boolean;
    thirdPartyPayments: boolean;
  };
  adr: {
    authority: string;
    website: string;
    email: string;
    address: string;
  };
};

export type GdprPolicyConfig = {
  features: {
    marketingCommunications: boolean;
    analytics: boolean;
    cookies: boolean;
    thirdCountryTransfers: boolean;
  };
  automatedDecisionMaking: {
    enabled: boolean;
  };
};

export type CookiePolicyConfig = {
  features: {
    functionalStorage: boolean;
    analytics: boolean;
    marketing: boolean;
  };
};

type LegalConfig = {
  name: string;
  legalName: string;
  address: string;
  id: string;
  vatId?: string;
  domain: string;
  registration?: {
    court: string;
    fileNumber: string;
  };
  contact: {
    email: string;
    phone?: string;
    support: {
      email: string;
    };
    sales: {
      email: string;
      phone: string;
    };
  };
};

export const legal: LegalConfig = {
  name: "FBLS Tech s.r.o.",
  legalName: "FBLS Tech s.r.o.",
  address: "Moravská 854/2, 312 00 Plzeň",
  id: "19433166",
  domain: "www.gtdn.online",
  contact: {
    email: "hello@gtdn.online",
    phone: "+420123456789",
    support: {
      email: "support@gtdn.online",
    },
    sales: {
      email: "hello@gtdn.online",
      phone: "+420123456789",
    },
  },
};

export const termsOfService: TermsOfServiceConfig = {
  minimumAge: 18,
  withdrawalPeriodDays: 14,
  changeNoticeDays: 30,
  liabilityCapAmount: 100,
  liabilityCapCurrency: "EUR",
  liabilityLookbackMonths: 12,
  governingLawKey: "czechRepublic",
  courtVenueKey: "czechRepublic",
  features: {
    paidPlans: true,
    autoRenewal: true,
    trials: true,
    betaFeatures: true,
    consumers: true,
    thirdPartyPayments: true,
  },
  adr: {
    authority: "Česká obchodní inspekce",
    website: "www.coi.gov.cz",
    email: "adr@coi.gov.cz",
    address: "Štěpánská 567/15, 120 00 Praha 2",
  },
};

export const gdprPolicy: GdprPolicyConfig = {
  features: {
    marketingCommunications: true,
    analytics: true,
    cookies: true,
    thirdCountryTransfers: true,
  },
  automatedDecisionMaking: {
    enabled: false,
  },
};

export const cookiePolicy: CookiePolicyConfig = {
  features: {
    functionalStorage: true,
    analytics: true,
    marketing: false,
  },
};

export const cookieCatalog: Cookie[] = [
  {
    name: "cookie_consent",
    provider: legal.domain,
    purposeKey: "cookieConsent",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
  },
  {
    name: "theme",
    provider: legal.domain,
    purposeKey: "theme",
    duration: { kind: "persistent" },
    category: "functional",
    storageType: "localStorage",
  },
  {
    name: "_ga",
    provider: "Google Analytics",
    purposeKey: "ga",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purposeKey: "gaWildcard",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gid",
    provider: "Google Analytics",
    purposeKey: "gid",
    duration: { kind: "relative", value: 24, unit: "hour" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gat",
    provider: "Google Analytics",
    purposeKey: "gat",
    duration: { kind: "relative", value: 1, unit: "minute" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gcl_au",
    provider: "Google Tag Manager",
    purposeKey: "gclAu",
    duration: { kind: "relative", value: 3, unit: "month" },
    category: "analytics",
    storageType: "cookie",
  },
];

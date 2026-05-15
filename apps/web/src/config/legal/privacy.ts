export type GdprPolicyConfig = {
  minimumAge: number;
  hasMarketingCommunications: boolean;
  hasAnalytics: boolean;
  hasCookies: boolean;
  hasThirdCountryTransfers: boolean;
  usesDpa: boolean;
  hasProcessorList: boolean;
  hasDpo: boolean;
  dpoEmail?: string;
};

export const gdprPolicy: GdprPolicyConfig = {
  minimumAge: 15,
  hasMarketingCommunications: true,
  hasAnalytics: true,
  hasCookies: true,
  hasThirdCountryTransfers: true,
  usesDpa: true,
  hasProcessorList: true,
  hasDpo: false,
};

export const gdprPolicyUpdatedAt = "2025-01-01";

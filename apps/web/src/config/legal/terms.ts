export type TermsOfServiceConfig = {
  minimumAge: number;
  supportsConsumers: boolean;
  hasFreePlan: boolean;
  hasTrial: boolean;
  trialDays: number | null;
  hasMonthlyBilling: boolean;
  hasAnnualBilling: boolean;
  hasAutoRenewal: boolean;
  hasAiFeatures: boolean;
  hasDataExport: boolean;
  hasEnterpriseSla: boolean;
  liabilityLookbackMonths: number;
  allowsImmediateSuspension: true;
  allowsPostTerminationRetention: boolean;
  usesDpa: boolean;
  refundPolicyMode: "by_plan_offer_order";
  adr: {
    authority: string;
    website: string;
    email: string;
    address: string;
  };
};

export const termsOfService: TermsOfServiceConfig = {
  minimumAge: 18,
  supportsConsumers: true,
  hasFreePlan: true,
  hasTrial: true,
  trialDays: 14,
  hasMonthlyBilling: true,
  hasAnnualBilling: true,
  hasAutoRenewal: true,
  hasAiFeatures: false,
  hasDataExport: true,
  hasEnterpriseSla: false,
  liabilityLookbackMonths: 12,
  allowsImmediateSuspension: true,
  allowsPostTerminationRetention: true,
  usesDpa: true,
  refundPolicyMode: "by_plan_offer_order",
  adr: {
    authority: "Česká obchodní inspekce",
    website: "www.coi.gov.cz",
    email: "adr@coi.gov.cz",
    address: "Štěpánská 567/15, 120 00 Praha 2",
  },
};

export const termsOfServiceUpdatedAt = "2026-03-03";

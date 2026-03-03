export type TermsOfServiceConfig = {
  minimumAge: number;
  withdrawalPeriodDays: number;
  changeNoticeDays: number;
  liabilityCapAmount: number;
  liabilityCapCurrency: "EUR" | "CZK" | "USD";
  liabilityLookbackMonths: number;
  governingLawKey: "czechRepublic";
  courtVenueKey: "czechRepublic";
  adr: {
    authority: string;
    website: string;
    email: string;
    address: string;
  };
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
  adr: {
    authority: "Česká obchodní inspekce",
    website: "www.coi.gov.cz",
    email: "adr@coi.gov.cz",
    address: "Štěpánská 567/15, 120 00 Praha 2",
  },
};

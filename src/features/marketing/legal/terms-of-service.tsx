import { useTranslations } from "next-intl";
import type { TermsOfServiceConfig } from "@/config/legal";

type CompanyInfo = {
  name: string;
  legalName?: string;
  address: string;
  id: string;
  vatId?: string;
  domain: string;
  registration?: {
    court: string;
    fileNumber: string;
  };
};

type ContactInfo = {
  email: string;
  phone?: string;
};

type TermsOfServiceProps = React.ComponentProps<"div"> & {
  company: CompanyInfo;
  contact: ContactInfo;
  terms: TermsOfServiceConfig;
  effectiveDate?: string;
  lastUpdated?: string;
  acceptableUse?: string[];
  prohibitedUse?: string[];
  userResponsibilities?: string[];
  providerRights?: string[];
  additionalInfo?: React.ReactNode;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function TermsOfService({
  company,
  contact,
  terms,
  effectiveDate,
  lastUpdated,
  acceptableUse,
  prohibitedUse,
  userResponsibilities,
  providerRights,
  additionalInfo,
  ...props
}: TermsOfServiceProps) {
  const t = useTranslations("legal.termsOfService");
  const legalName = company.legalName ?? company.name;

  const actualAcceptableUse = acceptableUse ?? toStringArray(t.raw("defaults.acceptableUse"));
  const actualProhibitedUse = prohibitedUse ?? toStringArray(t.raw("defaults.prohibitedUse"));
  const actualUserResponsibilities =
    userResponsibilities ?? toStringArray(t.raw("defaults.userResponsibilities"));
  const actualProviderRights = providerRights ?? toStringArray(t.raw("defaults.providerRights"));

  const governingLaw = t(`governingLaw.laws.${terms.governingLawKey}`);
  const governingCourt = t(`governingLaw.courts.${terms.courtVenueKey}`);

  return (
    <div {...props}>
      <h1>{t("title")}</h1>

      {effectiveDate && (
        <p>
          <strong>{t("effectiveFrom")}</strong> {effectiveDate}
        </p>
      )}

      {lastUpdated && (
        <p>
          <strong>{t("lastUpdated")}</strong> {lastUpdated}
        </p>
      )}

      <p>{t("introduction")}</p>

      <section>
        <h2>{t("providerIdentification.title")}</h2>
        <p>{t("providerIdentification.description")}</p>
        <ul>
          <li>
            <strong>{t("providerIdentification.companyLabel")}</strong> {legalName}
          </li>
          {company.id && (
            <li>
              <strong>{t("providerIdentification.companyIdLabel")}</strong> {company.id}
            </li>
          )}
          {company.vatId && (
            <li>
              <strong>{t("providerIdentification.vatIdLabel")}</strong> {company.vatId}
            </li>
          )}
          <li>
            <strong>{t("providerIdentification.addressLabel")}</strong> {company.address}
          </li>
          <li>
            <strong>{t("providerIdentification.domainLabel")}</strong> {company.domain}
          </li>
          {company.registration && (
            <li>
              <strong>{t("providerIdentification.registerLabel")}</strong>{" "}
              {t("providerIdentification.registerValue", {
                court: company.registration.court,
                fileNumber: company.registration.fileNumber,
              })}
            </li>
          )}
          <li>
            <strong>{t("providerIdentification.supportLabel")}</strong> {contact.email}
          </li>
          {contact.phone && (
            <li>
              <strong>{t("providerIdentification.phoneLabel")}</strong> {contact.phone}
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2>{t("acceptance.title")}</h2>
        <p>{t("acceptance.description")}</p>
        <p>{t("acceptance.ageRequirement", { minimumAge: terms.minimumAge })}</p>
      </section>

      <section>
        <h2>{t("accountSecurity.title")}</h2>
        <p>{t("accountSecurity.description")}</p>
      </section>

      <section>
        <h2>{t("licenseScope.title")}</h2>
        <p>{t("licenseScope.description")}</p>
      </section>

      <section>
        <h2>{t("acceptableUse.title")}</h2>
        <p>{t("acceptableUse.description")}</p>
        <ul>
          {actualAcceptableUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("prohibitedUse.title")}</h2>
        <p>{t("prohibitedUse.description")}</p>
        <ul>
          {actualProhibitedUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("userContent.title")}</h2>
        <p>{t("userContent.description")}</p>
        <ul>
          {actualUserResponsibilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("providerRights.title")}</h2>
        <p>{t("providerRights.description")}</p>
        <ul>
          {actualProviderRights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("thirdPartyServices.title")}</h2>
        <p>{t("thirdPartyServices.description")}</p>
      </section>

      <section>
        <h2>{t("subscriptions.title")}</h2>
        <p>{t("subscriptions.description")}</p>
      </section>

      <section>
        <h2>{t("consumerRights.title")}</h2>
        <p>{t("consumerRights.description")}</p>
        <p>{t("consumerRights.withdrawal", { withdrawalDays: terms.withdrawalPeriodDays })}</p>
        <p>{t("consumerRights.withdrawalException")}</p>
        <p>
          {t("consumerRights.adr", {
            authority: terms.adr.authority,
            website: terms.adr.website,
            email: terms.adr.email,
            address: terms.adr.address,
          })}
        </p>
        <p>{t("consumerRights.odrDiscontinued")}</p>
      </section>

      <section>
        <h2>{t("availabilityChanges.title")}</h2>
        <p>{t("availabilityChanges.description", { noticeDays: terms.changeNoticeDays })}</p>
      </section>

      <section>
        <h2>{t("liability.title")}</h2>
        <p>
          {t("liability.description", {
            capAmount: terms.liabilityCapAmount,
            capCurrency: terms.liabilityCapCurrency,
            lookbackMonths: terms.liabilityLookbackMonths,
          })}
        </p>
        <p>{t("liability.legalRightsReserved")}</p>
      </section>

      <section>
        <h2>{t("indemnification.title")}</h2>
        <p>{t("indemnification.description")}</p>
      </section>

      <section>
        <h2>{t("termination.title")}</h2>
        <p>{t("termination.description")}</p>
      </section>

      <section>
        <h2>{t("governingLaw.title")}</h2>
        <p>{t("governingLaw.description")}</p>
        <ul>
          <li>
            <strong>{t("governingLaw.lawLabel")}</strong> {governingLaw}
          </li>
          <li>
            <strong>{t("governingLaw.courtLabel")}</strong> {governingCourt}
          </li>
        </ul>
      </section>

      {additionalInfo && (
        <section>
          <h2>{t("additionalInfoTitle")}</h2>
          <div>{additionalInfo}</div>
        </section>
      )}

      <section>
        <h2>{t("changes.title")}</h2>
        <p>{t("changes.description", { noticeDays: terms.changeNoticeDays })}</p>
      </section>

      <section>
        <h2>{t("contact.title")}</h2>
        <p>
          {t("contact.description")} <strong>{contact.email}</strong>
          {contact.phone && (
            <>
              {" "}
              {t("contact.phone")} <strong>{contact.phone}</strong>
            </>
          )}
          .
        </p>
      </section>
    </div>
  );
}

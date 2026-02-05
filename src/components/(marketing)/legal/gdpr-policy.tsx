import { useTranslations } from "next-intl";

type ThirdParty = {
  name: string;
  service: string;
  country?: string;
};

type GdprPolicyProps = React.ComponentProps<"div"> & {
  /** Company information */
  company: {
    name: string;
    address: string;
    id: string;
    domain: string;
  };
  /** Contact information */
  contact: {
    email: string;
    phone?: string;
  };
  /** Types of personal data collected (optional - defaults provided) */
  dataCollected?: string[];
  /** Purposes for which data is processed (optional - defaults provided) */
  dataPurposes?: string[];
  /** Period for which data is retained (optional - defaults provided) */
  dataRetention?: string;
  /** Third-party data processors who may have access to the data (optional - defaults provided) */
  thirdParties?: ThirdParty[];
  /** Effective date of the document */
  effectiveDate?: string;
  /** Data subject rights (if not provided, default rights will be shown) */
  subjectRights?: string[];
  /** Any additional information or paragraphs */
  additionalInfo?: React.ReactNode;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toThirdPartiesArray(value: unknown): ThirdParty[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: ThirdParty[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Partial<ThirdParty>;
    if (typeof candidate.name !== "string" || typeof candidate.service !== "string") {
      continue;
    }

    result.push({
      name: candidate.name,
      service: candidate.service,
      country: typeof candidate.country === "string" ? candidate.country : undefined,
    });
  }

  return result;
}

export function GdprPolicy({
  company,
  contact,
  dataCollected,
  dataPurposes,
  dataRetention,
  thirdParties,
  effectiveDate,
  subjectRights,
  additionalInfo,
  ...props
}: GdprPolicyProps) {
  const t = useTranslations("legal.gdprPolicy");

  const actualDataCollected = dataCollected ?? toStringArray(t.raw("defaults.dataCollected"));
  const actualDataPurposes = dataPurposes ?? toStringArray(t.raw("defaults.dataPurposes"));
  const actualDataRetention = dataRetention ?? t("defaults.dataRetention");
  const actualThirdParties = thirdParties ?? toThirdPartiesArray(t.raw("defaults.thirdParties"));

  const hasThirdParties = actualThirdParties.length > 0;
  const additionalInfoSection = hasThirdParties ? 5 : 4;
  const rightsSection = hasThirdParties ? (additionalInfo ? 6 : 5) : additionalInfo ? 5 : 4;
  const contactSection = hasThirdParties ? (additionalInfo ? 7 : 6) : additionalInfo ? 6 : 5;

  return (
    <div {...props}>
      {effectiveDate && (
        <p className="text-sm opacity-60">
          {t("effectiveFrom")} {effectiveDate}
        </p>
      )}

      <p>
        {t("principles")} <strong>{company.name}</strong>
        {company.id && (
          <>
            {" "}
            ({t("companyId")} {company.id})
          </>
        )}{" "}
        {t("headquartered")} <strong>{company.address}</strong> {t("controller")}
      </p>

      <p>
        {t("websiteInfo")} <strong>{company.domain}</strong>.
      </p>

      <section>
        <h2>{t("dataCollectedTitle")}</h2>
        <p>{t("dataCollectedDescription")}</p>
        <ul>
          {actualDataCollected.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("purposesTitle")}</h2>
        <p>{t("purposesDescription")}</p>
        <ul>
          {actualDataPurposes.map((purpose) => (
            <li key={purpose}>{purpose}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>{t("retentionTitle")}</h2>
        <p>
          {t("retentionDescription")} <strong>{actualDataRetention}</strong>.
        </p>
      </section>

      {hasThirdParties && (
        <section>
          <h2>{t("thirdPartiesTitle")}</h2>
          <p>{t("thirdPartiesDescription")}</p>
          <ul>
            {actualThirdParties.map((party) => (
              <li key={`${party.name}-${party.service}`}>
                <strong>{party.name}</strong> - {t("thirdPartyService")} {party.service}
                {party.country && (
                  <span>
                    {", "} {t("thirdPartyCountry")} {party.country}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {additionalInfo && (
        <section>
          <h2>
            {additionalInfoSection}. {t("additionalInfoTitle")}
          </h2>
          <div>{additionalInfo}</div>
        </section>
      )}

      <section>
        <h2>
          {rightsSection}. {t("rightsTitle")}
        </h2>
        {subjectRights && subjectRights.length > 0 ? (
          <>
            <p>{t("rightsDescription")}</p>
            <ul>
              {subjectRights.map((right) => (
                <li key={right}>{right}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>{t("defaultRights")}</p>
        )}
      </section>

      <section>
        <h2>
          {contactSection}. {t("contactTitle")}
        </h2>
        <p>
          {t("contactDescription")} <strong>{contact.email}</strong>
          {contact.phone && (
            <>
              {" "}
              {t("contactPhone")} <strong>{contact.phone}</strong>
            </>
          )}
          .
        </p>
        <p>
          {t("complaintDescription")} <strong>{t("supervisoryAuthority")}</strong> ({t("website")}).
        </p>
      </section>
    </div>
  );
}

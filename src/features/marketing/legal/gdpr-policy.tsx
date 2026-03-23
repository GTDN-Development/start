import { useTranslations } from "next-intl";
import type { GdprPolicyConfig } from "@/config/legal";

type ThirdParty = {
  name: string;
  service: string;
  country?: string;
};

type GdprPolicyProps = React.ComponentProps<"div"> & {
  company: {
    name: string;
    address: string;
    id: string;
    domain: string;
  };
  contact: {
    email: string;
    phone?: string;
  };
  policy: GdprPolicyConfig;
  thirdParties?: ThirdParty[];
  effectiveDate?: string;
};

type Section = {
  key: string;
  content: React.ReactNode;
};

function isSection(section: Section | null): section is Section {
  return section !== null;
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

function PolicySection({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2>
        {index}. {title}
      </h2>
      {children}
    </section>
  );
}

export function GdprPolicy({
  company,
  contact,
  policy,
  thirdParties,
  effectiveDate,
  ...props
}: GdprPolicyProps) {
  const t = useTranslations("legal.gdprPolicy");
  const actualThirdParties = thirdParties ?? toThirdPartiesArray(t.raw("defaults.thirdParties"));

  const sections = [
    {
      key: "controller",
      content: (
        <p>
          {t("controller.description", {
            company: company.name,
            companyId: company.id,
            address: company.address,
            email: contact.email,
            domain: company.domain,
          })}
        </p>
      ),
    },
    {
      key: "dataCategories",
      content: (
        <>
          <p>{t("dataCategories.description")}</p>
          <ul>
            <li>{t("dataCategories.items.identification")}</li>
            <li>{t("dataCategories.items.contact")}</li>
            <li>{t("dataCategories.items.account")}</li>
            <li>{t("dataCategories.items.billing")}</li>
            <li>{t("dataCategories.items.technical")}</li>
            <li>{t("dataCategories.items.usage")}</li>
            <li>{t("dataCategories.items.support")}</li>
            {policy.features.marketingCommunications && (
              <li>{t("dataCategories.items.marketing")}</li>
            )}
            {policy.features.cookies && <li>{t("dataCategories.items.cookies")}</li>}
          </ul>
        </>
      ),
    },
    {
      key: "sources",
      content: (
        <>
          <p>{t("sources.description")}</p>
          <ul>
            <li>{t("sources.items.directlyFromUser")}</li>
            <li>{t("sources.items.automaticCollection")}</li>
            <li>{t("sources.items.partners")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "purposesAndLegalBases",
      content: (
        <>
          <p>{t("purposesAndLegalBases.description")}</p>
          <ul>
            <li>{t("purposesAndLegalBases.items.accountAndService")}</li>
            <li>{t("purposesAndLegalBases.items.subscriptionManagement")}</li>
            <li>{t("purposesAndLegalBases.items.billing")}</li>
            <li>{t("purposesAndLegalBases.items.support")}</li>
            <li>{t("purposesAndLegalBases.items.security")}</li>
            <li>{t("purposesAndLegalBases.items.productImprovement")}</li>
            <li>{t("purposesAndLegalBases.items.legalObligations")}</li>
            <li>{t("purposesAndLegalBases.items.claims")}</li>
            {policy.features.marketingCommunications && (
              <li>{t("purposesAndLegalBases.items.marketing")}</li>
            )}
            {policy.features.analytics && <li>{t("purposesAndLegalBases.items.analytics")}</li>}
          </ul>
          <p>{t("purposesAndLegalBases.legalBases")}</p>
          <ul>
            <li>{t("purposesAndLegalBases.bases.contract")}</li>
            <li>{t("purposesAndLegalBases.bases.legalObligation")}</li>
            <li>{t("purposesAndLegalBases.bases.legitimateInterest")}</li>
            <li>{t("purposesAndLegalBases.bases.consent")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "legitimateInterests",
      content: (
        <>
          <p>{t("legitimateInterests.description")}</p>
          <ul>
            <li>{t("legitimateInterests.items.security")}</li>
            <li>{t("legitimateInterests.items.fraudPrevention")}</li>
            <li>{t("legitimateInterests.items.claims")}</li>
            {policy.features.marketingCommunications && (
              <li>{t("legitimateInterests.items.directMarketing")}</li>
            )}
            <li>{t("legitimateInterests.items.analytics")}</li>
          </ul>
        </>
      ),
    },
    actualThirdParties.length > 0
      ? {
          key: "recipients",
          content: (
            <>
              <p>{t("recipients.description")}</p>
              <ul>
                {actualThirdParties.map((party) => (
                  <li key={`${party.name}-${party.service}`}>
                    <strong>{party.name}</strong> - {party.service}
                    {party.country && ` (${party.country})`}
                  </li>
                ))}
              </ul>
            </>
          ),
        }
      : null,
    policy.features.thirdCountryTransfers
      ? {
          key: "thirdCountryTransfers",
          content: <p>{t("thirdCountryTransfers.description")}</p>,
        }
      : null,
    {
      key: "retention",
      content: (
        <>
          <p>{t("retention.description")}</p>
          <ul>
            <li>{t("retention.items.account")}</li>
            <li>{t("retention.items.contractual")}</li>
            <li>{t("retention.items.support")}</li>
            <li>{t("retention.items.logs")}</li>
            <li>{t("retention.items.consent")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "rights",
      content: (
        <>
          <p>{t("rights.description")}</p>
          <ul>
            <li>{t("rights.items.access")}</li>
            <li>{t("rights.items.rectification")}</li>
            <li>{t("rights.items.erasure")}</li>
            <li>{t("rights.items.restriction")}</li>
            <li>{t("rights.items.objection")}</li>
            <li>{t("rights.items.portability")}</li>
            <li>{t("rights.items.withdrawConsent")}</li>
            <li>{t("rights.items.complaint")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "automatedDecisionMaking",
      content: (
        <p>
          {policy.automatedDecisionMaking.enabled
            ? t("automatedDecisionMaking.enabled")
            : t("automatedDecisionMaking.disabled")}
        </p>
      ),
    },
    {
      key: "security",
      content: <p>{t("security.description")}</p>,
    },
    policy.features.cookies
      ? {
          key: "cookies",
          content: <p>{t("cookies.description")}</p>,
        }
      : null,
    {
      key: "contact",
      content: (
        <>
          <p>{t("contact.description", { email: contact.email })}</p>
          <p>{t("contact.authority")}</p>
        </>
      ),
    },
  ].filter(isSection) as Section[];

  return (
    <div {...props}>
      <h1>{t("title")}</h1>

      {effectiveDate && (
        <p>
          <strong>{t("effectiveFrom")}</strong> {effectiveDate}
        </p>
      )}

      {sections.map((section, index) => (
        <PolicySection key={section.key} index={index + 1} title={t(`${section.key}.title`)}>
          {section.content}
        </PolicySection>
      ))}
    </div>
  );
}

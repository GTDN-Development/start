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
};

type Section = {
  key: string;
  content: React.ReactNode;
};

function isSection(section: Section | null): section is Section {
  return section !== null;
}

function TermsSection({
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

export function TermsOfService({
  company,
  contact: _contact,
  terms,
  effectiveDate,
  lastUpdated,
  ...props
}: TermsOfServiceProps) {
  const t = useTranslations("legal.termsOfService");
  const legalName = company.legalName ?? company.name;

  const sections = [
    {
      key: "introduction",
      content: (
        <>
          <p>
            {t("introduction.body", {
              company: legalName,
              companyId: company.id,
              address: company.address,
              domain: company.domain,
            })}
            {company.registration && (
              <>
                {" "}
                {t("introduction.registeredIn", {
                  register: t("providerIdentification.registerValue", {
                    court: company.registration.court,
                    fileNumber: company.registration.fileNumber,
                  }),
                })}
              </>
            )}
          </p>
          <p>{t("introduction.contractPart")}</p>
        </>
      ),
    },
    {
      key: "definitions",
      content: (
        <ul>
          <li>{t("definitions.user")}</li>
          <li>{t("definitions.customer")}</li>
          <li>{t("definitions.account")}</li>
          <li>{t("definitions.userContent")}</li>
          <li>{t("definitions.output")}</li>
        </ul>
      ),
    },
    {
      key: "contractFormation",
      content: (
        <>
          <p>{t("contractFormation.description")}</p>
          <ul>
            <li>{t("contractFormation.items.accountRegistration")}</li>
            {terms.features.paidPlans && <li>{t("contractFormation.items.orderConfirmation")}</li>}
            {terms.features.paidPlans && <li>{t("contractFormation.items.paidPlanActivation")}</li>}
            <li>{t("contractFormation.items.individualOffer")}</li>
            <li>{t("contractFormation.items.otherUse")}</li>
          </ul>
          <p>{t("contractFormation.acceptance")}</p>
          <p>{t("contractFormation.authority")}</p>
        </>
      ),
    },
    {
      key: "serviceNature",
      content: (
        <>
          <p>{t("serviceNature.description")}</p>
          <p>{t("serviceNature.noSpecificFeatureGuarantee")}</p>
        </>
      ),
    },
    {
      key: "accountSecurity",
      content: (
        <>
          <p>{t("accountSecurity.description")}</p>
          <ul>
            <li>{t("accountSecurity.items.accurateInformation")}</li>
            <li>{t("accountSecurity.items.credentialsProtection")}</li>
            <li>{t("accountSecurity.items.unauthorizedAccess")}</li>
            <li>{t("accountSecurity.items.incidentReporting")}</li>
          </ul>
          <p>{t("accountSecurity.liability")}</p>
          <p>{t("accountSecurity.securityMeasures")}</p>
        </>
      ),
    },
    {
      key: "licenseScope",
      content: (
        <>
          <p>{t("licenseScope.description")}</p>
          <p>{t("licenseScope.restrictionsIntro")}</p>
          <ul>
            <li>{t("licenseScope.items.copying")}</li>
            <li>{t("licenseScope.items.circumvention")}</li>
            <li>{t("licenseScope.items.reverseEngineering")}</li>
            <li>{t("licenseScope.items.harmfulUse")}</li>
          </ul>
          <p>{t("licenseScope.ipReservation")}</p>
        </>
      ),
    },
    {
      key: "userContent",
      content: (
        <>
          <p>{t("userContent.description")}</p>
          <p>{t("userContent.representationsIntro")}</p>
          <ul>
            <li>{t("userContent.items.rightsAndConsents")}</li>
            <li>{t("userContent.items.thirdPartyRights")}</li>
            <li>{t("userContent.items.lawfulProcessing")}</li>
            <li>{t("userContent.items.outputReview")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "prohibitedUse",
      content: (
        <>
          <p>{t("prohibitedUse.description")}</p>
          <ul>
            <li>{t("prohibitedUse.items.unlawfulConduct")}</li>
            <li>{t("prohibitedUse.items.malware")}</li>
            <li>{t("prohibitedUse.items.unauthorizedInterference")}</li>
            <li>{t("prohibitedUse.items.thirdPartyRights")}</li>
            <li>{t("prohibitedUse.items.scraping")}</li>
            <li>{t("prohibitedUse.items.infrastructureLoad")}</li>
            <li>{t("prohibitedUse.items.highImpactAutomation")}</li>
          </ul>
        </>
      ),
    },
    terms.features.paidPlans
      ? {
          key: "pricing",
          content: (
            <>
              <p>{t("pricing.description")}</p>
              <ul>
                <li>{t("pricing.items.prepaid")}</li>
                {terms.features.autoRenewal && <li>{t("pricing.items.autoRenewal")}</li>}
                {terms.features.autoRenewal && <li>{t("pricing.items.disableRenewal")}</li>}
                <li>{t("pricing.items.nonRefundable")}</li>
              </ul>
              {terms.features.thirdPartyPayments && <p>{t("pricing.thirdPartyPayments")}</p>}
            </>
          ),
        }
      : null,
    terms.features.trials || terms.features.betaFeatures
      ? {
          key: "trialAndBeta",
          content: (
            <>
              {terms.features.trials && <p>{t("trialAndBeta.trials")}</p>}
              {terms.features.betaFeatures && <p>{t("trialAndBeta.beta")}</p>}
            </>
          ),
        }
      : null,
    {
      key: "availability",
      content: (
        <>
          <p>{t("availability.description")}</p>
          <p>{t("availability.actionsIntro")}</p>
          <ul>
            <li>{t("availability.items.maintenance")}</li>
            <li>{t("availability.items.restrictions")}</li>
            <li>{t("availability.items.partners")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "liability",
      content: (
        <>
          <p>{t("liability.description")}</p>
          <ul>
            <li>{t("liability.items.thirdPartyOutages")}</li>
            <li>{t("liability.items.indirectDamage")}</li>
            <li>{t("liability.items.outputUse")}</li>
            <li>{t("liability.items.misuse")}</li>
            <li>{t("liability.items.thirdPartyServices")}</li>
          </ul>
          <p>
            {t("liability.cap", {
              lookbackMonths: terms.liabilityLookbackMonths,
              capAmount: terms.liabilityCapAmount,
              capCurrency: terms.liabilityCapCurrency,
            })}
          </p>
          <p>{t("liability.mandatoryLaw")}</p>
        </>
      ),
    },
    {
      key: "indemnification",
      content: (
        <>
          <p>{t("indemnification.description")}</p>
          <ul>
            <li>{t("indemnification.items.termsBreach")}</li>
            <li>{t("indemnification.items.unlawfulUse")}</li>
            <li>{t("indemnification.items.userContentRights")}</li>
            <li>{t("indemnification.items.falseStatements")}</li>
          </ul>
        </>
      ),
    },
    {
      key: "termination",
      content: (
        <>
          <p>{t("termination.description")}</p>
          <ul>
            <li>{t("termination.items.breach")}</li>
            {terms.features.paidPlans && <li>{t("termination.items.nonPayment")}</li>}
            <li>{t("termination.items.harmRisk")}</li>
            <li>{t("termination.items.securityReasons")}</li>
          </ul>
          <p>{t("termination.dataDeletion")}</p>
        </>
      ),
    },
    {
      key: "confidentiality",
      content: <p>{t("confidentiality.description")}</p>,
    },
    terms.features.consumers
      ? {
          key: "consumerRights",
          content: (
            <>
              <p>{t("consumerRights.description")}</p>
              <p>{t("consumerRights.adr", { withdrawalDays: terms.withdrawalPeriodDays })}</p>
              <p>{t("consumerRights.executionConsent")}</p>
              <p>{t("consumerRights.withdrawal")}</p>
            </>
          ),
        }
      : null,
    {
      key: "changes",
      content: <p>{t("changes.description", { noticeDays: terms.changeNoticeDays })}</p>,
    },
    {
      key: "governingLaw",
      content: (
        <>
          <p>{t("governingLaw.description")}</p>
          <p>{t("governingLaw.consumerFallback")}</p>
          <p>{t("governingLaw.courts")}</p>
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

      {lastUpdated && (
        <p>
          <strong>{t("lastUpdated")}</strong> {lastUpdated}
        </p>
      )}

      {sections.map((section, index) => (
        <TermsSection key={section.key} index={index + 1} title={t(`${section.key}.title`)}>
          {section.content}
        </TermsSection>
      ))}
    </div>
  );
}

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

export function TermsOfService({
  company,
  contact,
  terms,
  effectiveDate,
  lastUpdated,
  ...props
}: TermsOfServiceProps) {
  const t = useTranslations("legal.termsOfService");
  const legalName = company.legalName ?? company.name;
  const register = company.registration
    ? t("common.companyRegister", {
        court: company.registration.court,
        fileNumber: company.registration.fileNumber,
      })
    : t("common.companyRegisterFallback");

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

      <section>
        <h2>{t("introduction.title")}</h2>
        <p>
          {t("introduction.article1", {
            companyLegalName: legalName,
            companyId: company.id,
            companyAddress: company.address,
            companyRegister: register,
            contactEmail: contact.email,
            domain: company.domain,
          })}
        </p>
        <p>{t("introduction.article2")}</p>
        <p>{t("introduction.article3")}</p>
        <p>{t("introduction.article4")}</p>
      </section>

      <section>
        <h2>{t("definitions.title")}</h2>
        <ul>
          <li>{t("definitions.user")}</li>
          <li>{t("definitions.customer")}</li>
          <li>{t("definitions.account")}</li>
          <li>{t("definitions.workspace")}</li>
          <li>{t("definitions.userContent")}</li>
          <li>{t("definitions.plan")}</li>
          <li>{t("definitions.order")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("contract.title")}</h2>
        <p>{t("contract.description")}</p>
        <ul>
          <li>{t("contract.items.accountRegistration")}</li>
          <li>{t("contract.items.workspaceActivation")}</li>
          <li>{t("contract.items.orderConfirmation")}</li>
          <li>{t("contract.items.paidPlanActivation")}</li>
          <li>{t("contract.items.useAfterReview")}</li>
          <li>{t("contract.items.otherAcceptance")}</li>
        </ul>
        <p>{t("contract.acceptance")}</p>
        <p>{t("contract.authority")}</p>
      </section>

      <section>
        <h2>{t("age.title")}</h2>
        <p>{t("age.article1", { minimumAge: terms.minimumAge })}</p>
        <p>{t("age.article2")}</p>
        <p>{t("age.article3")}</p>
      </section>

      <section>
        <h2>{t("account.title")}</h2>
        <p>{t("account.article1")}</p>
        <p>{t("account.article2")}</p>
        <p>{t("account.article3")}</p>
        <p>{t("account.article4")}</p>
        <p>{t("account.article5")}</p>
      </section>

      <section>
        <h2>{t("service.title")}</h2>
        <p>{t("service.article1")}</p>
        <p>{t("service.article2")}</p>
        <p>{t("service.article3")}</p>
        <p>{t("service.article4")}</p>
        <ul>
          {terms.hasFreePlan && <li>{t("service.features.hasFreePlan")}</li>}
          {terms.hasTrial && terms.trialDays !== null && (
            <li>{t("service.features.hasTrial", { trialDays: terms.trialDays })}</li>
          )}
          {terms.hasMonthlyBilling && <li>{t("service.features.hasMonthlyBilling")}</li>}
          {terms.hasAnnualBilling && <li>{t("service.features.hasAnnualBilling")}</li>}
          {terms.hasAutoRenewal && <li>{t("service.features.hasAutoRenewal")}</li>}
          {terms.hasAiFeatures && <li>{t("service.features.hasAiFeatures")}</li>}
          {terms.hasDataExport && <li>{t("service.features.hasDataExport")}</li>}
          {terms.hasEnterpriseSla && <li>{t("service.features.hasEnterpriseSla")}</li>}
        </ul>
      </section>

      <section>
        <h2>{t("pricing.title")}</h2>
        <p>{t("pricing.article1")}</p>
        <p>{t("pricing.article2")}</p>
        {terms.hasAutoRenewal && <p>{t("pricing.article3")}</p>}
        <p>{t("pricing.article4")}</p>
        <p>{t("pricing.article5")}</p>
        <p>{t("pricing.article6")}</p>
        <p>{t("pricing.article7")}</p>
        <p>{t("pricing.article8")}</p>
      </section>

      {terms.supportsConsumers && (
        <section>
          <h2>{t("consumers.title")}</h2>
          <p>{t("consumers.article1")}</p>
          <p>{t("consumers.article2")}</p>
          <p>
            {t("consumers.article3", {
              adrAuthority: terms.adr.authority,
              adrWebsite: terms.adr.website,
            })}
          </p>
          <p>{t("consumers.article4")}</p>
        </section>
      )}

      <section>
        <h2>{t("license.title")}</h2>
        <p>{t("license.article1")}</p>
        <p>{t("license.article2")}</p>
        <ul>
          <li>{t("license.items.copying")}</li>
          <li>{t("license.items.circumvention")}</li>
          <li>{t("license.items.reverseEngineering")}</li>
          <li>{t("license.items.harmfulUse")}</li>
        </ul>
        <p>{t("license.article3")}</p>
      </section>

      <section>
        <h2>{t("userContent.title")}</h2>
        <p>{t("userContent.article1")}</p>
        <p>{t("userContent.article2")}</p>
        <ul>
          <li>{t("userContent.items.rights")}</li>
          <li>{t("userContent.items.legalTitle")}</li>
          <li>{t("userContent.items.thirdPartyRights")}</li>
          <li>{t("userContent.items.lawfulUse")}</li>
          <li>{t("userContent.items.noHarm")}</li>
        </ul>
        <p>{t("userContent.article3")}</p>
        {terms.usesDpa && <p>{t("userContent.article4")}</p>}
      </section>

      <section>
        <h2>{t("prohibitedUse.title")}</h2>
        <p>{t("prohibitedUse.article1")}</p>
        <ul>
          <li>{t("prohibitedUse.items.unlawful")}</li>
          <li>{t("prohibitedUse.items.malware")}</li>
          <li>{t("prohibitedUse.items.interference")}</li>
          <li>{t("prohibitedUse.items.thirdPartyRights")}</li>
          <li>{t("prohibitedUse.items.spamFraud")}</li>
          <li>{t("prohibitedUse.items.harmfulContent")}</li>
          <li>{t("prohibitedUse.items.riskyData")}</li>
          <li>{t("prohibitedUse.items.specialCategories")}</li>
          <li>{t("prohibitedUse.items.infrastructureLoad")}</li>
          <li>{t("prohibitedUse.items.limitCircumvention")}</li>
        </ul>
        <p>{t("prohibitedUse.article2")}</p>
      </section>

      <section>
        <h2>{t("availability.title")}</h2>
        <p>{t("availability.article1")}</p>
        <p>{t("availability.article2")}</p>
        <p>{t("availability.article3")}</p>
        {terms.hasEnterpriseSla && <p>{t("availability.article4")}</p>}
        <p>{t("availability.article5")}</p>
      </section>

      <section>
        <h2>{t("termination.title")}</h2>
        <p>{t("termination.article1")}</p>
        <p>{t("termination.article2")}</p>
        <ul>
          <li>{t("termination.items.termsBreach")}</li>
          <li>{t("termination.items.nonPayment")}</li>
          <li>{t("termination.items.harm")}</li>
          <li>{t("termination.items.suspicion")}</li>
          <li>{t("termination.items.operationalReasons")}</li>
        </ul>
        {terms.allowsImmediateSuspension && <p>{t("termination.article3")}</p>}
        <p>{t("termination.article4")}</p>
      </section>

      <section>
        <h2>{t("postTerminationData.title")}</h2>
        <p>{t("postTerminationData.article1")}</p>
        {terms.hasDataExport && <p>{t("postTerminationData.article2")}</p>}
        <p>{t("postTerminationData.article3")}</p>
        {terms.allowsPostTerminationRetention && (
          <>
            <p>{t("postTerminationData.article4")}</p>
            <ul>
              <li>{t("postTerminationData.items.legalObligations")}</li>
              <li>{t("postTerminationData.items.legitimateInterests")}</li>
              <li>{t("postTerminationData.items.records")}</li>
              <li>{t("postTerminationData.items.disputes")}</li>
              <li>{t("postTerminationData.items.backups")}</li>
            </ul>
          </>
        )}
        <p>{t("postTerminationData.article5")}</p>
      </section>

      <section>
        <h2>{t("liability.title")}</h2>
        <p>{t("liability.article1")}</p>
        <p>{t("liability.article2")}</p>
        <ul>
          <li>{t("liability.items.thirdParties")}</li>
          <li>{t("liability.items.incorrectUse")}</li>
          <li>{t("liability.items.userContent")}</li>
          <li>{t("liability.items.dataLoss")}</li>
          <li>{t("liability.items.indirectDamage")}</li>
          <li>{t("liability.items.userDecisions")}</li>
        </ul>
        <p>{t("liability.article3", { liabilityLookbackMonths: terms.liabilityLookbackMonths })}</p>
        <p>{t("liability.article4")}</p>
      </section>

      <section>
        <h2>{t("indemnification.title")}</h2>
        <p>{t("indemnification.article1")}</p>
        <ul>
          <li>{t("indemnification.items.termsBreach")}</li>
          <li>{t("indemnification.items.unlawfulUse")}</li>
          <li>{t("indemnification.items.thirdPartyRights")}</li>
          <li>{t("indemnification.items.personalData")}</li>
          <li>{t("indemnification.items.falseStatements")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("privacy.title")}</h2>
        <p>{t("privacy.article1")}</p>
        <p>{t("privacy.article2")}</p>
        {terms.usesDpa && <p>{t("privacy.article3")}</p>}
        <p>{t("privacy.article4")}</p>
      </section>

      <section>
        <h2>{t("changes.title")}</h2>
        <p>{t("changes.article1")}</p>
        <p>{t("changes.article2")}</p>
        <p>{t("changes.article3")}</p>
        <p>{t("changes.article4")}</p>
      </section>

      <section>
        <h2>{t("governingLaw.title")}</h2>
        <p>{t("governingLaw.article1")}</p>
        {terms.supportsConsumers && <p>{t("governingLaw.article2")}</p>}
        <p>{t("governingLaw.article3")}</p>
      </section>

      <section>
        <h2>{t("final.title")}</h2>
        <p>{t("final.article1")}</p>
        <p>{t("final.article2")}</p>
        <p>{t("final.article3", { effectiveDate: effectiveDate ?? "-" })}</p>
      </section>

      <section>
        <h2>{t("contact.title")}</h2>
        <p>{t("contact.description", { email: contact.email })}</p>
        {contact.phone && <p>{t("contact.phone", { phone: contact.phone })}</p>}
      </section>
    </div>
  );
}

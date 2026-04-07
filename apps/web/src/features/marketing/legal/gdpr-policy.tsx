import { useTranslations } from "next-intl";
import type { GdprPolicyConfig } from "@/config/legal";

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
  effectiveDate?: string;
};

export function GdprPolicy({ company, contact, policy, effectiveDate, ...props }: GdprPolicyProps) {
  const t = useTranslations("legal.gdprPolicy");
  const register = t("common.companyRegisterFallback");

  return (
    <div {...props}>
      <h1>{t("title")}</h1>

      {effectiveDate && (
        <p>
          <strong>{t("effectiveFrom")}</strong> {effectiveDate}
        </p>
      )}

      <section>
        <h2>{t("controller.title")}</h2>
        <p>
          {t("controller.article1", {
            companyLegalName: company.name,
            companyId: company.id,
            companyAddress: company.address,
            companyRegister: register,
            contactEmail: contact.email,
            domain: company.domain,
          })}
        </p>
        <p>{t("controller.article2")}</p>
        <p>{t("controller.article3")}</p>
      </section>

      <section>
        <h2>{t("dataCategories.title")}</h2>
        <p>{t("dataCategories.article1")}</p>
        <ul>
          <li>{t("dataCategories.items.identification")}</li>
          <li>{t("dataCategories.items.contact")}</li>
          <li>{t("dataCategories.items.account")}</li>
          <li>{t("dataCategories.items.workspace")}</li>
          <li>{t("dataCategories.items.billing")}</li>
          <li>{t("dataCategories.items.technical")}</li>
          <li>{t("dataCategories.items.usage")}</li>
          <li>{t("dataCategories.items.communication")}</li>
          {policy.hasCookies && <li>{t("dataCategories.items.cookies")}</li>}
          <li>{t("dataCategories.items.other")}</li>
        </ul>
        <p>{t("dataCategories.article2")}</p>
      </section>

      <section>
        <h2>{t("sources.title")}</h2>
        <p>{t("sources.article1")}</p>
        <ul>
          <li>{t("sources.items.directlyFromUser")}</li>
          <li>{t("sources.items.automaticCollection")}</li>
          <li>{t("sources.items.otherWorkspaceUsers")}</li>
          <li>{t("sources.items.partners")}</li>
          <li>{t("sources.items.publicSources")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("purposes.title")}</h2>
        <p>{t("purposes.article1")}</p>
        <ul>
          <li>{t("purposes.items.account")}</li>
          <li>{t("purposes.items.service")}</li>
          <li>{t("purposes.items.workspace")}</li>
          <li>{t("purposes.items.contract")}</li>
          <li>{t("purposes.items.billing")}</li>
          <li>{t("purposes.items.security")}</li>
          <li>{t("purposes.items.support")}</li>
          <li>{t("purposes.items.operationalMessages")}</li>
          <li>{t("purposes.items.improvement")}</li>
          {policy.hasMarketingCommunications && <li>{t("purposes.items.marketing")}</li>}
          <li>{t("purposes.items.legalObligations")}</li>
          <li>{t("purposes.items.claims")}</li>
          {policy.hasCookies && <li>{t("purposes.items.cookies")}</li>}
        </ul>
      </section>

      <section>
        <h2>{t("legalBases.title")}</h2>
        <p>{t("legalBases.article1")}</p>
        <ul>
          <li>{t("legalBases.items.contract")}</li>
          <li>{t("legalBases.items.legalObligation")}</li>
          <li>{t("legalBases.items.legitimateInterest")}</li>
          <li>{t("legalBases.items.consent")}</li>
        </ul>
        <p>{t("legalBases.article2")}</p>
        <ul>
          <li>{t("legalBases.contractItems.account")}</li>
          <li>{t("legalBases.contractItems.service")}</li>
          <li>{t("legalBases.contractItems.workspace")}</li>
          <li>{t("legalBases.contractItems.order")}</li>
          <li>{t("legalBases.contractItems.communication")}</li>
        </ul>
        <p>{t("legalBases.article3")}</p>
        <ul>
          <li>{t("legalBases.legalObligationItems.accounting")}</li>
          <li>{t("legalBases.legalObligationItems.tax")}</li>
          <li>{t("legalBases.legalObligationItems.regulatory")}</li>
          <li>{t("legalBases.legalObligationItems.authorities")}</li>
        </ul>
        <p>{t("legalBases.article4")}</p>
        <ul>
          <li>{t("legalBases.legitimateInterestItems.security")}</li>
          <li>{t("legalBases.legitimateInterestItems.fraud")}</li>
          <li>{t("legalBases.legitimateInterestItems.logs")}</li>
          <li>{t("legalBases.legitimateInterestItems.claims")}</li>
          {policy.hasAnalytics && <li>{t("legalBases.legitimateInterestItems.analytics")}</li>}
          <li>{t("legalBases.legitimateInterestItems.customerCommunication")}</li>
          {policy.hasMarketingCommunications && (
            <li>{t("legalBases.legitimateInterestItems.marketing")}</li>
          )}
        </ul>
        <p>{t("legalBases.article5")}</p>
        <ul>
          {policy.hasCookies && <li>{t("legalBases.consentItems.cookies")}</li>}
          {policy.hasMarketingCommunications && <li>{t("legalBases.consentItems.marketing")}</li>}
          <li>{t("legalBases.consentItems.other")}</li>
        </ul>
      </section>

      {policy.usesDpa && (
        <section>
          <h2>{t("roles.title")}</h2>
          <p>{t("roles.article1")}</p>
          <p>{t("roles.article2")}</p>
          <p>{t("roles.article3")}</p>
          <ul>
            <li>{t("roles.items.tasks")}</li>
            <li>{t("roles.items.notes")}</li>
            <li>{t("roles.items.files")}</li>
            <li>{t("roles.items.contacts")}</li>
            <li>{t("roles.items.teamMembers")}</li>
            <li>{t("roles.items.otherRecords")}</li>
          </ul>
          <p>{t("roles.article4")}</p>
          <p>{t("roles.article5")}</p>
        </section>
      )}

      <section>
        <h2>{t("recipients.title")}</h2>
        <p>{t("recipients.article1")}</p>
        <ul>
          <li>{t("recipients.items.hosting")}</li>
          <li>{t("recipients.items.analytics")}</li>
          <li>{t("recipients.items.support")}</li>
          <li>{t("recipients.items.payments")}</li>
          <li>{t("recipients.items.security")}</li>
          <li>{t("recipients.items.advisors")}</li>
          <li>{t("recipients.items.authorities")}</li>
          <li>{t("recipients.items.other")}</li>
        </ul>
        {policy.hasProcessorList && <p>{t("recipients.article2")}</p>}
      </section>

      {policy.hasThirdCountryTransfers && (
        <section>
          <h2>{t("thirdCountryTransfers.title")}</h2>
          <p>{t("thirdCountryTransfers.article1")}</p>
          <p>{t("thirdCountryTransfers.article2")}</p>
          <ul>
            <li>{t("thirdCountryTransfers.items.adequacy")}</li>
            <li>{t("thirdCountryTransfers.items.scc")}</li>
            <li>{t("thirdCountryTransfers.items.otherMechanism")}</li>
          </ul>
        </section>
      )}

      <section>
        <h2>{t("retention.title")}</h2>
        <p>{t("retention.article1")}</p>
        <p>{t("retention.article2")}</p>
        <ul>
          <li>{t("retention.items.account")}</li>
          <li>{t("retention.items.workspace")}</li>
          <li>{t("retention.items.legalObligations")}</li>
          <li>{t("retention.items.claims")}</li>
          <li>{t("retention.items.consent")}</li>
        </ul>
        <p>{t("retention.article3")}</p>
        <ul>
          <li>{t("retention.postTerminationItems.legalObligations")}</li>
          <li>{t("retention.postTerminationItems.legitimateInterests")}</li>
          <li>{t("retention.postTerminationItems.disputes")}</li>
          <li>{t("retention.postTerminationItems.contractual")}</li>
          <li>{t("retention.postTerminationItems.logs")}</li>
        </ul>
        <p>{t("retention.article4")}</p>
      </section>

      <section>
        <h2>{t("rights.title")}</h2>
        <p>{t("rights.article1")}</p>
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
        <p>{t("rights.article2")}</p>
        <p>{t("rights.article3")}</p>
      </section>

      {policy.hasCookies && (
        <section>
          <h2>{t("cookies.title")}</h2>
          <p>{t("cookies.article1")}</p>
          <p>{t("cookies.article2")}</p>
        </section>
      )}

      <section>
        <h2>{t("security.title")}</h2>
        <p>{t("security.article1")}</p>
        <p>{t("security.article2")}</p>
        <ul>
          <li>{t("security.items.access")}</li>
          <li>{t("security.items.authentication")}</li>
          <li>{t("security.items.logging")}</li>
          <li>{t("security.items.infrastructure")}</li>
          <li>{t("security.items.encryption")}</li>
          <li>{t("security.items.backups")}</li>
          <li>{t("security.items.incidents")}</li>
        </ul>
        <p>{t("security.article3")}</p>
      </section>

      <section>
        <h2>{t("minors.title")}</h2>
        <p>{t("minors.article1", { minimumAge: policy.minimumAge })}</p>
        <p>{t("minors.article2")}</p>
        <p>{t("minors.article3")}</p>
      </section>

      <section>
        <h2>{t("contact.title")}</h2>
        <p>{t("contact.article1")}</p>
        <p>{t("contact.email", { email: contact.email })}</p>
        <p>{t("contact.address", { address: company.address })}</p>
        {policy.hasDpo && policy.dpoEmail && <p>{t("contact.dpo", { email: policy.dpoEmail })}</p>}
      </section>

      <section>
        <h2>{t("changes.title")}</h2>
        <p>{t("changes.article1")}</p>
        <p>{t("changes.article2")}</p>
        <p>{t("changes.article3", { effectiveDate: effectiveDate ?? "-" })}</p>
      </section>
    </div>
  );
}

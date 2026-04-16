import { useTranslations } from "next-intl";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import type { CookiePolicyConfig } from "@/config/legal";
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";
import type { Cookie, CookieCategory } from "@/types/cookies";

type CookiePolicyProps = React.ComponentProps<"div"> & {
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
  policy: CookiePolicyConfig;
  cookies?: Cookie[];
  lastUpdated?: string;
  effectiveDate?: string;
};

const cookieCategories: CookieCategory[] = ["essential", "functional", "analytics", "marketing"];

export function CookiePolicy({
  company,
  contact,
  policy,
  cookies,
  lastUpdated,
  effectiveDate,
  ...props
}: CookiePolicyProps) {
  const t = useTranslations("legal.cookiePolicy");
  const cookieConsentEnabled = isCookieConsentEnabled();
  const actualCookies = cookies ?? [];
  const thirdPartyProviders = Array.from(
    new Set(actualCookies.filter((cookie) => cookie.thirdParty).map((cookie) => cookie.provider))
  );

  const groupedCookies = actualCookies.reduce(
    (acc, cookie) => {
      acc[cookie.category] = acc[cookie.category] || [];
      acc[cookie.category].push(cookie);
      return acc;
    },
    {} as Record<CookieCategory, Cookie[]>
  );

  function getStorageTypeLabel(storageType: Cookie["storageType"] | undefined): string {
    if (storageType === "localStorage") {
      return t("storageType.localStorage");
    }

    if (storageType === "sessionStorage") {
      return t("storageType.sessionStorage");
    }

    return t("storageType.cookie");
  }

  function getDurationLabel(cookie: Cookie): string {
    if (cookie.duration.kind === "session") {
      return t("duration.session");
    }

    if (cookie.duration.kind === "persistent") {
      return t("duration.persistent");
    }

    if (cookie.duration.kind === "conditional") {
      return t(`duration.conditional.${cookie.duration.labelKey}`);
    }

    return t(`duration.relative.${cookie.duration.unit}`, {
      count: cookie.duration.value,
    });
  }

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
            companyLegalName: company.name,
            companyId: company.id,
            companyAddress: company.address,
            contactEmail: contact.email,
            domain: company.domain,
          })}
        </p>
        <p>{t("introduction.article2")}</p>
        <p>{t("introduction.article3")}</p>
      </section>

      <section>
        <h2>{t("whatAreCookies.title")}</h2>
        <p>{t("whatAreCookies.article1")}</p>
        <p>{t("whatAreCookies.article2")}</p>
        <ul>
          <li>{t("whatAreCookies.items.operation")}</li>
          <li>{t("whatAreCookies.items.preferences")}</li>
          <li>{t("whatAreCookies.items.consent")}</li>
          <li>{t("whatAreCookies.items.analytics")}</li>
          <li>{t("whatAreCookies.items.performance")}</li>
          {policy.hasMarketing && <li>{t("whatAreCookies.items.marketing")}</li>}
        </ul>
      </section>

      <section>
        <h2>{t("categories.title")}</h2>
        <p>{t("categories.article1")}</p>
        <h3>{t("categories.essential.title")}</h3>
        <p>{t("categories.essential.article1")}</p>
        <p>{t("categories.essential.article2")}</p>

        {policy.hasFunctionalStorage && (
          <>
            <h3>{t("categories.functional.title")}</h3>
            <p>{t("categories.functional.article1")}</p>
            <p>{t("categories.functional.article2")}</p>
          </>
        )}

        {policy.hasAnalytics && (
          <>
            <h3>{t("categories.analytics.title")}</h3>
            <p>{t("categories.analytics.article1")}</p>
            <p>{t("categories.analytics.article2")}</p>
          </>
        )}

        {policy.hasMarketing && (
          <>
            <h3>{t("categories.marketing.title")}</h3>
            <p>{t("categories.marketing.article1")}</p>
            <p>{t("categories.marketing.article2")}</p>
          </>
        )}
      </section>

      <section>
        <h2>{t("legalBasis.title")}</h2>
        <p>{t("legalBasis.article1")}</p>
        <p>{t("legalBasis.article2")}</p>
        <p>{t("legalBasis.article3")}</p>
      </section>

      <section>
        <h2>{t("purposes.title")}</h2>
        <p>{t("purposes.article1")}</p>
        <ul>
          <li>{t("purposes.items.consent")}</li>
          <li>{t("purposes.items.session")}</li>
          <li>{t("purposes.items.security")}</li>
          <li>{t("purposes.items.settings")}</li>
          <li>{t("purposes.items.personalization")}</li>
          {policy.hasAnalytics && <li>{t("purposes.items.analytics")}</li>}
          {policy.hasAnalytics && <li>{t("purposes.items.performance")}</li>}
          {policy.hasMarketing && <li>{t("purposes.items.marketing")}</li>}
          <li>{t("purposes.items.integrations")}</li>
        </ul>
      </section>

      <section>
        <h2>{t("consentManagement.title")}</h2>
        <p>{t("consentManagement.article1")}</p>
        <p>{t("consentManagement.article2")}</p>
        <ul>
          <li>{t("consentManagement.items.banner")}</li>
          <li>{t("consentManagement.items.settingsButton")}</li>
          <li>{t("consentManagement.items.browser")}</li>
        </ul>
        <p>{t("consentManagement.article3")}</p>
        {cookieConsentEnabled && (
          <div className="mt-4">
            <CookieSettingsTrigger className="cursor-pointer font-medium underline underline-offset-2">
              {t("consentManagement.button")}
            </CookieSettingsTrigger>
          </div>
        )}
      </section>

      <section>
        <h2>{t("thirdParties.title")}</h2>
        <p>{t("thirdParties.article1")}</p>
        <p>{t("thirdParties.article2")}</p>
        <p>{t("thirdParties.article3")}</p>
        <p>{t("thirdParties.article4")}</p>
        {thirdPartyProviders.length > 0 && (
          <ul>
            {thirdPartyProviders.map((provider) => (
              <li key={provider}>{provider}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{t("catalog.title")}</h2>
        <p>{t("catalog.article1")}</p>
        <ul>
          <li>{t("catalog.items.name")}</li>
          <li>{t("catalog.items.provider")}</li>
          <li>{t("catalog.items.category")}</li>
          <li>{t("catalog.items.purpose")}</li>
          <li>{t("catalog.items.duration")}</li>
          <li>{t("catalog.items.storageType")}</li>
          <li>{t("catalog.items.thirdParty")}</li>
        </ul>
        <p>{t("catalog.article2")}</p>
        <p>{t("catalog.article3")}</p>
        {cookieCategories
          .filter((category) => (groupedCookies[category]?.length ?? 0) > 0)
          .map((category) => (
            <div key={category} className="mt-6">
              <h3>{t(`category.${category}`)}</h3>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>{t("table.name")}</th>
                      <th>{t("table.provider")}</th>
                      <th>{t("table.purpose")}</th>
                      <th>{t("table.duration")}</th>
                      <th>{t("table.storageType")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedCookies[category].map((cookie) => (
                      <tr key={cookie.name}>
                        <td>{cookie.name}</td>
                        <td>{cookie.provider}</td>
                        <td>{t(`purposesCatalog.${cookie.purposeKey}`)}</td>
                        <td>{getDurationLabel(cookie)}</td>
                        <td>{getStorageTypeLabel(cookie.storageType)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </section>

      <section>
        <h2>{t("retention.title")}</h2>
        <p>{t("retention.article1")}</p>
        <p>{t("retention.article2")}</p>
        <ul>
          <li>{t("retention.items.session")}</li>
          <li>{t("retention.items.shortTerm")}</li>
          <li>{t("retention.items.longTerm")}</li>
        </ul>
        <p>{t("retention.article3")}</p>
      </section>

      <section>
        <h2>{t("transfers.title")}</h2>
        <p>{t("transfers.article1")}</p>
        <p>{t("transfers.article2")}</p>
      </section>

      <section>
        <h2>{t("changes.title")}</h2>
        <p>{t("changes.article1")}</p>
        <ul>
          <li>{t("changes.items.tools")}</li>
          <li>{t("changes.items.providers")}</li>
          <li>{t("changes.items.legalRequirements")}</li>
          <li>{t("changes.items.consentManagement")}</li>
        </ul>
        <p>{t("changes.article2")}</p>
        <p>{t("changes.article3", { effectiveDate: effectiveDate ?? "-" })}</p>
      </section>

      <section>
        <h2>{t("contact.title")}</h2>
        <p>{t("contact.article1")}</p>
        <p>{t("contact.email", { email: contact.email })}</p>
      </section>
    </div>
  );
}

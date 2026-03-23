import { useTranslations } from "next-intl";
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

type Section = {
  key: string;
  content: React.ReactNode;
};

function isSection(section: Section | null): section is Section {
  return section !== null;
}

const cookieCategories: CookieCategory[] = ["essential", "functional", "analytics", "marketing"];

function CookieSection({
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
  const actualCookies = cookies ?? [];
  const thirdPartyProviders = Array.from(
    new Set(
      actualCookies
        .map((cookie) => cookie.provider)
        .filter((provider) => provider && provider !== company.domain)
    )
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

    return t(`duration.relative.${cookie.duration.unit}`, {
      count: cookie.duration.value,
    });
  }

  const sections = [
    {
      key: "whatAreCookies",
      content: <p>{t("whatAreCookies.description")}</p>,
    },
    {
      key: "categories",
      content: (
        <>
          <p>{t("categories.description")}</p>
          <ul>
            <li>{t("categories.items.essential")}</li>
            {policy.features.functionalStorage && <li>{t("categories.items.functional")}</li>}
            {policy.features.analytics && <li>{t("categories.items.analytics")}</li>}
            {policy.features.marketing && <li>{t("categories.items.marketing")}</li>}
          </ul>
        </>
      ),
    },
    {
      key: "legalBasis",
      content: <p>{t("legalBasis.description")}</p>,
    },
    {
      key: "purposes",
      content: (
        <>
          <p>{t("purposes.description")}</p>
          <ul>
            <li>{t("purposes.items.login")}</li>
            <li>{t("purposes.items.preferences")}</li>
            <li>{t("purposes.items.consent")}</li>
            <li>{t("purposes.items.security")}</li>
            {(policy.features.analytics || policy.features.marketing) && (
              <li>{t("purposes.items.analytics")}</li>
            )}
            {policy.features.marketing && <li>{t("purposes.items.marketing")}</li>}
          </ul>
        </>
      ),
    },
    thirdPartyProviders.length > 0
      ? {
          key: "thirdParties",
          content: (
            <>
              <p>{t("thirdParties.description")}</p>
              <ul>
                {thirdPartyProviders.map((provider) => (
                  <li key={provider}>{provider}</li>
                ))}
              </ul>
              <p>{t("thirdParties.note")}</p>
            </>
          ),
        }
      : null,
    {
      key: "retention",
      content: <p>{t("retention.description")}</p>,
    },
    {
      key: "consentManagement",
      content: (
        <>
          <p>{t("consentManagement.description")}</p>
          <div className="mt-4">
            <CookieSettingsTrigger className="cursor-pointer font-medium underline underline-offset-2">
              {t("consentManagement.button")}
            </CookieSettingsTrigger>
          </div>
        </>
      ),
    },
    {
      key: "browserSettings",
      content: <p>{t("browserSettings.description")}</p>,
    },
    {
      key: "contact",
      content: <p>{t("contact.description", { email: contact.email })}</p>,
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
        <CookieSection key={section.key} index={index + 1} title={t(`${section.key}.title`)}>
          {section.content}
          {section.key === "categories" &&
            cookieCategories
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
        </CookieSection>
      ))}
    </div>
  );
}

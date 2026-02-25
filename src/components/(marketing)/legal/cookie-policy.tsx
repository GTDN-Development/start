import { useTranslations } from "next-intl";
import { CookieSettingsTrigger } from "@/components/(shared)/cookies/cookie-settings-trigger";
import type { Cookie, CookieCategory } from "@/types/cookies";

type CookiePolicyProps = React.ComponentProps<"div"> & {
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
  /** Array of cookie objects to display in the policy */
  cookies?: Cookie[];
  /** Last updated date of the document */
  lastUpdated?: string;
  /** Effective date of the document */
  effectiveDate?: string;
  /** Optional node for custom info on managing cookies (e.g., a button to open settings) */
  cookieManagementInfo?: React.ReactNode;
};

const cookieCategories: CookieCategory[] = ["essential", "functional", "analytics", "marketing"];

export function CookiePolicy({
  company,
  contact,
  cookies,
  lastUpdated,
  effectiveDate,
  cookieManagementInfo,
  ...props
}: CookiePolicyProps) {
  const t = useTranslations("legal.cookiePolicy");
  const actualCookies = cookies ?? [];

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
          {t("lastUpdated")} {lastUpdated}
        </p>
      )}

      <section>
        <h2>{t("introduction.title")}</h2>
        <p>
          {t("introduction.description")} <strong>{company.domain}</strong>.
        </p>
      </section>

      <section>
        <h2>{t("whatAreCookies.title")}</h2>
        <p>{t("whatAreCookies.description")}</p>
      </section>

      <section>
        <h2>{t("howWeUseCookies.title")}</h2>
        <p>{t("howWeUseCookies.description")}</p>
      </section>

      <section>
        <h2>{t("typesOfCookies.title")}</h2>
        {cookieCategories
          .filter((category) => (groupedCookies[category]?.length ?? 0) > 0)
          .map((category) => (
            <div key={category} className="mb-8">
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
                    {groupedCookies[category].map((cookie) => {
                      return (
                        <tr key={cookie.name}>
                          <td>{cookie.name}</td>
                          <td>{cookie.provider}</td>
                          <td>{t(`purposes.${cookie.purposeKey}`)}</td>
                          <td>{getDurationLabel(cookie)}</td>
                          <td>{getStorageTypeLabel(cookie.storageType)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
      </section>

      <section>
        <h2>{t("management.title")}</h2>
        <p>{t("management.description")}</p>
        <div className="mt-4">
          <CookieSettingsTrigger className="cursor-pointer font-medium underline underline-offset-2">
            {t("management.button")}
          </CookieSettingsTrigger>
        </div>
        {cookieManagementInfo && <div className="mt-4">{cookieManagementInfo}</div>}
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

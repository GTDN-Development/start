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

type CookieDetailsDictionary = Record<
  string,
  {
    provider: string;
    purpose: string;
    duration: string;
  }
>;

const cookieCategories: CookieCategory[] = ["essential", "functional", "analytics", "marketing"];

function isCookieCategory(value: string): value is CookieCategory {
  return cookieCategories.includes(value as CookieCategory);
}

function toCookieArray(value: unknown): Cookie[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: Cookie[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as Partial<Cookie>;
    if (
      typeof candidate.name !== "string" ||
      typeof candidate.provider !== "string" ||
      typeof candidate.purpose !== "string" ||
      typeof candidate.duration !== "string" ||
      typeof candidate.category !== "string" ||
      !isCookieCategory(candidate.category)
    ) {
      continue;
    }

    result.push({
      name: candidate.name,
      provider: candidate.provider,
      purpose: candidate.purpose,
      duration: candidate.duration,
      category: candidate.category,
      storageType:
        candidate.storageType === "cookie" ||
        candidate.storageType === "localStorage" ||
        candidate.storageType === "sessionStorage"
          ? candidate.storageType
          : undefined,
    });
  }

  return result;
}

function toCookieDetailsDictionary(value: unknown): CookieDetailsDictionary {
  if (!value || typeof value !== "object") {
    return {};
  }

  const result: CookieDetailsDictionary = {};

  for (const [key, rawDetails] of Object.entries(value)) {
    if (!rawDetails || typeof rawDetails !== "object") {
      continue;
    }

    const details = rawDetails as Partial<{ provider: string; purpose: string; duration: string }>;
    if (
      typeof details.provider === "string" &&
      typeof details.purpose === "string" &&
      typeof details.duration === "string"
    ) {
      result[key] = {
        provider: details.provider,
        purpose: details.purpose,
        duration: details.duration,
      };
    }
  }

  return result;
}

function getCookieDetailKey(cookieName: string): string | undefined {
  const cookieDetailKeyMap = {
    cookie_consent: "cookieConsent",
    theme: "theme",
    consent_change_check: "consentChangeCheck",
    _ga: "ga",
    "_ga_*": "gaWildcard",
    _gid: "gid",
    _gat: "gat",
    _gcl_au: "gclAu",
  } as const;

  return cookieDetailKeyMap[cookieName as keyof typeof cookieDetailKeyMap];
}

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

  const defaultCookies = toCookieArray(t.raw("defaults.cookies"));
  const cookieDetails = toCookieDetailsDictionary(t.raw("cookieDetails"));
  const actualCookies = cookies ?? defaultCookies;

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

  return (
    <div {...props}>
      {effectiveDate && (
        <p className="text-sm opacity-60">
          {t("effectiveFrom")} {effectiveDate}
        </p>
      )}
      {lastUpdated && (
        <p className="text-sm opacity-60">
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
        {(Object.keys(groupedCookies) as CookieCategory[]).map((category) => (
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
                    const detailKey = getCookieDetailKey(cookie.name);
                    const detail = detailKey ? cookieDetails[detailKey] : undefined;

                    return (
                      <tr key={cookie.name}>
                        <td>{cookie.name}</td>
                        <td>{detail?.provider ?? cookie.provider}</td>
                        <td>{detail?.purpose ?? cookie.purpose}</td>
                        <td>{detail?.duration ?? cookie.duration}</td>
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

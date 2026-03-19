import type { AppLocale } from "@/i18n/routing";

export async function getEmailMessages(locale: AppLocale) {
  return (await import(`../../../messages/${locale}.json`)).default;
}

export function formatEmailTimestamp(value: Date, locale: AppLocale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

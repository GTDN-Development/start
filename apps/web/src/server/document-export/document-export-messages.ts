import type { AppLocale } from "@/i18n/routing";

export async function getDocumentExportMessages(locale: AppLocale) {
  return (await import(`../../../messages/${locale}.json`)).default;
}

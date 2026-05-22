import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { getDocumentExportMessages } from "@/server/document-export/document-export-messages";

export type SampleDocumentScope = "user" | "organization";

type SampleDocumentLineItem = {
  label: string;
  value: string;
};

export type SampleDocumentData = {
  locale: AppLocale;
  eyebrow: string;
  issuerName: string;
  title: string;
  issuedAtLabel: string;
  issuedAt: string;
  itemHeader: string;
  valueHeader: string;
  items: SampleDocumentLineItem[];
  totalLabel: string;
  total: string;
  footerNote: string;
};

type BuildSampleDocumentHtmlInput = {
  appName: string;
  locale: AppLocale;
  scopeName: string;
  scopeType: SampleDocumentScope;
};

export async function buildSampleDocumentHtml(input: BuildSampleDocumentHtmlInput) {
  const messages = await getDocumentExportMessages(input.locale);
  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "pages.documentExport.sample",
  });
  const issuedAt = new Intl.DateTimeFormat(input.locale, {
    dateStyle: "medium",
  }).format(new Date(Date.UTC(2026, 0, 15)));

  return renderSampleDocumentHtml({
    locale: input.locale,
    eyebrow: t(`eyebrow.${input.scopeType}`),
    issuerName: input.scopeName,
    title: t("title"),
    issuedAtLabel: t("issuedAtLabel"),
    issuedAt,
    itemHeader: t("itemHeader"),
    valueHeader: t("valueHeader"),
    items: buildSampleLineItems([
      {
        label: t("items.discovery"),
        value: t("amounts.discovery"),
      },
      {
        label: t("items.implementation"),
        value: t("amounts.implementation"),
      },
      {
        label: t("items.review"),
        value: t("amounts.review"),
      },
    ]),
    totalLabel: t("totalLabel"),
    total: t("total"),
    footerNote: t("footerNote", {
      appName: input.appName,
    }),
  });
}

function buildSampleLineItems(items: SampleDocumentLineItem[]): SampleDocumentLineItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const item = items[index % items.length] ?? items[0];

    return {
      label: `${item.label} ${String(index + 1).padStart(2, "0")}`,
      value: item.value,
    };
  });
}

export function renderSampleDocumentHtml(data: SampleDocumentData): string {
  return `<!doctype html>
<html lang="${escapeAttribute(data.locale)}">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(data.title)}</title>
    <style>
      @page {
        size: A4;
        margin: 24mm 20mm;
      }

      * {
        box-sizing: border-box;
      }

      body {
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11px;
        line-height: 1.5;
        margin: 0;
      }

      .header {
        align-items: flex-start;
        border-bottom: 1px solid #d1d5db;
        display: flex;
        justify-content: space-between;
        break-inside: avoid;
        padding-bottom: 24px;
      }

      .eyebrow,
      th,
      .total-label {
        color: #6b7280;
        font-size: 11px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .eyebrow {
        margin: 0 0 6px;
      }

      h1 {
        font-size: 28px;
        line-height: 1.15;
        margin: 32px 0 10px;
      }

      .meta {
        color: #4b5563;
        margin: 0;
      }

      table {
        border-collapse: collapse;
        margin-top: 28px;
        width: 100%;
      }

      thead {
        display: table-header-group;
      }

      tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      th {
        background: #f3f4f6;
        border-bottom: 1px solid #d1d5db;
        padding: 10px 12px;
        text-align: left;
      }

      td {
        border-bottom: 1px solid #e5e7eb;
        padding: 14px 12px;
        vertical-align: top;
      }

      .value {
        font-weight: 700;
        text-align: right;
        white-space: nowrap;
      }

      .total {
        align-items: baseline;
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 24px;
      }

      .total-value {
        font-size: 18px;
        font-weight: 700;
      }

      .footer {
        color: #6b7280;
        font-size: 11px;
        margin-top: 32px;
      }
    </style>
  </head>
  <body>
    <header class="header">
      <div>
        <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
        <strong>${escapeHtml(data.issuerName)}</strong>
      </div>
    </header>

    <main>
      <h1>${escapeHtml(data.title)}</h1>
      <p class="meta">${escapeHtml(data.issuedAtLabel)}: ${escapeHtml(data.issuedAt)}</p>

      <table>
        <thead>
          <tr>
            <th>${escapeHtml(data.itemHeader)}</th>
            <th>${escapeHtml(data.valueHeader)}</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(renderLineItem).join("")}
        </tbody>
      </table>

      <div class="total">
        <span class="total-label">${escapeHtml(data.totalLabel)}</span>
        <span class="total-value">${escapeHtml(data.total)}</span>
      </div>
    </main>

    <footer class="footer">
      ${escapeHtml(data.footerNote)}
    </footer>
  </body>
</html>`;
}

function renderLineItem(item: SampleDocumentLineItem): string {
  return `<tr>
  <td>${escapeHtml(item.label)}</td>
  <td class="value">${escapeHtml(item.value)}</td>
</tr>`;
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

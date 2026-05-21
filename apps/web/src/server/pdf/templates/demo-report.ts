export type DemoReportImage = {
  alt: string;
  src: string;
};

export type DemoReportLineItem = {
  label: string;
  value: string;
};

export type DemoReportData = {
  logo: DemoReportImage | null;
  eyebrow: string;
  issuerName: string;
  title: string;
  items: DemoReportLineItem[];
  footerNote: string;
};

export function renderDemoReportHtml(data: DemoReportData): string {
  return `<!doctype html>
<html lang="en">
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
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
      }

      .header {
        align-items: flex-start;
        border-bottom: 1px solid #d1d5db;
        display: flex;
        justify-content: space-between;
        padding-bottom: 24px;
      }

      .brand-logo {
        display: block;
        height: auto;
        width: 132px;
      }

      .eyebrow {
        color: #6b7280;
        font-size: 11px;
        letter-spacing: 0.08em;
        margin: 0 0 6px;
        text-transform: uppercase;
      }

      h1 {
        font-size: 28px;
        line-height: 1.15;
        margin: 32px 0 10px;
      }

      table {
        border-collapse: collapse;
        margin-top: 28px;
        width: 100%;
      }

      th {
        background: #f3f4f6;
        border-bottom: 1px solid #d1d5db;
        color: #374151;
        font-size: 11px;
        letter-spacing: 0.06em;
        padding: 10px 12px;
        text-align: left;
        text-transform: uppercase;
      }

      td {
        border-bottom: 1px solid #e5e7eb;
        padding: 14px 12px;
        vertical-align: top;
      }

      .value {
        font-size: 20px;
        font-weight: 700;
        white-space: nowrap;
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
      ${data.logo ? renderLogo(data.logo) : ""}
      <div>
        <p class="eyebrow">${escapeHtml(data.eyebrow)}</p>
        <strong>${escapeHtml(data.issuerName)}</strong>
      </div>
    </header>

    <main>
      <h1>${escapeHtml(data.title)}</h1>

      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(renderLineItem).join("")}
        </tbody>
      </table>
    </main>

    <footer class="footer">
      ${escapeHtml(data.footerNote)}
    </footer>
  </body>
</html>`;
}

function renderLogo(logo: DemoReportImage): string {
  return `<img class="brand-logo" src="${escapeAttribute(logo.src)}" alt="${escapeAttribute(logo.alt)}" />`;
}

function renderLineItem(item: DemoReportLineItem): string {
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

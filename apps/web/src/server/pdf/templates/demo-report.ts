type DemoReportRow = {
  label: string;
  value: string;
  note: string;
};

const startLogoSvg = `<svg class="brand-logo" role="img" aria-label="Start" viewBox="0 0 425 124" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xml:space="preserve">
  <g transform="matrix(1,0,0,1,-100.415971,-558.288004)">
    <g transform="matrix(0.721406,0,0,0.306988,0,0)">
      <g transform="matrix(3.324642,0,0,3.324642,-1716.681336,-791.624246)">
        <g transform="matrix(1.386181,0,0,3.25746,-391.846355,-2076.066012)">
          <path d="M738.731,910.81C744.469,910.81 748.406,907.847 748.406,903.085C748.406,899.185 746.044,896.597 739.144,894.985C733.969,893.747 732.656,892.885 732.656,890.56C732.656,888.235 734.569,886.66 737.644,886.66C741.281,886.66 743.344,888.797 743.719,891.872L747.881,891.647C747.281,886.622 743.794,882.985 737.719,882.985C731.981,882.985 728.494,886.135 728.494,890.71C728.494,894.872 730.819,896.71 737.194,898.247C743.081,899.672 744.244,901.06 744.244,903.31C744.244,905.822 742.219,907.135 738.806,907.135C734.831,907.135 732.581,905.072 732.094,901.36L727.931,901.622C728.381,907.097 732.356,910.81 738.731,910.81Z" />
          <path d="M760.031,910.21L763.744,910.21L763.744,906.947L760.894,906.947C759.244,906.947 758.456,906.385 758.456,904.51L758.456,893.522L763.744,893.522L763.744,890.26L758.456,890.26L758.456,885.572L754.481,885.572L754.481,890.26L751.444,890.26L751.444,893.522L754.481,893.522L754.481,904.81C754.481,908.56 756.244,910.21 760.031,910.21Z" />
          <path d="M773.006,910.66C776.119,910.66 778.744,909.235 779.756,907.135C780.056,909.46 781.406,910.322 783.694,910.322C784.294,910.322 784.894,910.285 785.156,910.21L785.156,907.06L784.444,907.06C783.694,907.06 783.394,906.76 783.394,905.785L783.394,898.022C783.394,892.847 780.506,889.81 775.106,889.81C770.381,889.81 767.269,892.285 766.519,896.26L770.606,896.522C771.131,894.347 772.556,893.185 775.106,893.185C777.956,893.185 779.419,894.722 779.419,897.797L772.556,899.11C768.169,899.972 766.181,901.81 766.181,905.222C766.181,908.672 768.844,910.66 773.006,910.66ZM773.644,907.51C771.506,907.51 770.306,906.572 770.306,904.847C770.306,903.31 771.169,902.372 773.569,901.922L779.419,900.797L779.419,902.072C779.419,905.26 777.244,907.51 773.644,907.51Z" />
          <path d="M788.494,910.21L792.469,910.21L792.469,898.435C792.469,895.285 793.969,893.822 797.006,893.822L798.919,893.822L798.919,890.26L797.006,890.26C794.569,890.26 792.994,891.422 792.244,894.047L792.131,890.26L788.494,890.26L788.494,910.21Z" />
          <path d="M809.269,910.21L812.981,910.21L812.981,906.947L810.131,906.947C808.481,906.947 807.694,906.385 807.694,904.51L807.694,893.522L812.981,893.522L812.981,890.26L807.694,890.26L807.694,885.572L803.719,885.572L803.719,890.26L800.681,890.26L800.681,893.522L803.719,893.522L803.719,904.81C803.719,908.56 805.481,910.21 809.269,910.21Z" />
        </g>
        <g transform="matrix(0.281466,0,0,0.661432,343.369093,420.004248)">
          <path d="M809,597.678L809,552L900.356,552L900.356,597.678L809,597.678ZM809,597.678L809,643.356L763.322,643.356L763.322,597.678L809,597.678ZM854.678,689.034L854.678,643.356L900.356,643.356L900.356,689.034L854.678,689.034ZM854.678,689.034L854.678,734.712L763.322,734.712L763.322,689.034L854.678,689.034Z" />
        </g>
      </g>
    </g>
  </g>
</svg>`;

const demoRows: DemoReportRow[] = [
  {
    label: "Users",
    value: "128",
    note: "Active accounts ready for product adoption.",
  },
  {
    label: "Organizations",
    value: "12",
    note: "Organization Scope can connect records to teams later.",
  },
  {
    label: "PDF templates",
    value: "1",
    note: "Concrete templates can live in server/pdf/templates.",
  },
];

export function renderDemoReportHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Start PDF Demo</title>
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
        color: #111827;
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

      .description {
        color: #4b5563;
        margin: 0 0 28px;
        max-width: 560px;
      }

      table {
        border-collapse: collapse;
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
      ${startLogoSvg}
      <div>
        <p class="eyebrow">PDF demo</p>
        <strong>Start App</strong>
      </div>
    </header>

    <main>
      <h1>Start PDF Demo Report</h1>
      <p class="description">
        This fixed report proves the baseline Gotenberg integration without accepting user input.
        Future products can add concrete templates that receive data from PocketBase records.
      </p>

      <table>
        <thead>
          <tr>
            <th>Area</th>
            <th>Value</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          ${demoRows.map(renderDemoReportRow).join("")}
        </tbody>
      </table>
    </main>

    <footer class="footer">
      Generated by the Start Gotenberg baseline.
    </footer>
  </body>
</html>`;
}

function renderDemoReportRow(row: DemoReportRow): string {
  return `<tr>
  <td>${escapeHtml(row.label)}</td>
  <td class="value">${escapeHtml(row.value)}</td>
  <td>${escapeHtml(row.note)}</td>
</tr>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

import { describe, expect, it } from "vitest";
import { renderSampleDocumentHtml, type SampleDocumentData } from "./sample-document";

describe("sample document template", function describeSampleDocumentTemplate() {
  it("renders localized document labels and HTML lang", function testLocalizedHtml() {
    const html = renderSampleDocumentHtml({
      ...createSampleDocumentData(),
      locale: "cs",
      itemHeader: "Položka",
      valueHeader: "Částka",
    });

    expect(html).toContain('<html lang="cs">');
    expect(html).toContain("Položka");
    expect(html).toContain("Částka");
  });

  it("escapes user-controlled values", function testEscaping() {
    const html = renderSampleDocumentHtml({
      ...createSampleDocumentData(),
      issuerName: '<script>alert("x")</script>',
      items: [
        {
          label: "A & B",
          value: "<100>",
        },
      ],
    });

    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).toContain("A &amp; B");
    expect(html).toContain("&lt;100&gt;");
    expect(html).not.toContain("<script>");
  });
});

function createSampleDocumentData(): SampleDocumentData {
  return {
    locale: "en",
    eyebrow: "Personal export",
    issuerName: "Acme Ltd.",
    title: "Sample document export",
    issuedAtLabel: "Issued",
    issuedAt: "Jan 15, 2026",
    itemHeader: "Item",
    valueHeader: "Amount",
    items: [
      {
        label: "Implementation",
        value: "24 000 CZK",
      },
    ],
    totalLabel: "Total",
    total: "24 000 CZK",
    footerNote: "Generated with Start.",
  };
}

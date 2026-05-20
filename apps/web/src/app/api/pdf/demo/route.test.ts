import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/pdf/gotenberg-client", function mockGotenbergClient() {
  return {
    renderHtmlToPdf: vi.fn(),
  };
});

import { renderHtmlToPdf } from "@/server/pdf/gotenberg-client";
import { GET } from "./route";

describe("PDF demo route", function describePdfDemoRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("returns the demo PDF inline", async function testDemoPdfResponse() {
    vi.mocked(renderHtmlToPdf).mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="start-demo-report.pdf"'
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
  });

  it("returns a generic error when PDF generation fails", async function testDemoPdfFailure() {
    vi.mocked(renderHtmlToPdf).mockRejectedValue(new Error("Gotenberg failed."));

    const response = await GET();

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "PDF demo is unavailable.",
    });
  });
});

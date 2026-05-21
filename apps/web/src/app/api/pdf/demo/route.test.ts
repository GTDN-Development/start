import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DemoReportData } from "@/server/pdf/templates/demo-report";

const { requireCurrentUserMock, resolveOrganizationRouteAccessMock } = vi.hoisted(
  function hoistPdfDemoRouteMocks() {
    return {
      requireCurrentUserMock: vi.fn(),
      resolveOrganizationRouteAccessMock: vi.fn(),
    };
  }
);

vi.mock("@/server/pdf/gotenberg-client", function mockGotenbergClient() {
  return {
    renderHtmlToPdf: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    requireCurrentUser: requireCurrentUserMock,
  };
});

vi.mock("@/server/organizations/organization-route-queries", function mockOrganizationRoutes() {
  return {
    resolveOrganizationRouteAccess: resolveOrganizationRouteAccessMock,
  };
});

import { renderHtmlToPdf } from "@/server/pdf/gotenberg-client";
import { POST } from "./route";

describe("PDF demo route", function describePdfDemoRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb: {},
      user: {
        id: "user-1",
      },
    });
  });

  it("renders posted demo data as an inline PDF", async function testDemoPdfResponse() {
    vi.mocked(renderHtmlToPdf).mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);

    const response = await POST(createPdfDemoRequest(validDemoReportData));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="start-demo-report.pdf"'
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(vi.mocked(renderHtmlToPdf)).toHaveBeenCalledOnce();
    expect(vi.mocked(renderHtmlToPdf).mock.calls[0]?.[0]).toContain("Invoice INV-2026-001");
    expect(resolveOrganizationRouteAccessMock).not.toHaveBeenCalled();
  });

  it("checks organization scope access before rendering", async function testOrganizationScopeAccess() {
    vi.mocked(renderHtmlToPdf).mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);
    resolveOrganizationRouteAccessMock.mockResolvedValue({
      ok: true,
      data: {
        organization: {
          slug: "team",
        },
      },
    });

    const response = await POST(
      createPdfDemoRequest(validDemoReportData, {
        type: "organization",
        organizationSlug: "team",
      })
    );

    expect(response.status).toBe(200);
    expect(resolveOrganizationRouteAccessMock).toHaveBeenCalledWith("team");
    expect(vi.mocked(renderHtmlToPdf)).toHaveBeenCalledOnce();
  });

  it("requires an authenticated user", async function testAuthenticatedUserRequired() {
    requireCurrentUserMock.mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });

    const response = await POST(createPdfDemoRequest(validDemoReportData));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized.",
    });
    expect(renderHtmlToPdf).not.toHaveBeenCalled();
  });

  it("rejects invalid demo data", async function testInvalidDemoData() {
    const response = await POST(
      new Request("https://example.com/api/pdf/demo", {
        method: "POST",
        body: JSON.stringify({
          title: "Missing required fields",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid PDF demo data.",
    });
    expect(renderHtmlToPdf).not.toHaveBeenCalled();
  });

  it("returns a generic error when PDF generation fails", async function testDemoPdfFailure() {
    vi.mocked(renderHtmlToPdf).mockRejectedValue(new Error("Gotenberg failed."));

    const response = await POST(createPdfDemoRequest(validDemoReportData));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "PDF demo is unavailable.",
    });
  });
});

const validDemoReportData: DemoReportData = {
  logo: null,
  eyebrow: "Invoice",
  issuerName: "Acme Ltd.",
  title: "Invoice INV-2026-001",
  items: [
    {
      label: "Consulting",
      value: "42 000 CZK",
    },
  ],
  footerNote: "Thank you for your business.",
};

function createPdfDemoRequest(
  data: DemoReportData,
  scope:
    | {
        type: "user";
      }
    | {
        type: "organization";
        organizationSlug: string;
      } = {
    type: "user",
  }
): Request {
  return new Request("https://example.com/api/pdf/demo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      scope,
      report: data,
    }),
  });
}

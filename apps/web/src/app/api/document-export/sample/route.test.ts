import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { requireCurrentUserMock, resolveOrganizationRouteAccessMock } = vi.hoisted(
  function hoistDocumentExportRouteMocks() {
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
import { GET } from "./route";

describe("document export sample route", function describeDocumentExportRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb: {},
      user: {
        email: "user@example.com",
        id: "user-1",
        name: "Ada Lovelace",
      },
    });
  });

  it("renders a server-side personal sample as an inline PDF", async function testPersonalExport() {
    vi.mocked(renderHtmlToPdf).mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);

    const response = await GET(createDocumentExportRequest("locale=en"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toBe(
      'inline; filename="start-sample-document.pdf"'
    );
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([37, 80, 68, 70]));
    expect(vi.mocked(renderHtmlToPdf)).toHaveBeenCalledOnce();

    const renderInput = vi.mocked(renderHtmlToPdf).mock.calls[0]?.[0];

    expect(renderInput?.html).toContain('<html lang="en">');
    expect(renderInput?.html).toContain("Sample document export");
    expect(renderInput?.html).toContain("Ada Lovelace");
    expect(renderInput?.html).toContain("size: A4");
    expect(renderInput?.page?.preferCssPageSize).toBe(true);
    expect(resolveOrganizationRouteAccessMock).not.toHaveBeenCalled();
  });

  it("checks organization scope access before rendering", async function testOrganizationExport() {
    vi.mocked(renderHtmlToPdf).mockResolvedValue(new Uint8Array([37, 80, 68, 70]).buffer);
    resolveOrganizationRouteAccessMock.mockResolvedValue({
      ok: true,
      data: {
        organization: {
          name: "Acme Ltd.",
          slug: "team",
        },
      },
    });

    const response = await GET(createDocumentExportRequest("organizationSlug=team&locale=cs"));

    expect(response.status).toBe(200);
    expect(resolveOrganizationRouteAccessMock).toHaveBeenCalledWith("team");

    const renderInput = vi.mocked(renderHtmlToPdf).mock.calls[0]?.[0];

    expect(renderInput?.html).toContain('<html lang="cs">');
    expect(renderInput?.html).toContain("Ukázkový export dokumentu");
    expect(renderInput?.html).toContain("Acme Ltd.");
  });

  it("requires an authenticated user", async function testAuthenticatedUserRequired() {
    requireCurrentUserMock.mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });

    const response = await GET(createDocumentExportRequest("locale=en"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized.",
    });
    expect(renderHtmlToPdf).not.toHaveBeenCalled();
  });

  it("returns a generic error when PDF generation fails", async function testExportFailure() {
    vi.mocked(renderHtmlToPdf).mockRejectedValue(new Error("Gotenberg failed."));

    const response = await GET(createDocumentExportRequest("locale=en"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "Document export is unavailable.",
    });
  });
});

function createDocumentExportRequest(query: string): NextRequest {
  return new NextRequest(`https://example.com/api/document-export/sample?${query}`, {
    method: "GET",
  });
}

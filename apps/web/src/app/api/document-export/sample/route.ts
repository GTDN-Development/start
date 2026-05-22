import { NextRequest } from "next/server";
import { product } from "@/config/product";
import { routing, type AppLocale } from "@/i18n/routing";
import { requireCurrentUser } from "@/server/auth/auth-session-service";
import { buildSampleDocumentHtml } from "@/server/document-export/sample-document";
import { renderHtmlToPdf } from "@/server/pdf/gotenberg-client";
import { getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

type DocumentExportScope =
  | {
      type: "user";
    }
  | {
      type: "organization";
      organizationSlug: string;
    };

export async function GET(request: NextRequest) {
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return Response.json(
      {
        error: "Unauthorized.",
      },
      {
        status: currentUser.errorCode === "UNAUTHORIZED" ? 401 : 500,
      }
    );
  }

  const scope = parseDocumentExportScope(request.nextUrl.searchParams);

  const scopeAccess = await resolveDocumentExportScopeAccess(scope);

  if (!scopeAccess.ok) {
    return Response.json(
      {
        error: "Document export scope is unavailable.",
      },
      {
        status: scopeAccess.status,
      }
    );
  }

  const locale = parseDocumentExportLocale(request.nextUrl.searchParams.get("locale"));
  const scopeName =
    scope.type === "organization"
      ? (scopeAccess.organizationName ?? product.site.name)
      : (getNullableTrimmedString(currentUser.user.name) ?? currentUser.user.email);

  try {
    const html = await buildSampleDocumentHtml({
      appName: product.site.name,
      locale,
      scopeName,
      scopeType: scope.type,
    });
    const pdf = await renderHtmlToPdf({
      html,
      page: {
        preferCssPageSize: true,
        printBackground: true,
      },
      timeoutMs: 30_000,
    });

    return new Response(pdf, {
      headers: {
        "cache-control": "private, no-store",
        "content-disposition": 'inline; filename="start-sample-document.pdf"',
        "content-type": "application/pdf",
      },
    });
  } catch {
    return Response.json(
      {
        error: "Document export is unavailable.",
      },
      {
        status: 502,
      }
    );
  }
}

function parseDocumentExportScope(searchParams: URLSearchParams): DocumentExportScope {
  const organizationSlug = searchParams.get("organizationSlug")?.trim() ?? "";

  if (organizationSlug) {
    return {
      type: "organization",
      organizationSlug,
    };
  }

  return {
    type: "user",
  };
}

function parseDocumentExportLocale(value: string | null): AppLocale {
  if (value && routing.locales.includes(value as AppLocale)) {
    return value as AppLocale;
  }

  return routing.defaultLocale;
}

async function resolveDocumentExportScopeAccess(scope: DocumentExportScope): Promise<
  | {
      ok: true;
      organizationName?: string;
    }
  | { ok: false; status: number }
> {
  if (scope.type === "user") {
    return {
      ok: true,
    };
  }

  const organizationAccess = await resolveOrganizationRouteAccess(scope.organizationSlug);

  if (organizationAccess.ok) {
    return {
      ok: true,
      organizationName: organizationAccess.data.organization.name,
    };
  }

  switch (organizationAccess.errorCode) {
    case "UNAUTHORIZED":
      return {
        ok: false,
        status: 401,
      };
    case "FORBIDDEN":
      return {
        ok: false,
        status: 403,
      };
    case "NOT_FOUND":
      return {
        ok: false,
        status: 404,
      };
    default:
      return {
        ok: false,
        status: 500,
      };
  }
}

import { z } from "zod";
import { renderHtmlToPdf } from "@/server/pdf/gotenberg-client";
import { renderDemoReportHtml, type DemoReportData } from "@/server/pdf/templates/demo-report";
import { requireCurrentUser } from "@/server/auth/auth-session-service";
import { resolveOrganizationRouteAccess } from "@/server/organizations/organization-route-queries";

const pdfDemoScopeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("user"),
  }),
  z.object({
    type: z.literal("organization"),
    organizationSlug: z.string().trim().min(1).max(120),
  }),
]);

const demoReportDataSchema = z.object({
  logo: z
    .object({
      alt: z.string().trim().min(1).max(80),
      src: z
        .string()
        .trim()
        .max(250_000)
        .regex(/^data:image\/(?:png|jpeg|jpg|webp|svg\+xml);base64,[a-zA-Z0-9+/=]+$/),
    })
    .nullable(),
  eyebrow: z.string().trim().min(1).max(40),
  issuerName: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(120),
        value: z.string().trim().min(1).max(80),
      })
    )
    .min(1),
  footerNote: z.string().trim().min(1).max(240),
}) satisfies z.ZodType<DemoReportData>;

const pdfDemoRequestSchema = z.object({
  scope: pdfDemoScopeSchema,
  report: demoReportDataSchema,
});

export async function POST(request: Request) {
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

  const payload = await parseDemoReportRequest(request);

  if (!payload) {
    return Response.json(
      {
        error: "Invalid PDF demo data.",
      },
      {
        status: 400,
      }
    );
  }

  const scopeAccess = await resolvePdfDemoScopeAccess(payload.scope);

  if (!scopeAccess.ok) {
    return Response.json(
      {
        error: "PDF demo scope is unavailable.",
      },
      {
        status: scopeAccess.status,
      }
    );
  }

  try {
    const pdf = await renderHtmlToPdf(renderDemoReportHtml(payload.report));

    return new Response(pdf, {
      headers: {
        "content-disposition": 'inline; filename="start-demo-report.pdf"',
        "content-type": "application/pdf",
      },
    });
  } catch {
    return Response.json(
      {
        error: "PDF demo is unavailable.",
      },
      {
        status: 502,
      }
    );
  }
}

async function parseDemoReportRequest(
  request: Request
): Promise<z.infer<typeof pdfDemoRequestSchema> | null> {
  try {
    const result = pdfDemoRequestSchema.safeParse(await request.json());

    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function resolvePdfDemoScopeAccess(
  scope: z.infer<typeof pdfDemoScopeSchema>
): Promise<{ ok: true } | { ok: false; status: number }> {
  if (scope.type === "user") {
    return {
      ok: true,
    };
  }

  const organizationAccess = await resolveOrganizationRouteAccess(scope.organizationSlug);

  if (organizationAccess.ok) {
    return {
      ok: true,
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

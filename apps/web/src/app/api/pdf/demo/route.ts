import { renderHtmlToPdf } from "@/server/pdf/gotenberg-client";
import { renderDemoReportHtml } from "@/server/pdf/templates/demo-report";

export async function GET() {
  try {
    const pdf = await renderHtmlToPdf(renderDemoReportHtml());

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

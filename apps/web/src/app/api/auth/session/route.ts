import { NextResponse } from "next/server";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { toAuthApiResponse } from "@/server/auth/auth-response";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";

export async function GET() {
  const result = await getResponseAuthSession();
  const payload = toAuthApiResponse(result);
  const response = appendAuthCookiesToResponse(NextResponse.json(payload), result.setCookie);

  return response;
}

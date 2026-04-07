import { NextResponse } from "next/server";
import { toAuthApiResponse } from "@/server/auth/auth-response";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";

export async function GET() {
  const result = await getResponseAuthSession();
  const payload = toAuthApiResponse(result);
  const response = NextResponse.json(payload);

  if (result.setCookie?.length) {
    for (const cookieValue of result.setCookie) {
      response.headers.append("set-cookie", cookieValue);
    }
  }

  return response;
}

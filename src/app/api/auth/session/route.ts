import { NextResponse } from "next/server";
import { getApiAuthSession, toAuthApiResponse } from "@/server/auth/auth-service";

export async function GET() {
  const result = await getApiAuthSession();
  const payload = toAuthApiResponse(result);
  const response = NextResponse.json(payload);

  if (result.setCookie?.length) {
    for (const cookieValue of result.setCookie) {
      response.headers.append("set-cookie", cookieValue);
    }
  }

  return response;
}

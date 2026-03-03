import { NextRequest } from "next/server";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { removeCurrentUserAvatar, updateCurrentUserAvatar } from "@/server/account/account-service";
import { hasValidOrigin } from "@/server/http/request-utils";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const formData = await parseRequestFormData(request);

  if (!formData) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const avatarFile = formData.get("avatar");

  if (!(avatarFile instanceof File)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await updateCurrentUserAvatar(avatarFile);

  return createAuthApiResponse(result);
}

export async function DELETE(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await removeCurrentUserAvatar();

  return createAuthApiResponse(result);
}

async function parseRequestFormData(request: Request) {
  try {
    return await request.formData();
  } catch {
    return null;
  }
}

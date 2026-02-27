import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { getAccountProfileSnapshot } from "@/features/account/account-profile";
import { jsonError, jsonOk } from "@/server/http/json";
import {
  type AuthenticatedUserApiContext,
  getAuthenticatedUserApiContext,
  refreshAuthenticatedUserApiSession,
  setAuthenticatedUserApiCookie,
} from "@/server/pocketbase/pb-authenticated-context";

const MAX_AVATAR_FILE_SIZE_BYTES = 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const formData = await request.formData();
    const avatar = formData.get("avatar");

    if (!(avatar instanceof File) || avatar.size <= 0) {
      return jsonError("BAD_REQUEST", 400);
    }

    if (!avatar.type.startsWith("image/")) {
      return jsonError("INVALID_FILE_TYPE", 400);
    }

    if (avatar.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      return jsonError("FILE_TOO_LARGE", 400);
    }

    const updatedRecord = await userContext.pb.collection("users").update(userContext.userId, {
      avatar,
    });

    return createUserMutationResponse(userContext.pb, updatedRecord);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        return jsonError("INVALID_AVATAR_FILE", 400);
      }

      if (error.status === 401 || error.status === 403) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    console.error("Upload account avatar API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const updatedRecord = await userContext.pb.collection("users").update(userContext.userId, {
      avatar: null,
    });

    return createUserMutationResponse(userContext.pb, updatedRecord);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        return jsonError("INVALID_AVATAR_FILE", 400);
      }

      if (error.status === 401 || error.status === 403) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    console.error("Remove account avatar API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

async function createUserMutationResponse(
  pb: AuthenticatedUserApiContext["pb"],
  updatedRecord: unknown
) {
  let profile = getAccountProfileSnapshot(updatedRecord);
  const hasRefreshedSession = await refreshAuthenticatedUserApiSession(pb);

  if (hasRefreshedSession && pb.authStore.record) {
    profile = getAccountProfileSnapshot(pb.authStore.record);
  }

  const response = jsonOk({ profile }, 200);

  if (hasRefreshedSession) {
    setAuthenticatedUserApiCookie(response, pb);
  }

  return response;
}

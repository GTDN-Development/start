import type { AuthResponse } from "@/features/auth/auth-contract";
import type { AccountProfilePayload } from "@/features/account/account-profile";

const ACCOUNT_PROFILE_ENDPOINT_PATH = "/api/account/profile";
const ACCOUNT_AVATAR_ENDPOINT_PATH = "/api/account/avatar";
const ACCOUNT_EMAIL_CHANGE_REQUEST_ENDPOINT_PATH = "/api/account/email-change/request";
const ACCOUNT_DELETE_ENDPOINT_PATH = "/api/account/delete";
const ACCOUNT_PASSWORD_ENDPOINT_PATH = "/api/account/password";

type AccountRequestEmailChangePayload = {
  sent: true;
};

type DeleteAccountPayload = {
  deleted: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

type UpdateAccountProfileInput = {
  name: string;
};

type RequestAccountEmailChangeInput = {
  newEmail: string;
};

type DeleteAccountInput = {
  password: string;
};

type UpdateAccountPasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function updateAccountProfile(
  input: UpdateAccountProfileInput
): Promise<AuthResponse<AccountProfilePayload>> {
  return requestAccountEndpoint<AccountProfilePayload>(ACCOUNT_PROFILE_ENDPOINT_PATH, {
    method: "PATCH",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function uploadAccountAvatar(
  file: File
): Promise<AuthResponse<AccountProfilePayload>> {
  const formData = new FormData();
  formData.set("avatar", file);

  return requestAccountEndpoint<AccountProfilePayload>(ACCOUNT_AVATAR_ENDPOINT_PATH, {
    method: "POST",
    body: formData,
  });
}

export async function removeAccountAvatar(): Promise<AuthResponse<AccountProfilePayload>> {
  return requestAccountEndpoint<AccountProfilePayload>(ACCOUNT_AVATAR_ENDPOINT_PATH, {
    method: "DELETE",
  });
}

export async function requestAccountEmailChange(
  input: RequestAccountEmailChangeInput
): Promise<AuthResponse<AccountRequestEmailChangePayload>> {
  return requestAccountEndpoint<AccountRequestEmailChangePayload>(
    ACCOUNT_EMAIL_CHANGE_REQUEST_ENDPOINT_PATH,
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        "content-type": "application/json",
      },
    }
  );
}

export async function deleteAccount(
  input: DeleteAccountInput
): Promise<AuthResponse<DeleteAccountPayload>> {
  return requestAccountEndpoint<DeleteAccountPayload>(ACCOUNT_DELETE_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function updateAccountPassword(
  input: UpdateAccountPasswordInput
): Promise<AuthResponse<UpdateAccountPasswordPayload>> {
  return requestAccountEndpoint<UpdateAccountPasswordPayload>(ACCOUNT_PASSWORD_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });
}

async function requestAccountEndpoint<TData>(
  path: string,
  init: RequestInit
): Promise<AuthResponse<TData>> {
  try {
    const response = await fetch(path, {
      ...init,
      cache: init.cache ?? "no-store",
    });

    const rawPayload = await parseJsonResponse(response);

    if (isAuthResponse<TData>(rawPayload)) {
      return rawPayload;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[account-client]", path, error);
    }

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  return {
    ok: false,
    errorCode: "UNKNOWN_ERROR",
  };
}

function isAuthResponse<TData>(value: unknown): value is AuthResponse<TData> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (payload.ok === true) {
    return "data" in payload;
  }

  if (payload.ok === false) {
    return typeof payload.errorCode === "string";
  }

  return false;
}

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

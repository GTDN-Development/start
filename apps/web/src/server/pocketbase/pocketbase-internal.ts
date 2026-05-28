import type { SendOptions } from "pocketbase";

const INTERNAL_TOKEN_HEADER = "X-Start-Internal-Token";

export function withInternalPocketBaseHeaders(options: SendOptions): SendOptions {
  return {
    ...options,
    headers: {
      ...options.headers,
      [INTERNAL_TOKEN_HEADER]: getRequiredInternalApiSecret(),
    },
  };
}

function getRequiredInternalApiSecret(): string {
  const value = process.env.START_INTERNAL_API_SECRET?.trim();

  if (!value) {
    throw new Error("START_INTERNAL_API_SECRET is required for internal PocketBase requests.");
  }

  return value;
}

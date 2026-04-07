import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";

type FieldError = {
  code?: string;
};

type ServiceErrorPayload = {
  type: string;
  status?: number;
  url?: string;
  message: string;
};

export function getAvatarUrl(pb: PocketBase, record: UsersRecord): string | null {
  const avatar = getNullableTrimmedString(record.avatar);

  if (!avatar) {
    return null;
  }

  return pb.files.getURL(record, avatar);
}

export function getNullableTrimmedString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue;
}

export function isUsersRecord(value: unknown): value is UsersRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<UsersRecord>;

  return typeof record.id === "string" && typeof record.email === "string";
}

export function hasValidationCode(data: unknown, field: string, expectedCode: string): boolean {
  const fieldError = getFieldError(data, field);

  return fieldError?.code === expectedCode;
}

export function getFieldError(data: unknown, field: string): FieldError | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const dataRecord = data as Record<string, unknown>;
  const fieldValue = dataRecord[field];

  if (!fieldValue || typeof fieldValue !== "object") {
    return null;
  }

  return fieldValue as FieldError;
}

export function formatServiceError(error: unknown): ServiceErrorPayload {
  if (error instanceof ClientResponseError) {
    return {
      type: "ClientResponseError",
      status: error.status,
      url: error.url,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }

  return {
    type: "UnknownError",
    message: "Non-error value thrown",
  };
}

export function logServiceError(label: string, context: string, error: unknown): void {
  console.error(`[${label}] ${context}`, formatServiceError(error));
}

export function mapPocketBaseError<TErrorCode extends string>(
  error: unknown,
  operationMapper: (error: ClientResponseError) => TErrorCode | null,
  unknownErrorCode: TErrorCode
): TErrorCode | "RATE_LIMITED" {
  if (error instanceof ClientResponseError) {
    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    const operationErrorCode = operationMapper(error);

    if (operationErrorCode) {
      return operationErrorCode;
    }
  }

  return unknownErrorCode;
}

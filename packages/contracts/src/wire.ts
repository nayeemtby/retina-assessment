export interface WireError {
  code: string;
  message: string;
  details?: unknown;
}

export interface WireSuccessPayload<T> {
  success: true;
  value: T;
  data: any;
  items?: any;
  pagination?: any;
  message?: string;
  error?: never;
}

export interface WireErrorPayload<E = WireError> {
  success: false;
  error: E;
  message: string;
  errors?: unknown;
  value?: never;
  data?: never;
}

export type WireResult<T, E = WireError> = WireSuccessPayload<T> | WireErrorPayload<E>;

export function wireSuccess<T>(value: T, message?: string): WireResult<T, never> {
  const isListPayload =
    value &&
    typeof value === "object" &&
    "items" in value &&
    "pagination" in value;

  const hasPagination =
    value &&
    typeof value === "object" &&
    "pagination" in value;

  return {
    success: true,
    value,
    data: isListPayload ? (value as any).items : value,
    ...(isListPayload ? { items: (value as any).items } : {}),
    ...(hasPagination ? { pagination: (value as any).pagination } : {}),
    ...(message ? { message } : {}),
  };
}

export function wireError<E extends WireError = WireError>(error: E): WireResult<never, E> {
  return {
    success: false,
    error,
    message: error.message,
    errors: error.details ?? [{ field: "request", message: error.message }],
  };
}

export const FailureCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type FailureCode = (typeof FailureCodes)[keyof typeof FailureCodes];

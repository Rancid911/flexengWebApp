import { NextResponse } from "next/server";

export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  exposeDetails: boolean;

  constructor(status: number, code: string, message: string, details?: unknown, options?: { exposeDetails?: boolean }) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.exposeDetails = options?.exposeDetails ?? status < 500;
  }
}

function isHttpLikeError(error: unknown): error is { status: number; code: string; message: string; details?: unknown; exposeDetails?: boolean } {
  return typeof error === "object" && error !== null && "status" in error && "code" in error && "message" in error;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError || isHttpLikeError(error)) {
    const payload: ApiErrorShape = {
      code: error.code,
      message: error.message
    };
    if ((error.exposeDetails ?? error.status < 500) && error.details !== undefined) {
      payload.details = error.details;
    }
    return NextResponse.json(payload, { status: error.status });
  }

  const payload: ApiErrorShape = {
    code: "INTERNAL_ERROR",
    message: "Internal server error"
  };
  return NextResponse.json(payload, { status: 500 });
}

export function withApiErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<NextResponse>) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function validationError(message: string, details?: unknown) {
  return new HttpError(400, "VALIDATION_ERROR", message, details);
}

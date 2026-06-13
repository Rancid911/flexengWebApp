import { NextResponse } from "next/server";

export class PracticeHttpError extends Error {
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

export function toPracticeErrorResponse(error: unknown) {
  if (
    error instanceof PracticeHttpError ||
    (typeof error === "object" && error !== null && "status" in error && "code" in error && "message" in error)
  ) {
    const typedError = error as { status: number; code: string; message: string; details?: unknown; exposeDetails?: boolean };
    return NextResponse.json(
      {
        code: typedError.code,
        message: typedError.message,
        ...((typedError.exposeDetails ?? typedError.status < 500) && typedError.details !== undefined ? { details: typedError.details } : {})
      },
      { status: typedError.status }
    );
  }

  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    },
    { status: 500 }
  );
}

export function withPracticeErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<NextResponse>) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toPracticeErrorResponse(error);
    }
  };
}

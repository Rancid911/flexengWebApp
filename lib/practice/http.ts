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
  if (error instanceof PracticeHttpError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.exposeDetails && error.details !== undefined ? { details: error.details } : {})
      },
      { status: error.status }
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

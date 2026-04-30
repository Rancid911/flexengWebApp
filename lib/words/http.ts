import { NextResponse } from "next/server";

export class WordsHttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toWordsErrorResponse(error: unknown) {
  if (error instanceof WordsHttpError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {})
      },
      { status: error.status }
    );
  }

  return NextResponse.json({ code: "INTERNAL_ERROR", message: "Internal server error" }, { status: 500 });
}

export function withWordsErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<NextResponse>) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toWordsErrorResponse(error);
    }
  };
}

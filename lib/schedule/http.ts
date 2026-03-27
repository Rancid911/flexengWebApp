import { NextResponse } from "next/server";

import type { ApiErrorShape } from "@/lib/admin/types";

export class ScheduleHttpError extends Error {
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

export function toScheduleErrorResponse(error: unknown) {
  if (error instanceof ScheduleHttpError) {
    const payload: ApiErrorShape = {
      code: error.code,
      message: error.message
    };
    if (error.exposeDetails && error.details !== undefined) {
      payload.details = error.details;
    }
    return NextResponse.json(payload, { status: error.status });
  }

  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    } satisfies ApiErrorShape,
    { status: 500 }
  );
}

export function withScheduleErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toScheduleErrorResponse(error);
    }
  };
}

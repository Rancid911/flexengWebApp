import { NextResponse } from "next/server";

import type { ApiErrorShape, PaginatedResponse } from "@/lib/admin/types";

export class AdminHttpError extends Error {
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

export function toErrorResponse(error: unknown) {
  if (error instanceof AdminHttpError) {
    const payload: ApiErrorShape = {
      code: error.code,
      message: error.message
    };
    if (error.exposeDetails && error.details !== undefined) {
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

export function withAdminErrorHandling<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
) {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));
  const q = (url.searchParams.get("q") ?? "").trim();

  return { page, pageSize, q };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> {
  return { items, total, page, pageSize };
}

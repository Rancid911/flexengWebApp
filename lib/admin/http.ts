import type { PaginatedResponse } from "@/lib/admin/types";
import { HttpError, toErrorResponse, withApiErrorHandling } from "@/lib/server/http";
import type { NextResponse } from "next/server";

export class AdminHttpError extends HttpError {}

export { toErrorResponse };

export function withAdminErrorHandling<TArgs extends unknown[]>(handler: (...args: TArgs) => Promise<NextResponse>) {
  return withApiErrorHandling(handler);
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

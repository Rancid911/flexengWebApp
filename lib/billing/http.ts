import { ScheduleHttpError, toScheduleErrorResponse, withScheduleErrorHandling } from "@/lib/schedule/http";

export class BillingHttpError extends ScheduleHttpError {}

export const toBillingErrorResponse = toScheduleErrorResponse;
export const withBillingErrorHandling = withScheduleErrorHandling;

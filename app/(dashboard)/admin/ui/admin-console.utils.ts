import { mapUiErrorByCode, mapUiErrorMessage } from "@/lib/ui-error-map";

export type ApiValidationDetails = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  details?: ApiValidationDetails;

  constructor(params: { message: string; status: number; code?: string; details?: ApiValidationDetails }) {
    super(params.message);
    this.name = "ApiRequestError";
    this.status = params.status;
    this.code = params.code;
    this.details = params.details;
  }
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | {
          code?: string;
          message?: string;
          details?: {
            fieldErrors?: Record<string, string[]>;
            formErrors?: string[];
          };
        }
      | null;

    const firstFieldError = payload?.details?.fieldErrors
      ? Object.values(payload.details.fieldErrors).find((messages) => Array.isArray(messages) && messages.length > 0)?.[0]
      : undefined;
    const firstFormError = payload?.details?.formErrors?.[0];
    const message =
      mapUiErrorMessage(firstFieldError) ||
      mapUiErrorMessage(firstFormError) ||
      mapUiErrorMessage(payload?.message) ||
      mapUiErrorByCode(payload?.code) ||
      `Не удалось выполнить запрос (код ${response.status}).`;
    throw new ApiRequestError({
      message,
      status: response.status,
      code: payload?.code,
      details: payload?.details
    });
  }

  return (await response.json()) as T;
}

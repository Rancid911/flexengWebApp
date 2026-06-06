export class AuthApiError extends Error {
  status: number;
  code: string | null;
  details?: AuthApiErrorPayload["details"];
  flow?: string;
  retryAfter?: number;

  constructor(message: string, status: number, code: string | null = null, details?: AuthApiErrorPayload["details"], retryAfter?: number, flow?: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
    this.flow = flow;
  }
}

type AuthApiErrorPayload = {
  code?: unknown;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
  error?: unknown;
  flow?: unknown;
  message?: unknown;
  retryAfter?: unknown;
};

async function readAuthApiPayload(response: Response) {
  try {
    return (await response.json()) as AuthApiErrorPayload;
  } catch {
    return {};
  }
}

async function postAuthJson<T>(url: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const payload = await readAuthApiPayload(response);
  if (!response.ok) {
    const message =
      typeof payload.message === "string" && payload.message
        ? payload.message
        : typeof payload.error === "string" && payload.error
          ? payload.error
          : "Auth request failed";
    const code = typeof payload.code === "string" ? payload.code : null;
    const retryAfter = typeof payload.retryAfter === "number" ? payload.retryAfter : undefined;
    const flow = typeof payload.flow === "string" ? payload.flow : undefined;
    throw new AuthApiError(message, response.status, code, payload.details, retryAfter, flow);
  }

  return payload as T;
}

async function getAuthJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store"
  });

  const payload = await readAuthApiPayload(response);
  if (!response.ok) {
    const message =
      typeof payload.message === "string" && payload.message
        ? payload.message
        : typeof payload.error === "string" && payload.error
          ? payload.error
          : "Auth request failed";
    const code = typeof payload.code === "string" ? payload.code : null;
    const retryAfter = typeof payload.retryAfter === "number" ? payload.retryAfter : undefined;
    const flow = typeof payload.flow === "string" ? payload.flow : undefined;
    throw new AuthApiError(message, response.status, code, undefined, retryAfter, flow);
  }

  return payload as T;
}

export function loginWithPassword(input: { email: string; password: string }) {
  return postAuthJson<{ ok: true }>("/api/auth/login", input);
}

export function registerWithPassword(input: { email: string; password: string }) {
  return postAuthJson<{ ok: true; hasSession: boolean }>("/api/auth/signup", input);
}

export function requestPasswordReset(input: { email: string }) {
  return postAuthJson<{ ok: true }>("/api/auth/password/reset-request", input);
}

export function changePassword(input: { currentPassword: string; nextPassword: string }) {
  return postAuthJson<{ ok: true }>("/api/auth/password/change", input);
}

export function resetPassword(input: { nextPassword: string }) {
  return postAuthJson<{ ok: true }>("/api/auth/password/reset", input);
}

export function getCurrentAuthUser() {
  return getAuthJson<{ user: { id: string; email: string | null } }>("/api/auth/me");
}

export function logoutCurrentSession() {
  return postAuthJson<{ ok: true }>("/api/auth/logout");
}

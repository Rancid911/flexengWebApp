export class AuthApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
    this.code = code;
  }
}

type AuthApiErrorPayload = {
  code?: unknown;
  message?: unknown;
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
    const message = typeof payload.message === "string" && payload.message ? payload.message : "Auth request failed";
    const code = typeof payload.code === "string" ? payload.code : null;
    throw new AuthApiError(message, response.status, code);
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
    const message = typeof payload.message === "string" && payload.message ? payload.message : "Auth request failed";
    const code = typeof payload.code === "string" ? payload.code : null;
    throw new AuthApiError(message, response.status, code);
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

export function updatePassword(input: { password: string }) {
  return postAuthJson<{ ok: true }>("/api/auth/password/update", input);
}

export function getCurrentAuthUser() {
  return getAuthJson<{ user: { id: string; email: string | null } }>("/api/auth/me");
}

export function logoutCurrentSession() {
  return postAuthJson<{ ok: true }>("/api/auth/logout");
}

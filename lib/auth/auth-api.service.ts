import { createClient } from "@/lib/supabase/server";
import { HttpError, validationError } from "@/lib/server/http";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { isExistingAuthEmailError, normalizeEmail } from "@/lib/auth/email";

type AuthJsonPayload = Record<string, unknown>;

export type AuthUserSummary = {
  id: string;
  email: string | null;
};

async function readJsonObject(request: Request): Promise<AuthJsonPayload> {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw validationError("Invalid auth payload");
    }
    return payload as AuthJsonPayload;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw validationError("Invalid auth payload");
  }
}

function readRequiredString(payload: AuthJsonPayload, key: string, label: string) {
  const value = payload[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw validationError(`${label} is required`);
  }
  return value;
}

function toAuthHttpError(error: { message?: string } | null | undefined, fallback: string) {
  return new HttpError(400, "AUTH_ERROR", error?.message || fallback);
}

function buildResetRedirectUrl(request: Request) {
  const origin = new URL(request.url).origin;
  return `${origin}/auth/confirm?next=/reset-password%3Fflow%3Drecovery`;
}

export async function signInWithPasswordFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const email = normalizeEmail(readRequiredString(payload, "email", "Email"));
  const password = readRequiredString(payload, "password", "Password");
  const supabase = await createClient();

  const { error } = await runAuthRequestWithLockRetry(() =>
    supabase.auth.signInWithPassword({
      email,
      password
    })
  );

  if (error) {
    throw toAuthHttpError(error, "Login failed");
  }
}

export async function signUpWithPasswordFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const email = normalizeEmail(readRequiredString(payload, "email", "Email"));
  const password = readRequiredString(payload, "password", "Password");
  const supabase = await createClient();

  const { data, error } = await runAuthRequestWithLockRetry(() =>
    supabase.auth.signUp({
      email,
      password
    })
  );

  if (error) {
    if (isExistingAuthEmailError(error.message)) {
      return { hasSession: false };
    }
    throw toAuthHttpError(error, "Registration failed");
  }

  return {
    hasSession: Boolean(data.session)
  };
}

export async function requestPasswordResetFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const email = normalizeEmail(readRequiredString(payload, "email", "Email"));
  const supabase = await createClient();

  const { error } = await runAuthRequestWithLockRetry(() =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildResetRedirectUrl(request)
    })
  );

  if (error) {
    throw toAuthHttpError(error, "Password reset request failed");
  }
}

export async function updatePasswordFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const password = readRequiredString(payload, "password", "Password");
  if (password.length < 6) {
    throw validationError("Password must be at least 6 characters");
  }

  const supabase = await createClient();
  const { error } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ password }));

  if (error) {
    throw toAuthHttpError(error, "Password update failed");
  }
}

export async function getCurrentAuthUser(): Promise<AuthUserSummary | null> {
  const supabase = await createClient();
  const { data, error } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null
  };
}

export async function signOutCurrentSession() {
  const supabase = await createClient();
  const { error } = await runAuthRequestWithLockRetry(() => supabase.auth.signOut({ scope: "local" }), {
    timeoutMs: 6000,
    retries: 1
  });

  if (error) {
    throw toAuthHttpError(error, "Logout failed");
  }
}

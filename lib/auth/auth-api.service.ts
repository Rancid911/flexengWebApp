import { createClient } from "@/lib/supabase/server";
import { HttpError, validationError } from "@/lib/server/http";
import { runAuthRequestWithLockRetry } from "@/lib/supabase/auth-request";
import { isExistingAuthEmailError, normalizeEmail } from "@/lib/auth/email";
import { clearRecoveryMarker, verifyRecoveryMarker } from "@/lib/auth/recovery-marker";
import { getPasswordPolicyErrors } from "@/lib/auth/password-policy";

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

function toPasswordFieldError(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message || fallback;
  const normalized = message.toLowerCase();

  if (normalized.includes("nonce") || normalized.includes("reauth") || normalized.includes("recent") || normalized.includes("session")) {
    return new HttpError(401, "REAUTHENTICATION_REQUIRED", "Сессия устарела. Войдите заново и повторите попытку.");
  }
  if (normalized.includes("current") || normalized.includes("old password") || normalized.includes("invalid password")) {
    return new HttpError(400, "AUTH_PASSWORD_ERROR", "Password change failed", {
      fieldErrors: {
        currentPassword: ["Текущий пароль указан неверно."]
      }
    });
  }
  if (normalized.includes("weak") || normalized.includes("password")) {
    return new HttpError(400, "AUTH_PASSWORD_ERROR", "Password change failed", {
      fieldErrors: {
        nextPassword: ["Проверьте требования к новому паролю."]
      }
    });
  }
  return new HttpError(400, "AUTH_PASSWORD_ERROR", message);
}

function toRecoveryPasswordFieldError(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message || fallback;
  const normalized = message.toLowerCase();

  if (normalized.includes("nonce") || normalized.includes("reauth") || normalized.includes("recent") || normalized.includes("session")) {
    return new HttpError(401, "REAUTHENTICATION_REQUIRED", "Сессия устарела. Войдите заново и повторите попытку.");
  }
  if (normalized.includes("weak") || normalized.includes("password")) {
    return new HttpError(400, "AUTH_PASSWORD_ERROR", "Password reset failed", {
      fieldErrors: {
        nextPassword: ["Проверьте требования к новому паролю."]
      }
    });
  }
  return new HttpError(400, "AUTH_PASSWORD_ERROR", message);
}

function passwordFieldRequiredError(fieldName: "currentPassword" | "nextPassword", message: string): never {
  throw validationError(message, {
    fieldErrors: {
      [fieldName]: [message]
    }
  });
}

function validateNextPasswordOrThrow(password: string, fieldName = "nextPassword") {
  const errors = getPasswordPolicyErrors(password);
  if (errors.length > 0) {
    throw validationError("Password does not meet policy requirements", {
      fieldErrors: {
        [fieldName]: errors
      }
    });
  }
}

function buildResetRedirectUrl(request: Request) {
  const origin = new URL(request.url).origin;
  return `${origin}/auth/confirm?next=/reset-password`;
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
  validateNextPasswordOrThrow(password, "password");
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

export async function changePasswordFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const currentPasswordValue = payload.currentPassword;
  const nextPasswordValue = payload.nextPassword;
  if (typeof currentPasswordValue !== "string" || currentPasswordValue.trim().length === 0) {
    passwordFieldRequiredError("currentPassword", "Введите текущий пароль");
  }
  if (typeof nextPasswordValue !== "string" || nextPasswordValue.trim().length === 0) {
    passwordFieldRequiredError("nextPassword", "Введите новый пароль");
  }
  const currentPassword = currentPasswordValue;
  const nextPassword = nextPasswordValue;
  validateNextPasswordOrThrow(nextPassword);

  const supabase = await createClient();
  const { data: userData, error: userError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
  if (userError || !userData.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { error } = await runAuthRequestWithLockRetry(() =>
    supabase.auth.updateUser({
      password: nextPassword,
      current_password: currentPassword
    })
  );

  if (error) {
    throw toPasswordFieldError(error, "Password change failed");
  }
}

export async function resetPasswordFromRequest(request: Request) {
  const payload = await readJsonObject(request);
  const nextPassword = readRequiredString(payload, "nextPassword", "New password");
  validateNextPasswordOrThrow(nextPassword);

  const supabase = await createClient();
  const { data: userData, error: userError } = await runAuthRequestWithLockRetry(() => supabase.auth.getUser());
  if (userError || !userData.user) {
    throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
  }

  const hasRecoveryMarker = await verifyRecoveryMarker(userData.user.id);
  if (!hasRecoveryMarker) {
    throw new HttpError(
      403,
      "RECOVERY_CONTEXT_REQUIRED",
      "Ссылка для восстановления пароля истекла или недействительна. Запросите новое письмо для восстановления пароля."
    );
  }

  const { error } = await runAuthRequestWithLockRetry(() => supabase.auth.updateUser({ password: nextPassword }));

  if (error) {
    throw toRecoveryPasswordFieldError(error, "Password reset failed");
  }

  await clearRecoveryMarker();
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

export type AuthRateLimitMessageFlow = "login" | "signup" | "forgot-password" | "reset-password" | "change-password";

const RATE_LIMIT_MESSAGE_PREFIX: Record<AuthRateLimitMessageFlow, string> = {
  login: "Слишком много попыток входа.",
  signup: "Слишком много попыток регистрации.",
  "forgot-password": "Слишком много запросов на сброс пароля.",
  "reset-password": "Слишком много попыток обновления пароля.",
  "change-password": "Слишком много попыток смены пароля."
};

export function isAuthRateLimitMessageFlow(flow: unknown): flow is AuthRateLimitMessageFlow {
  return typeof flow === "string" && flow in RATE_LIMIT_MESSAGE_PREFIX;
}

export function formatRateLimitDuration(retryAfterSeconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(retryAfterSeconds));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")} мин ${String(seconds).padStart(2, "0")} сек`;
}

export function formatAuthRateLimitMessage(flow: AuthRateLimitMessageFlow, retryAfterSeconds: number) {
  return `${RATE_LIMIT_MESSAGE_PREFIX[flow]} Попробуйте снова через ${formatRateLimitDuration(retryAfterSeconds)}.`;
}

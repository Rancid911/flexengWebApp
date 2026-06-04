export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isExistingAuthEmailError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email_exists") ||
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("user with this email")
  );
}

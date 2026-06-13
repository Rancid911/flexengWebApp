export const PASSWORD_MIN_LENGTH = 8;

export type PasswordPolicyRuleId = "minLength" | "lowercase" | "uppercase" | "digit" | "symbol";

export type PasswordPolicyRule = {
  id: PasswordPolicyRuleId;
  label: string;
  message: string;
  valid: boolean;
};

export const PASSWORD_SYMBOL_PATTERN = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/;

const PASSWORD_POLICY_MESSAGES: Record<PasswordPolicyRuleId, string> = {
  minLength: `Пароль должен содержать минимум ${PASSWORD_MIN_LENGTH} символов.`,
  lowercase: "Добавьте хотя бы одну строчную букву.",
  uppercase: "Добавьте хотя бы одну заглавную букву.",
  digit: "Добавьте хотя бы одну цифру.",
  symbol: "Добавьте хотя бы один специальный символ."
};

const PASSWORD_POLICY_LABELS: Record<PasswordPolicyRuleId, string> = {
  minLength: `Минимум ${PASSWORD_MIN_LENGTH} символов`,
  lowercase: "Строчная буква",
  uppercase: "Заглавная буква",
  digit: "Цифра",
  symbol: "Специальный символ"
};

export function getPasswordPolicyChecklist(password: string): PasswordPolicyRule[] {
  return [
    {
      id: "minLength",
      label: PASSWORD_POLICY_LABELS.minLength,
      message: PASSWORD_POLICY_MESSAGES.minLength,
      valid: password.length >= PASSWORD_MIN_LENGTH
    },
    {
      id: "lowercase",
      label: PASSWORD_POLICY_LABELS.lowercase,
      message: PASSWORD_POLICY_MESSAGES.lowercase,
      valid: /[a-z]/.test(password)
    },
    {
      id: "uppercase",
      label: PASSWORD_POLICY_LABELS.uppercase,
      message: PASSWORD_POLICY_MESSAGES.uppercase,
      valid: /[A-Z]/.test(password)
    },
    {
      id: "digit",
      label: PASSWORD_POLICY_LABELS.digit,
      message: PASSWORD_POLICY_MESSAGES.digit,
      valid: /\d/.test(password)
    },
    {
      id: "symbol",
      label: PASSWORD_POLICY_LABELS.symbol,
      message: PASSWORD_POLICY_MESSAGES.symbol,
      valid: PASSWORD_SYMBOL_PATTERN.test(password)
    }
  ];
}

export function getPasswordPolicyErrors(password: string) {
  return getPasswordPolicyChecklist(password)
    .filter((rule) => !rule.valid)
    .map((rule) => rule.message);
}

export function validatePasswordPolicy(password: string) {
  return getPasswordPolicyErrors(password).length === 0;
}

export function getPasswordPolicyError(password: string) {
  return getPasswordPolicyErrors(password)[0] ?? "";
}

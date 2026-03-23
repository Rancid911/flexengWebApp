export const RU_PHONE_REGEX = /^\+7\d{10}$/;

function extractRuPhoneDigits(rawValue: string): string {
  let digits = (rawValue ?? "").replace(/\D/g, "");
  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  }
  if (digits.startsWith("7")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

export function getRuPhoneDigitsCount(value: string): number {
  return extractRuPhoneDigits(value).length;
}

function formatRuPhoneDigits(digitsRaw: string): string {
  const digits = digitsRaw.slice(0, 10);
  if (!digits) return "+7 ";

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 8);
  const p4 = digits.slice(8, 10);

  let result = "+7";
  if (p1) {
    result += ` (${p1}`;
    if (p1.length === 3) result += ")";
  }
  if (p2) result += ` ${p2}`;
  if (p3) result += ` ${p3}`;
  if (p4) result += ` ${p4}`;

  return result;
}

export function toRuPhoneStorage(value: string): string | null {
  const digits = extractRuPhoneDigits(value);
  if (digits.length !== 10) return null;
  return `+7${digits}`;
}

export function isValidRuPhone(value: string): boolean {
  const canonical = toRuPhoneStorage(value);
  return canonical != null && RU_PHONE_REGEX.test(canonical);
}

export function normalizeRuPhoneInput(rawValue: string): string {
  return formatRuPhoneDigits(extractRuPhoneDigits(rawValue));
}

export function canRestartRuPhoneFromKey(value: string, key: string): boolean {
  return /^\d$/.test(key) && getRuPhoneDigitsCount(value) >= 10;
}

export function backspaceRuPhone(value: string): string {
  const digits = extractRuPhoneDigits(value);
  if (!digits.length) return "+7 ";
  return formatRuPhoneDigits(digits.slice(0, -1));
}

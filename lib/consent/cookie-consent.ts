export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_STORAGE_KEY = "flexeng:cookie-consent:v1";

export type CookieConsentCategory = "analytics" | "marketing" | "functional";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  version: number;
  updatedAt: number;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function isValidConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.necessary === true &&
    typeof candidate.analytics === "boolean" &&
    typeof candidate.marketing === "boolean" &&
    typeof candidate.functional === "boolean" &&
    typeof candidate.version === "number" &&
    typeof candidate.updatedAt === "number"
  );
}

export function readCookieConsent(): CookieConsent | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidConsent(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCookieConsent(
  patch: Pick<CookieConsent, "analytics" | "marketing" | "functional">
): CookieConsent | null {
  if (!isBrowser()) return null;

  const payload: CookieConsent = {
    necessary: true,
    analytics: patch.analytics,
    marketing: patch.marketing,
    functional: patch.functional,
    version: COOKIE_CONSENT_VERSION,
    updatedAt: Date.now()
  };

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function hasCookieConsent(): boolean {
  const consent = readCookieConsent();
  return !!consent && consent.version === COOKIE_CONSENT_VERSION;
}

export function isConsentAllowed(category: CookieConsentCategory): boolean {
  const consent = readCookieConsent();
  if (!consent || consent.version !== COOKIE_CONSENT_VERSION) return false;
  return consent[category];
}

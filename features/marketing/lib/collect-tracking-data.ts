export type MarketingTrackingData = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer: string | null;
  landing_path: string;
  full_url: string;
};

export function collectTrackingData(): MarketingTrackingData | Record<string, never> {
  if (typeof window === "undefined") return {};

  const url = new URL(window.location.href);

  return {
    utm_source: url.searchParams.get("utm_source"),
    utm_medium: url.searchParams.get("utm_medium"),
    utm_campaign: url.searchParams.get("utm_campaign"),
    utm_content: url.searchParams.get("utm_content"),
    utm_term: url.searchParams.get("utm_term"),
    referrer: document.referrer || null,
    landing_path: url.pathname,
    full_url: url.href
  };
}

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 10 * 60 * 1000;

type CachedEnvelope<T> = {
  version: number;
  cachedAt: number;
  data: T;
};

export type ProfileCacheData = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role?: string | null;
};

export type HomeModuleCacheData = {
  id: string;
  title: string;
  description: string;
  courseTitle: string;
};

export type HomeCacheData = {
  modulesData: HomeModuleCacheData[];
  progressValue: number;
  progressText: string;
  lastResultText: string;
  quickStats: {
    tests: string;
    streak: string;
    learningTime: string;
  };
};

export function profileCacheKey(userId: string) {
  return `dashboard:profile:${userId}`;
}

export function homeCacheKey(userId: string) {
  return `dashboard:home:${userId}`;
}

export function readDashboardCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedEnvelope<T>;
    if (!parsed || parsed.version !== CACHE_VERSION) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
}

export function writeDashboardCache<T>(key: string, data: T) {
  if (typeof window === "undefined") return;

  const payload: CachedEnvelope<T> = {
    version: CACHE_VERSION,
    cachedAt: Date.now(),
    data
  };
  window.localStorage.setItem(key, JSON.stringify(payload));
}

export function clearDashboardCache(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

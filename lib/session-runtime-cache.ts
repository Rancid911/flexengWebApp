type RuntimeCacheEntry = {
  cachedAt: number;
  value: unknown;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const runtimeCache = new Map<string, RuntimeCacheEntry>();

export function readRuntimeCache<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | null {
  const entry = runtimeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > ttlMs) {
    runtimeCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function writeRuntimeCache<T>(key: string, value: T): void {
  runtimeCache.set(key, {
    cachedAt: Date.now(),
    value
  });
}

export function clearRuntimeCache(key?: string): void {
  if (key) {
    runtimeCache.delete(key);
    return;
  }
  runtimeCache.clear();
}


export async function measureServerTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
  const startedAt = performance.now();

  try {
    return await action();
  } finally {
    if (process.env.NODE_ENV !== "production") {
      const durationMs = Math.round((performance.now() - startedAt) * 100) / 100;
      console.info(`[server-timing] ${label}: ${durationMs}ms`);
    }
  }
}

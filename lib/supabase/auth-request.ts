const AUTH_REQUEST_TIMEOUT_MS = 20000;
const RETRY_DELAY_BASE_MS = 180;
const RETRY_ATTEMPTS = 4;

export class AuthRequestTimeoutError extends Error {
  constructor() {
    super("AUTH_REQUEST_TIMEOUT");
    this.name = "AuthRequestTimeoutError";
  }
}

export async function runAuthRequestWithTimeout<T>(
  task: Promise<T>,
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new AuthRequestTimeoutError());
    }, timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

function isTransientAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const normalized = error.message.toLowerCase();
  return (
    normalized.includes("lock was stolen") ||
    normalized.includes("load failed") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("network request failed")
  );
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function runAuthRequestWithLockRetry<T>(
  taskFactory: () => Promise<T>,
  options?: {
    timeoutMs?: number;
    retries?: number;
  }
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? AUTH_REQUEST_TIMEOUT_MS;
  const retries = options?.retries ?? RETRY_ATTEMPTS;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await runAuthRequestWithTimeout(taskFactory(), timeoutMs);
    } catch (error) {
      lastError = error;
      if (!isTransientAuthError(error) || attempt >= retries) {
        throw error;
      }
      const backoffMs = RETRY_DELAY_BASE_MS * (attempt + 1);
      await delay(backoffMs);
    }
  }

  throw lastError;
}

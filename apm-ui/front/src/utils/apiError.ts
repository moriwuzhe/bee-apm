export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export function createApiError(message: string, status?: number, code?: string): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  return error;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    return error as ApiError;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, any>;
    const message = err.message || err.error || String(error);
    return createApiError(message, err.status, err.code);
  }
  return createApiError(String(error));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  shouldRetry: (error: ApiError) => boolean = (err) =>
    err.status === 429 || err.status === 502 || err.status === 503 || err.status === 504
): Promise<T> {
  let attempts = 0;
  while (attempts < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempts++;
      if (attempts >= maxRetries) {
        throw handleApiError(error);
      }
      const apiError = handleApiError(error);
      if (!shouldRetry(apiError)) {
        throw apiError;
      }
      const delay = delayMs * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw createApiError('Maximum retries exceeded');
}

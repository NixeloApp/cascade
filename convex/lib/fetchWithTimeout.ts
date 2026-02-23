export class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

/**
 * Fetches a resource with a timeout.
 * @param input - The URL or Request object.
 * @param init - The fetch options.
 * @param timeoutMs - The timeout in milliseconds (default: 10000).
 * @returns A Promise that resolves to the Response object.
 * @throws {FetchTimeoutError} If the request times out.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const { signal, ...fetchInit } = init || {};

  // If a signal is provided, listen to its abort event
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort());
    }
  }

  try {
    const response = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Check if the timeout caused the abort (controller signal is aborted)
      // but the user's signal (if any) was not.
      // Or simply assume if it's an AbortError and we set a timeout, it might be the timeout.
      // To be precise:
      if (signal?.aborted) {
        // User aborted, rethrow original error or new AbortError
        throw error;
      }
      throw new FetchTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

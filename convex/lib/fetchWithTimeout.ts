export class FetchTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

export class HttpError extends Error {
  status: number;
  body: string;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 500)}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

function setupSignal(controller: AbortController, init?: RequestInit): () => void {
  const { signal } = init || {};
  if (signal) {
    if (signal.aborted) {
      controller.abort();
      return () => {};
    }
    const onAbort = () => controller.abort();
    signal.addEventListener("abort", onAbort);
    return () => signal.removeEventListener("abort", onAbort);
  }
  return () => {};
}

function handleFetchError(
  error: unknown,
  signal: AbortSignal | undefined | null,
  timeoutMs: number,
) {
  if (error instanceof Error && error.name === "AbortError") {
    if (signal?.aborted) {
      throw error;
    }
    throw new FetchTimeoutError(timeoutMs);
  }
  throw error;
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

  const cleanupSignal = setupSignal(controller, init);

  const { signal: _, ...fetchInit } = init || {};

  try {
    const response = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    handleFetchError(error, init?.signal, timeoutMs);
    throw error; // handleFetchError always throws
  } finally {
    clearTimeout(timeoutId);
    cleanupSignal();
  }
}

/**
 * Fetches a resource and parses it as JSON, with a timeout that covers the entire operation.
 * Automatically throws if the response is not OK (status 200-299).
 */
export async function fetchJSON<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanupSignal = setupSignal(controller, init);
  const { signal: _, ...fetchInit } = init || {};

  try {
    const response = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        // Ignore error reading body
      }
      throw new HttpError(response.status, errorText);
    }

    return (await response.json()) as T;
  } catch (error) {
    handleFetchError(error, init?.signal, timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    cleanupSignal();
  }
}

/**
 * Fetches a resource and returns it as text, with a timeout that covers the entire operation.
 * Automatically throws if the response is not OK.
 */
export async function fetchText(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanupSignal = setupSignal(controller, init);
  const { signal: _, ...fetchInit } = init || {};

  try {
    const response = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        // Ignore
      }
      throw new HttpError(response.status, errorText);
    }

    return await response.text();
  } catch (error) {
    handleFetchError(error, init?.signal, timeoutMs);
    throw error;
  } finally {
    clearTimeout(timeoutId);
    cleanupSignal();
  }
}

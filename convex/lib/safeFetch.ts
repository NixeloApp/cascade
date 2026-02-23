import { fetchWithTimeout } from "./fetchWithTimeout";
import { validateDestinationResolved } from "./ssrf";

/**
 * A security-hardened wrapper around `fetch` that enforces Server-Side Request Forgery (SSRF) protection.
 *
 * This function validates the destination URL to ensure it resolves to a public IP address, preventing
 * access to internal network resources (private IPs, localhost, etc.).
 *
 * Features:
 * - **SSRF Protection:** Resolves the hostname and validates the IP against private/reserved ranges.
 * - **DNS Rebinding Protection:** For HTTP requests, it rewrites the URL to the resolved IP address
 *   and sets the `Host` header to the original hostname. This prevents Time-of-Check Time-of-Use (TOCTOU) attacks.
 * - **Redirect Policy:** Enforces `redirect: "error"` to prevent redirects to internal IPs.
 *
 * @param input - The URL or Request object to fetch.
 *   **WARNING:** If a `Request` object is passed, only its `url` property is used.
 *   The `method`, `body`, and other request properties are **IGNORED** and must be provided in `init`.
 * @param init - The fetch options (method, headers, body, etc.).
 * @param timeoutMs - The timeout in milliseconds (default: 10000).
 * @returns A Promise that resolves to the Response object.
 * @throws {ConvexError} If the URL is invalid or resolves to a private/forbidden IP address.
 * @throws {FetchTimeoutError} If the request times out.
 *
 * @example
 * // ✅ GOOD: Simple GET request
 * const response = await safeFetch("https://api.public-service.com/data");
 *
 * @example
 * // ✅ GOOD: POST request with body
 * const response = await safeFetch("https://api.public-service.com/submit", {
 *   method: "POST",
 *   body: JSON.stringify({ data: "value" }),
 *   headers: { "Content-Type": "application/json" },
 * });
 *
 * @example
 * // ❌ BAD: Passing Request object properties relying on extraction
 * const req = new Request("https://...", { method: "POST", body: "..." });
 * // Result: Sends a GET request with no body!
 * await safeFetch(req);
 *
 * // ✅ CORRECT: Pass properties explicitly
 * await safeFetch(req.url, {
 *   method: req.method,
 *   body: req.body,
 *   headers: req.headers
 * });
 */
export async function safeFetch(
  input: string | URL | Request,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  let urlStr: string;
  let options: RequestInit = init || {};

  if (input instanceof Request) {
    urlStr = input.url;
    // Extract properties from Request object
    // We create a new headers object by merging request headers and init headers
    const headers = new Headers(input.headers);
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    options = {
      method: input.method,
      body: input.body,
      referrer: input.referrer,
      referrerPolicy: input.referrerPolicy,
      mode: input.mode,
      credentials: input.credentials,
      cache: input.cache,
      integrity: input.integrity,
      keepalive: input.keepalive,
      signal: input.signal,
      ...init,
      headers, // Use merged headers
    };
  } else {
    urlStr = input.toString();
  }

  // Normalize headers to a Headers object to handle Record, string[][], or Headers input
  // (already a Headers instance when input is a Request)
  const headers =
    options.headers instanceof Headers ? options.headers : new Headers(options.headers);

  // 1. Validate destination URL (SSRF protection) and get safe IP
  const resolvedIp = await validateDestinationResolved(urlStr);

  const parsedUrl = new URL(urlStr);
  let targetUrl = urlStr;

  // For HTTP, rewrite URL to use resolved IP to prevent DNS rebinding
  if (parsedUrl.protocol === "http:") {
    headers.set("Host", parsedUrl.host); // includes port if present
    parsedUrl.hostname = resolvedIp;
    targetUrl = parsedUrl.toString();
  }

  // Merge headers back into options
  const newOptions: RequestInit = {
    ...options,
    headers,
    redirect: "error", // Prevent redirects to internal IPs
  };

  return fetchWithTimeout(targetUrl, newOptions, timeoutMs);
}

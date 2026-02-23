import { fetchWithTimeout } from "./fetchWithTimeout";
import { validateDestinationResolved } from "./ssrf";

/**
 * A wrapper around fetch that enforces SSRF protection by resolving the destination URL
 * and ensuring it resolves to a public IP address.
 *
 * It also handles DNS rebinding protection for HTTP by rewriting the URL to the resolved IP
 * and setting the Host header.
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

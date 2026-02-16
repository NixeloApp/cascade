import { validateDestinationResolved } from "./ssrf";

/**
 * Performs a fetch request that validates the destination URL and resolves the IP address
 * to prevent SSRF attacks.
 *
 * @param url The destination URL.
 * @param init Fetch options (headers, body, etc.).
 * @returns The response from the fetch request.
 */
export async function safeFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  // 1. Validate destination URL (SSRF protection) and get safe IP
  const resolvedIp = await validateDestinationResolved(url);

  // Determine target URL and headers
  let targetUrl = url;
  const parsedUrl = new URL(url);

  // Clone headers or create new Headers object
  const headers = new Headers(init?.headers);

  // For HTTP, rewrite URL to use resolved IP to prevent DNS rebinding
  if (parsedUrl.protocol === "http:") {
    headers.set("Host", parsedUrl.host); // includes port if present
    parsedUrl.hostname = resolvedIp;
    targetUrl = parsedUrl.toString();
  }
  // For HTTPS, we must use original URL for certificate validation
  // NOTE: This means HTTPS is still subject to DNS rebinding between our check
  // and the fetch call. The risk is partially mitigated because the attacker's
  // server must present a valid TLS certificate for the original hostname.

  return fetch(targetUrl, {
    ...init,
    headers,
    redirect: "error", // Prevent following redirects
  });
}

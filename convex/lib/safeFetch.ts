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
): Promise<Response> {
  const urlStr = input instanceof Request ? input.url : input.toString();
  const options = init || {};
  // Normalize headers to a Headers object to handle Record, string[][], or Headers input
  const headers = new Headers(options.headers);

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

  return fetch(targetUrl, newOptions);
}

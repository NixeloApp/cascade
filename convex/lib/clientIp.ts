/**
 * Safe Client IP Extraction Helper
 *
 * This utility provides a consistent way to extract the client's IP address
 * from request headers, prioritizing headers set by trusted proxies/CDNs
 * (Cloudflare, Vercel, Fastly, etc.) over the easily spoofable X-Forwarded-For.
 */

export function getClientIp(request: Request): string | null {
  const headers = request.headers;

  // 1. Cloudflare (Highest priority as it's our primary CDN)
  // This header is set by Cloudflare and cannot be spoofed if the request comes through them.
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // 2. True-Client-IP (Cloudflare Enterprise / Akamai)
  const trueClientIp = headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp;

  // 3. Vercel / Nginx Real IP (Standard for many reverse proxies)
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp;

  // 4. X-Client-IP (Common alternative)
  const clientIp = headers.get("x-client-ip");
  if (clientIp) return clientIp;

  // 5. Fastly Client IP
  const fastlyIp = headers.get("fastly-client-ip");
  if (fastlyIp) return fastlyIp;

  // 6. X-Forwarded-For (Standard but spoofable)
  // We prioritize the first IP in the list, assuming standard behavior where
  // the client's IP is the first entry.
  // Warning: If the platform does not strip this header from external requests,
  // the first IP could be spoofed by the client.
  // However, without platform-specific knowledge of trusted proxy count,
  // this is the standard fallback.
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Split by comma and take the first one
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    const firstIp = ips[0];
    if (firstIp) return firstIp;
  }

  return null;
}

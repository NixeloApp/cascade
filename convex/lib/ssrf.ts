import { resolveDNS } from "./dns";
import { validation } from "./errors";

// Strict IPv4 Regex: 4 decimal octets (0-255), no leading zeros unless single '0'
const STRICT_IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;

// Strict IPv6 Regex (simplified but robust for common cases)
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * Checks if the hostname is a strictly formatted IPv4 address.
 * Rejects octal (0127), hex (0x7f), integer, or partial formats.
 */
export function isStrictIPv4(hostname: string): boolean {
  return STRICT_IPV4_REGEX.test(hostname);
}

/**
 * Checks if the hostname is a valid IPv6 address.
 */
export function isStrictIPv6(hostname: string): boolean {
  // Basic structural check
  if (!hostname.includes(":")) return false;

  // Check for invalid characters
  if (/[^0-9a-fA-F:.]/.test(hostname)) return false;

  // Cannot have more than one "::"
  if (hostname.split("::").length > 2) return false;

  // Handle IPv4-mapped IPv6 (::ffff:1.2.3.4)
  if (hostname.includes(".")) {
    const lastColon = hostname.lastIndexOf(":");
    const ipv4Part = hostname.substring(lastColon + 1);
    if (!isStrictIPv4(ipv4Part)) return false;
    // The prefix must be valid IPv6
    const prefix = hostname.substring(0, lastColon + 1);
    // Validate prefix: it must end with colon
    if (!prefix.endsWith(":")) return false;
    // Check if the prefix part (without the IPv4) is valid IPv6 when '0' is appended
    return IPV6_REGEX.test(`${prefix}0`);
  }

  return IPV6_REGEX.test(hostname);
}

/**
 * Checks if a strict IPv4 address is in a private or reserved range.
 */
export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => parseInt(p, 10));
  const [a, b, c, _d] = parts;

  // Simple range checks
  if (a === 0 || a === 10 || a === 127) return true;
  if (a >= 224) return true; // Multicast (224-239) & Reserved (240-255)

  // Complex checks
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // Link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // Private
  if (a === 192) return check192(b, c);
  if (a === 198) return check198(b, c);
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3

  return false;
}

function check192(b: number, c: number): boolean {
  if (b === 168) return true; // Private
  if (b === 0) return c === 0 || c === 2; // IETF Protocol or TEST-NET-1
  if (b === 88 && c === 99) return true; // 6to4 Relay
  return false;
}

function check198(b: number, c: number): boolean {
  if (b === 18 || b === 19) return true; // Benchmarking
  if (b === 51 && c === 100) return true; // TEST-NET-2
  return false;
}

/**
 * Normalizes an IPv6 address to its full 32-digit hex representation (8 groups of 4).
 * Handles:
 * - IPv4-mapped addresses (::ffff:1.2.3.4) -> 0000:0000:0000:0000:0000:ffff:0102:0304
 * - Compression (::)
 * - Leading zeros removal
 * - Case insensitivity
 */
export function expandIPv6(ip: string): string {
  // 1. Handle IPv4-mapped addresses
  if (ip.includes(".")) {
    const lastColon = ip.lastIndexOf(":");
    const ipv4Part = ip.substring(lastColon + 1);
    const prefix = ip.substring(0, lastColon + 1);

    const parts = ipv4Part.split(".").map((p) => parseInt(p, 10));
    // If not valid IPv4 parts, return as is (isStrictIPv6 would have caught it usually)
    if (parts.length !== 4 || parts.some(isNaN)) return ip;

    const hexIPv4 = parts.map((p) => p.toString(16).padStart(2, "0")).join("");
    // 1.2.3.4 -> 01020304
    // Split into two groups: 0102 and 0304
    const group1 = hexIPv4.substring(0, 4);
    const group2 = hexIPv4.substring(4, 8);

    return expandIPv6(`${prefix}${group1}:${group2}`);
  }

  // 2. Handle compression (::)
  let groups: string[];

  if (ip.includes("::")) {
    const [left, right] = ip.split("::");
    const leftGroups = left ? left.split(":") : [];
    const rightGroups = right ? right.split(":") : [];
    // Standard IPv6 has 8 groups
    const missingGroups = 8 - (leftGroups.length + rightGroups.length);

    // Safety check: ensure we don't create negative array size if input is malformed
    const zeros = Array(Math.max(0, missingGroups)).fill("0000");
    groups = [...leftGroups, ...zeros, ...rightGroups];
  } else {
    groups = ip.split(":");
  }

  // 3. Pad each group to 4 chars and lower case
  return groups.map((g) => g.padStart(4, "0").toLowerCase()).join(":");
}

/**
 * Checks if a strict IPv6 address is in a private or reserved range.
 */
export function isPrivateIPv6(ip: string): boolean {
  const expanded = expandIPv6(ip);

  // ::1/128 (Loopback)
  if (expanded === "0000:0000:0000:0000:0000:0000:0000:0001") return true;

  // ::/128 (Unspecified)
  if (expanded === "0000:0000:0000:0000:0000:0000:0000:0000") return true;

  // fe80::/10 (Link-local) -> fe80... to febf...
  if (/^fe[89ab]/i.test(expanded)) return true;

  // fc00::/7 (Unique Local) -> fc00... to fdff...
  if (/^f[cd]/i.test(expanded)) return true;

  // IPv4-mapped IPv6 ::ffff:0:0/96
  // Prefix: 0000:0000:0000:0000:0000:ffff:
  if (expanded.startsWith("0000:0000:0000:0000:0000:ffff:")) {
    const parts = expanded.split(":");
    // The last two groups contain the IPv4 address
    const high = parseInt(parts[6], 16);
    const low = parseInt(parts[7], 16);

    const p1 = (high >> 8) & 0xff;
    const p2 = high & 0xff;
    const p3 = (low >> 8) & 0xff;
    const p4 = low & 0xff;

    const ipv4 = `${p1}.${p2}.${p3}.${p4}`;
    if (isPrivateIPv4(ipv4)) return true;
  }

  // 2001:db8::/32 (Documentation)
  if (expanded.startsWith("2001:0db8:")) return true;

  return false;
}

/**
 * Checks if a hostname looks like an IP address but isn't strict.
 * Catches integer IPs, hex IPs, octal IPs, partial IPs.
 */
export function isAmbiguousIP(hostname: string): boolean {
  // If it's already strict, it's not ambiguous (it's handled by isPrivateIP)
  if (isStrictIPv4(hostname) || isStrictIPv6(hostname)) return false;

  // Check for Integer IP (all digits)
  if (/^\d+$/.test(hostname)) return true;

  // Check for Hex IP (0x...)
  if (/^0x[0-9a-fA-F]+$/.test(hostname)) return true;

  // Check for partial/loose IPv4
  // Contains only digits and dots?
  if (/^[\d.]+$/.test(hostname)) {
    // We block ALL non-strict numeric-dot patterns.
    return true;
  }

  // Check for Hex mixed with dots (0x7f.0.0.1)
  if (/^0x[0-9a-fA-F.]+$/.test(hostname)) return true;

  // Check if last label is numeric (often indicates IP or invalid TLD)
  const parts = hostname.split(".");
  const lastPart = parts[parts.length - 1];
  if (/^\d+$/.test(lastPart)) {
    return true;
  }

  return false;
}

/**
 * Validates a destination URL to prevent SSRF.
 * Enforces strict IP formats and blocks private ranges.
 * Blocks ambiguous IP formats.
 */
export function validateDestination(url: string) {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw validation("url", "Invalid URL format");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw validation("url", "Invalid URL protocol. Must be http or https.");
  }

  // Remove brackets from IPv6 for checking
  let hostname = parsed.hostname;
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  // 1. Strict IP Check
  if (isStrictIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw validation("url", "Private IP addresses are not allowed.");
    }
    return; // Safe Public IP
  }

  if (isStrictIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      throw validation("url", "Private IP addresses are not allowed.");
    }
    return; // Safe Public IP
  }

  // 2. Ambiguous IP Check
  if (isAmbiguousIP(hostname)) {
    throw validation("url", "Ambiguous or non-standard IP addresses are not allowed.");
  }

  // 3. Domain Name Check
  // Additional check: Metadata hostname
  if (hostname === "169.254.169.254" || hostname.toLowerCase() === "localhost") {
    throw validation("url", "Restricted hostname.");
  }
}

/**
 * Validates a destination URL to prevent SSRF by resolving DNS.
 * Enforces strict IP formats and blocks private ranges.
 * Blocks domains that resolve to private IPs.
 * Returns the resolved IP address to be used for the connection.
 */
export async function validateDestinationResolved(url: string): Promise<string> {
  // 1. Basic syntax and direct IP check
  validateDestination(url);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw validation("url", "Invalid URL format");
  }

  let hostname = parsed.hostname;
  if (hostname.startsWith("[") && hostname.endsWith("]")) {
    hostname = hostname.slice(1, -1);
  }

  // If it's a strict IP, validateDestination already checked it.
  if (isStrictIPv4(hostname)) {
    return hostname;
  }
  if (isStrictIPv6(hostname)) {
    return `[${hostname}]`;
  }

  // If it's a domain name, resolve it and check IPs
  const ips = await resolveDNS(hostname);

  if (ips.length === 0) {
    throw validation("url", `Could not resolve hostname: ${hostname}`);
  }

  for (const ip of ips) {
    if (isStrictIPv4(ip) && isPrivateIPv4(ip)) {
      throw validation("url", `Domain resolves to private IP address: ${ip}`);
    }
    if (isStrictIPv6(ip) && isPrivateIPv6(ip)) {
      throw validation("url", `Domain resolves to private IP address: ${ip}`);
    }
  }

  // Use the first resolved IP
  const firstIp = ips[0];
  if (isStrictIPv6(firstIp)) {
    return `[${firstIp}]`;
  }
  return firstIp;
}

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

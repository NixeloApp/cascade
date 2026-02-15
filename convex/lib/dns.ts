/**
 * DNS Resolution Utility using Cloudflare DNS over HTTPS (DoH).
 * Resolves both A and AAAA records.
 */

const DOH_TIMEOUT_MS = 5000;

export async function resolveDNS(hostname: string): Promise<string[]> {
  const ips: string[] = [];

  // Query A records (IPv4)
  try {
    const aRecords = await queryDoH(hostname, "A");
    ips.push(...aRecords);
  } catch (e) {
    // If A record lookup fails, we still try AAAA.
    // However, if it's a timeout or network error, AAAA might fail too.
    console.error(`DNS lookup failed for A record of ${hostname}: ${e}`);
  }

  // Query AAAA records (IPv6)
  try {
    const aaaaRecords = await queryDoH(hostname, "AAAA");
    ips.push(...aaaaRecords);
  } catch (e) {
    console.error(`DNS lookup failed for AAAA record of ${hostname}: ${e}`);
  }

  // If no IPs found at all, throw error to be safe (fail secure)
  if (ips.length === 0) {
    throw new Error(`Could not resolve hostname: ${hostname}`);
  }

  return ips;
}

async function queryDoH(name: string, type: "A" | "AAAA"): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS);

  try {
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, {
      headers: { "Accept": "application/dns-json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DoH request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.Status !== 0) {
      // Status 0 is NOERROR. Other codes indicate failure (e.g. NXDOMAIN).
      // We return empty array if domain not found or other DNS error, but don't throw yet.
      // The caller decides if empty result is fatal.
      return [];
    }

    // Filter for Answer records of the correct type (1 for A, 28 for AAAA)
    const typeId = type === "A" ? 1 : 28;
    return data.Answer?.filter((a: any) => a.type === typeId).map((a: any) => a.data) || [];
  } finally {
    clearTimeout(timeoutId);
  }
}

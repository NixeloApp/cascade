/**
 * DNS Resolution Utility using Cloudflare DNS over HTTPS (DoH).
 * Resolves both A and AAAA records.
 */

const DOH_TIMEOUT_MS = 5000;

interface DnsAnswer {
  type: number;
  data: string;
}

export async function resolveDNS(hostname: string): Promise<string[]> {
  const ips: string[] = [];

  // Query A and AAAA records in parallel.
  // We use Promise.all to ensure that if EITHER lookup fails (network error, timeout),
  // the entire resolution fails. This is a "Fail Closed" security policy.
  // If we allowed partial success, we might miss a private IP (e.g. AAAA ::1) due to a transient error,
  // while the public IP (A 1.2.3.4) succeeds. The attacker could then exploit the race condition
  // where the system resolver later finds the private IP.
  const [aRecords, aaaaRecords] = await Promise.all([
    queryDoH(hostname, "A"),
    queryDoH(hostname, "AAAA"),
  ]);

  ips.push(...aRecords);
  ips.push(...aaaaRecords);

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
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`DoH request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.Status !== 0) {
      // Status 0 is NOERROR.
      // Status 3 is NXDOMAIN (domain not found) - return empty array.
      if (data.Status === 3) {
        return [];
      }

      // For other errors (e.g. SERVFAIL=2, REFUSED=5), fail closed.
      // We cannot be sure if a private IP exists but was missed due to DNS failure.
      throw new Error(`DNS resolution failed with status ${data.Status}`);
    }

    // Filter for Answer records of the correct type (1 for A, 28 for AAAA)
    const typeId = type === "A" ? 1 : 28;
    return (data.Answer as DnsAnswer[])?.filter((a) => a.type === typeId).map((a) => a.data) || [];
  } finally {
    clearTimeout(timeoutId);
  }
}

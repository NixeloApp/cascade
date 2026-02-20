import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dns from "./dns";
import { validateDestinationResolved } from "./ssrf";

vi.mock("./dns", () => ({
  resolveDNS: vi.fn(),
}));

describe("validateDestinationResolved", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns IP for valid direct IPv4", async () => {
    // Direct IP is resolved by URL parser, not resolveDNS
    // Note: The mocked resolveDNS won't be called because validateDestination handles IP check first
    const ip = await validateDestinationResolved("http://8.8.8.8");
    expect(ip).toBe("8.8.8.8");
  });

  it("returns bracketed IP for valid direct IPv6", async () => {
    // 2606:4700:4700::1111 is Cloudflare DNS, a public IPv6
    const ip = await validateDestinationResolved("http://[2606:4700:4700::1111]");
    expect(ip).toBe("[2606:4700:4700::1111]");
  });

  it("resolves domain and returns first safe IP", async () => {
    vi.mocked(dns.resolveDNS).mockResolvedValue(["1.2.3.4", "5.6.7.8"]);
    const ip = await validateDestinationResolved("http://example.com");
    expect(ip).toBe("1.2.3.4");
  });

  it("resolves domain and returns bracketed IPv6 if first", async () => {
    vi.mocked(dns.resolveDNS).mockResolvedValue(["2606:4700:4700::1111", "1.2.3.4"]);
    const ip = await validateDestinationResolved("http://example.com");
    expect(ip).toBe("[2606:4700:4700::1111]");
  });

  it("throws if any resolved IP is private (anti-rebinding)", async () => {
    vi.mocked(dns.resolveDNS).mockResolvedValue(["1.2.3.4", "127.0.0.1"]);
    await expect(validateDestinationResolved("http://example.com")).rejects.toThrow(
      /Domain resolves to private IP address/,
    );
  });

  it("throws if all resolved IPs are private", async () => {
    vi.mocked(dns.resolveDNS).mockResolvedValue(["127.0.0.1"]);
    await expect(validateDestinationResolved("http://example.com")).rejects.toThrow(
      /Domain resolves to private IP address/,
    );
  });

  it("throws if resolveDNS returns empty array", async () => {
    vi.mocked(dns.resolveDNS).mockResolvedValue([]);
    await expect(validateDestinationResolved("http://example.com")).rejects.toThrow();
  });
});

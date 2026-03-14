import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDNS } from "./dns";

/** Create a mock Response for DNS tests */
function mockDnsResponse(data: { Status: number; Answer: Array<{ type: number; data: string }> }) {
  return Promise.resolve({
    ok: true,
    json: async () => data,
  } as Response);
}

describe("resolveDNS", () => {
  const originalFetch = global.fetch;
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should resolve A records", async () => {
    // Mock A record response
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    );
    // Mock AAAA record response (empty)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 0, Answer: [] }));

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("1.2.3.4");
    expect(ips).toHaveLength(1);
  });

  it("should resolve AAAA records", async () => {
    // Mock A record response (empty)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 0, Answer: [] }));
    // Mock AAAA record response
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 28, data: "2001:db8::1" }] }),
    );

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("2001:db8::1");
    expect(ips).toHaveLength(1);
  });

  it("should resolve both A and AAAA records", async () => {
    // Mock A record response
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    );
    // Mock AAAA record response
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 28, data: "2001:db8::1" }] }),
    );

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("1.2.3.4");
    expect(ips).toContain("2001:db8::1");
    expect(ips).toHaveLength(2);
  });

  it("should throw if no records found", async () => {
    // Mock A record response (empty)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 0, Answer: [] }));
    // Mock AAAA record response (empty)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 0, Answer: [] }));

    await expect(resolveDNS("example.com")).rejects.toThrow("Could not resolve hostname");
  });

  it("should fail if one lookup fails (Fail Closed)", async () => {
    // Mock A record failure
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("Network error")));
    // Mock AAAA record success (should not be returned)
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 28, data: "2001:db8::1" }] }),
    );

    await expect(resolveDNS("example.com")).rejects.toThrow("Network error");
  });

  it("should throw if all lookups fail", async () => {
    // Mock A record failure
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("Network error")));
    // Mock AAAA record failure
    fetchMock.mockImplementationOnce(() => Promise.reject(new Error("Network error")));

    await expect(resolveDNS("example.com")).rejects.toThrow("Network error");
  });

  it("should throw on SERVFAIL (Fail Closed)", async () => {
    // Mock A record success
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    );
    // Mock AAAA record SERVFAIL (Status 2)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 2, Answer: [] }));

    await expect(resolveDNS("example.com")).rejects.toThrow("DNS resolution failed with status 2");
  });

  it("should handle NXDOMAIN (Status 3) as empty result", async () => {
    // Mock A record success
    fetchMock.mockImplementationOnce(() =>
      mockDnsResponse({ Status: 0, Answer: [{ type: 1, data: "1.2.3.4" }] }),
    );
    // Mock AAAA record NXDOMAIN (Status 3)
    fetchMock.mockImplementationOnce(() => mockDnsResponse({ Status: 3, Answer: [] }));

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("1.2.3.4");
    expect(ips).toHaveLength(1);
  });
});

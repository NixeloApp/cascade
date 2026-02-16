import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDNS } from "./dns";

describe("resolveDNS", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should resolve A records", async () => {
    // Mock A record response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ type: 1, data: "1.2.3.4" }],
        }),
      }),
    );
    // Mock AAAA record response (empty)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [],
        }),
      }),
    );

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("1.2.3.4");
    expect(ips).toHaveLength(1);
  });

  it("should resolve AAAA records", async () => {
    // Mock A record response (empty)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [],
        }),
      }),
    );
    // Mock AAAA record response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ type: 28, data: "2001:db8::1" }],
        }),
      }),
    );

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("2001:db8::1");
    expect(ips).toHaveLength(1);
  });

  it("should resolve both A and AAAA records", async () => {
    // Mock A record response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ type: 1, data: "1.2.3.4" }],
        }),
      }),
    );
    // Mock AAAA record response
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ type: 28, data: "2001:db8::1" }],
        }),
      }),
    );

    const ips = await resolveDNS("example.com");
    expect(ips).toContain("1.2.3.4");
    expect(ips).toContain("2001:db8::1");
    expect(ips).toHaveLength(2);
  });

  it("should throw if no records found", async () => {
    // Mock A record response (empty)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [],
        }),
      }),
    );
    // Mock AAAA record response (empty)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [],
        }),
      }),
    );

    await expect(resolveDNS("example.com")).rejects.toThrow("Could not resolve hostname");
  });

  it("should fail if one lookup fails (Fail Closed)", async () => {
    // Mock A record failure
    (global.fetch as any).mockImplementationOnce(() => Promise.reject(new Error("Network error")));
    // Mock AAAA record success (should not be returned)
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          Status: 0,
          Answer: [{ type: 28, data: "2001:db8::1" }],
        }),
      }),
    );

    await expect(resolveDNS("example.com")).rejects.toThrow("Network error");
  });

  it("should throw if all lookups fail", async () => {
    // Mock A record failure
    (global.fetch as any).mockImplementationOnce(() => Promise.reject(new Error("Network error")));
    // Mock AAAA record failure
    (global.fetch as any).mockImplementationOnce(() => Promise.reject(new Error("Network error")));

    await expect(resolveDNS("example.com")).rejects.toThrow("Network error");
  });
});

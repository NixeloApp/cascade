import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithTimeout } from "./fetchWithTimeout";
import { safeFetch } from "./safeFetch";
import { validateDestinationResolved } from "./ssrf";

// Mock dependencies
vi.mock("./ssrf", () => ({
  validateDestinationResolved: vi.fn(),
}));

vi.mock("./fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

describe("safeFetch", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rewrites HTTP URL to resolved IPv4 and sets Host header", async () => {
    const resolvedIp = "1.2.3.4";
    vi.mocked(validateDestinationResolved).mockResolvedValue(resolvedIp);
    vi.mocked(fetchWithTimeout).mockResolvedValue(new Response("ok"));

    const url = "http://example.com/path";
    await safeFetch(url);

    expect(validateDestinationResolved).toHaveBeenCalledWith(url);
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      `http://${resolvedIp}/path`,
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
      10000, // default timeout
    );

    const callArgs = vi.mocked(fetchWithTimeout).mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    expect(headers.get("Host")).toBe("example.com");
  });

  it("rewrites HTTP URL to resolved IPv6 and sets Host header", async () => {
    const resolvedIp = "[2001:db8::1]";
    vi.mocked(validateDestinationResolved).mockResolvedValue(resolvedIp);
    vi.mocked(fetchWithTimeout).mockResolvedValue(new Response("ok"));

    const url = "http://example.com/path";
    await safeFetch(url);

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      `http://${resolvedIp}/path`,
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
      10000,
    );

    const callArgs = vi.mocked(fetchWithTimeout).mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;
    expect(headers.get("Host")).toBe("example.com");
  });

  it("passes through HTTPS URL without rewriting but validates destination", async () => {
    const resolvedIp = "1.2.3.4";
    vi.mocked(validateDestinationResolved).mockResolvedValue(resolvedIp);
    vi.mocked(fetchWithTimeout).mockResolvedValue(new Response("ok"));

    const url = "https://example.com/path";
    await safeFetch(url);

    expect(validateDestinationResolved).toHaveBeenCalledWith(url);
    // Should NOT rewrite HTTPS URL (to avoid cert errors)
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
      10000,
    );
  });

  it("propagates validation errors", async () => {
    const error = new Error("Private IP");
    vi.mocked(validateDestinationResolved).mockRejectedValue(error);

    await expect(safeFetch("http://internal.com")).rejects.toThrow("Private IP");
    expect(fetchWithTimeout).not.toHaveBeenCalled();
  });

  it("merges existing headers with Host header", async () => {
    const resolvedIp = "1.2.3.4";
    vi.mocked(validateDestinationResolved).mockResolvedValue(resolvedIp);
    vi.mocked(fetchWithTimeout).mockResolvedValue(new Response("ok"));

    const url = "http://example.com";
    await safeFetch(url, {
      headers: { Authorization: "Bearer token" },
    });

    const callArgs = vi.mocked(fetchWithTimeout).mock.calls[0];
    const headers = callArgs[1]?.headers as Headers;

    expect(headers.get("Host")).toBe("example.com");
    expect(headers.get("Authorization")).toBe("Bearer token");
  });

  it("sets redirect to error to prevent redirects to internal IPs", async () => {
    const resolvedIp = "1.2.3.4";
    vi.mocked(validateDestinationResolved).mockResolvedValue(resolvedIp);
    vi.mocked(fetchWithTimeout).mockResolvedValue(new Response("ok"));

    await safeFetch("http://example.com");

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        redirect: "error",
      }),
      10000,
    );
  });
});

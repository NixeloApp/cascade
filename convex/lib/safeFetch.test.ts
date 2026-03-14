import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fetchWithTimeoutModule from "./fetchWithTimeout";
import { safeFetch } from "./safeFetch";
import * as ssrf from "./ssrf";

// Mock the dependencies
vi.mock("./ssrf", () => ({
  validateDestinationResolved: vi.fn(),
}));

vi.mock("./fetchWithTimeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

describe("safeFetch", () => {
  const mockValidateDestinationResolved = vi.mocked(ssrf.validateDestinationResolved);
  const mockFetchWithTimeout = vi.mocked(fetchWithTimeoutModule.fetchWithTimeout);

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetchWithTimeout.mockResolvedValue(new Response("ok"));
  });

  it("rewrites HTTP URL to use resolved IP and sets Host header", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("http://example.com/foo");

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("http://example.com/foo");

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [url, options, timeout] = mockFetchWithTimeout.mock.calls[0]!;

    expect(url).toBe("http://1.2.3.4/foo");
    expect(timeout).toBe(10000);
    expect(options?.headers).toBeInstanceOf(Headers);
    const headers = options?.headers as Headers;
    expect(headers.get("Host")).toBe("example.com");
    expect(options?.redirect).toBe("error");
  });

  it("preserves HTTPS URL (does not rewrite to IP)", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("https://example.com/foo");

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("https://example.com/foo");

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [url, options, timeout] = mockFetchWithTimeout.mock.calls[0]!;

    expect(url).toBe("https://example.com/foo");
    expect(options?.headers).toBeInstanceOf(Headers);
    const headers = options?.headers as Headers;
    // Host header should not be set manually for HTTPS
    expect(headers.get("Host")).toBeNull();
    expect(options?.redirect).toBe("error");
  });

  it("propagates error from validateDestinationResolved (SSRF check)", async () => {
    const error = new Error("Private IP addresses are not allowed.");
    mockValidateDestinationResolved.mockRejectedValue(error);

    await expect(safeFetch("http://internal.com")).rejects.toThrow(
      "Private IP addresses are not allowed.",
    );
    expect(mockFetchWithTimeout).not.toHaveBeenCalled();
  });

  it("merges custom headers correctly", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("http://example.com", {
      headers: { "X-Custom": "test-value" },
    });

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetchWithTimeout.mock.calls[0]!;
    const headers = options?.headers as Headers;

    expect(url).toBe("http://1.2.3.4/");
    expect(headers.get("x-custom")).toBe("test-value");
    expect(headers.get("host")).toBe("example.com");
  });

  it("extracts URL from Request object", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");
    // Note: safeFetch currently does not preserve method/body from Request object, only URL.
    // This test verifies URL extraction.
    const request = new Request("http://example.com/bar");

    await safeFetch(request);

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("http://example.com/bar");

    const [url, options] = mockFetchWithTimeout.mock.calls[0]!;
    const headers = options?.headers as Headers;
    expect(url).toBe("http://1.2.3.4/bar");
    expect(headers.get("host")).toBe("example.com");
  });

  it("passes custom timeout", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("http://example.com", {}, 5000);

    const [_url, _options, timeout] = mockFetchWithTimeout.mock.calls[0]!;
    expect(timeout).toBe(5000);
  });
});

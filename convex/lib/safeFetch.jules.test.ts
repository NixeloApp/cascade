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
  const mockValidateDestinationResolved = ssrf.validateDestinationResolved as unknown as ReturnType<
    typeof vi.fn
  >;
  const mockFetchWithTimeout = fetchWithTimeoutModule.fetchWithTimeout as unknown as ReturnType<
    typeof vi.fn
  >;

  beforeEach(() => {
    vi.resetAllMocks();
    mockFetchWithTimeout.mockResolvedValue(new Response("ok"));
  });

  it("rewrites HTTP URL to use resolved IP and sets Host header", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("http://example.com/foo");

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("http://example.com/foo");

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [url, options, timeout] = mockFetchWithTimeout.mock.calls[0];

    expect(url).toBe("http://1.2.3.4/foo");
    expect(timeout).toBe(10000);
    expect(options.headers).toBeInstanceOf(Headers);
    expect(options.headers.get("Host")).toBe("example.com");
    expect(options.redirect).toBe("error");
  });

  it("preserves HTTPS URL (does not rewrite to IP)", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("https://example.com/foo");

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("https://example.com/foo");

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(1);
    const [url, options, timeout] = mockFetchWithTimeout.mock.calls[0];

    expect(url).toBe("https://example.com/foo");
    expect(options.headers).toBeInstanceOf(Headers);
    // Host header should not be set manually for HTTPS
    expect(options.headers.get("Host")).toBeNull();
    expect(options.redirect).toBe("error");
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
    const [url, options] = mockFetchWithTimeout.mock.calls[0];

    expect(url).toBe("http://1.2.3.4/");
    expect(options.headers.get("x-custom")).toBe("test-value");
    expect(options.headers.get("host")).toBe("example.com");
  });

  it("extracts URL from Request object", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");
    const request = new Request("http://example.com/bar");

    await safeFetch(request);

    expect(mockValidateDestinationResolved).toHaveBeenCalledWith("http://example.com/bar");

    const [url, options] = mockFetchWithTimeout.mock.calls[0];
    expect(url).toBe("http://1.2.3.4/bar");
    expect(options.headers.get("host")).toBe("example.com");
  });

  it("preserves Request properties (method, body)", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");
    const request = new Request("http://example.com/api", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" }),
    });

    await safeFetch(request);

    const [url, options] = mockFetchWithTimeout.mock.calls[0];
    expect(url).toBe("http://1.2.3.4/api");
    expect(options.method).toBe("POST");
    // Verify body is preserved (it will be a ReadableStream or similar)
    expect(options.body).toBeDefined();
    // Headers from Request should be preserved too?
    // Request constructor sets Content-Type if body is string? No, unless we set it.
    // But Request object has headers.
  });

  it("merges Request headers with init headers", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");
    const request = new Request("http://example.com", {
      headers: { "X-Request": "req-val", "X-Common": "req-val" },
    });

    await safeFetch(request, {
      headers: { "X-Init": "init-val", "X-Common": "init-val" },
    });

    const [url, options] = mockFetchWithTimeout.mock.calls[0];
    const headers = options.headers as Headers;

    expect(headers.get("x-request")).toBe("req-val");
    expect(headers.get("x-init")).toBe("init-val");
    expect(headers.get("x-common")).toBe("init-val"); // Init overrides request
    expect(headers.get("host")).toBe("example.com");
  });

  it("passes custom timeout", async () => {
    mockValidateDestinationResolved.mockResolvedValue("1.2.3.4");

    await safeFetch("http://example.com", {}, 5000);

    const [_url, _options, timeout] = mockFetchWithTimeout.mock.calls[0];
    expect(timeout).toBe(5000);
  });
});

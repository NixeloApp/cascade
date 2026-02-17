import { afterEach, describe, expect, it, vi } from "vitest";
import { safeFetch } from "./safeFetch";
import * as ssrf from "./ssrf";

vi.mock("./ssrf", () => ({
  validateDestinationResolved: vi.fn(),
}));

describe("safeFetch", () => {
  const fetchSpy = vi.spyOn(global, "fetch");

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rewrites HTTP URL to use resolved IP and sets Host header", async () => {
    vi.mocked(ssrf.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    fetchSpy.mockResolvedValue(new Response("ok"));

    const url = "http://example.com/path?query=1";
    await safeFetch(url);

    expect(ssrf.validateDestinationResolved).toHaveBeenCalledWith(url);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe("http://1.2.3.4/path?query=1");
    expect(options?.redirect).toBe("error");

    const headers = options?.headers as Headers;
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.get("Host")).toBe("example.com");
  });

  it("preserves HTTPS URL (no rewrite) but still validates", async () => {
    vi.mocked(ssrf.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    fetchSpy.mockResolvedValue(new Response("ok"));

    const url = "https://example.com/path";
    await safeFetch(url);

    expect(ssrf.validateDestinationResolved).toHaveBeenCalledWith(url);
    // HTTPS must use original URL for SNI/certificate validation

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe(url);
    expect(options?.redirect).toBe("error");
  });

  it("handles IPv6 addresses with brackets correctly", async () => {
    vi.mocked(ssrf.validateDestinationResolved).mockResolvedValue("[2001:db8::1]");
    fetchSpy.mockResolvedValue(new Response("ok"));

    const url = "http://example.com/ipv6";
    await safeFetch(url);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe("http://[2001:db8::1]/ipv6");

    const headers = options?.headers as Headers;
    expect(headers.get("Host")).toBe("example.com");
  });

  it("merges custom headers with Host header", async () => {
    vi.mocked(ssrf.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    fetchSpy.mockResolvedValue(new Response("ok"));

    await safeFetch("http://example.com", {
      headers: {
        "X-Custom": "value",
        "Content-Type": "application/json",
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, options] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe("http://1.2.3.4/");

    const headers = options?.headers as Headers;
    expect(headers.get("Host")).toBe("example.com");
    expect(headers.get("X-Custom")).toBe("value");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("propagates fetch errors", async () => {
    vi.mocked(ssrf.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    const error = new Error("Network error");
    fetchSpy.mockRejectedValue(error);

    await expect(safeFetch("http://example.com")).rejects.toThrow(error);
  });

  it("propagates validation errors", async () => {
    const error = new Error("Invalid URL");
    vi.mocked(ssrf.validateDestinationResolved).mockRejectedValue(error);

    await expect(safeFetch("http://invalid.com")).rejects.toThrow(error);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

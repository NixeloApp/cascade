import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ssrfModule from "./ssrf";
import { deliverWebhook } from "./webhookHelpers";

// Mock the ssrf module
vi.mock("./ssrf", () => ({
  validateDestinationResolved: vi.fn(),
}));

describe("deliverWebhook", () => {
  const url = "http://example.com/webhook";
  const payload = JSON.stringify({ event: "test" });
  const event = "test.event";
  const secret = "my-secret";

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should deliver webhook successfully", async () => {
    // Mock successful DNS resolution
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");

    // Mock successful fetch response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "Success",
    });

    const result = await deliverWebhook(url, payload, event, secret);

    expect(result.status).toBe("success");
    expect(result.responseStatus).toBe(200);
    expect(result.responseBody).toBe("Success");

    // Check fetch call
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const callArgs = (global.fetch as any).mock.calls[0];
    const targetUrl = callArgs[0];
    const options = callArgs[1];

    // Verify URL rewriting for HTTP (SSRF protection against DNS rebinding)
    expect(targetUrl).toBe("http://1.2.3.4/webhook");

    // Headers is a Headers object, so we must use .get()
    expect(options.headers.get("Host")).toBe("example.com");
    expect(options.headers.get("X-Webhook-Event")).toBe(event);
    expect(options.headers.get("Content-Type")).toBe("application/json");

    // Verify signature format (hex string)
    expect(options.headers.get("X-Webhook-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should fail if DNS validation fails (SSRF)", async () => {
    vi.mocked(ssrfModule.validateDestinationResolved).mockRejectedValue(new Error("Private IP"));

    const result = await deliverWebhook(url, payload, event, secret);

    expect(result.status).toBe("failed");
    expect(result.error).toContain("Private IP");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle network errors gracefully", async () => {
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    (global.fetch as any).mockRejectedValue(new Error("Network Error"));

    const result = await deliverWebhook(url, payload, event);

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Network Error");
  });

  it("should return failure status for HTTP errors", async () => {
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server Error",
    });

    const result = await deliverWebhook(url, payload, event);

    expect(result.status).toBe("failed");
    expect(result.responseStatus).toBe(500);
    expect(result.error).toBe("HTTP 500: Internal Server Error");
  });

  it("should not rewrite URL for HTTPS but still validate DNS", async () => {
    const httpsUrl = "https://example.com/webhook";
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "Success",
    });

    await deliverWebhook(httpsUrl, payload, event);

    expect(ssrfModule.validateDestinationResolved).toHaveBeenCalledWith(httpsUrl);

    const callArgs = (global.fetch as any).mock.calls[0];
    // HTTPS URLs should be used as-is for certificate validation
    expect(callArgs[0]).toBe(httpsUrl);
    // Host header should not be manually set for HTTPS fetch (browser/fetch handles it)
    expect(callArgs[1].headers.get("Host")).toBeNull();
  });

  it("should generate correct HMAC signature", async () => {
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");
    (global.fetch as any).mockResolvedValue({ ok: true, text: async () => "" });

    await deliverWebhook(url, payload, event, secret);

    const callArgs = (global.fetch as any).mock.calls[0];
    const signature = callArgs[1].headers.get("X-Webhook-Signature");

    // Verify signature manually
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expectedBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = Array.from(new Uint8Array(expectedBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    expect(signature).toBe(expectedSignature);
  });
});

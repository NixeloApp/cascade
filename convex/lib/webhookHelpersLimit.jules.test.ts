import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as ssrfModule from "./ssrf";
import { deliverWebhook } from "./webhookHelpers";

// Mock ssrf module
vi.mock("./ssrf", () => ({
  validateDestinationResolved: vi.fn(),
}));

describe("deliverWebhook with large payload", () => {
  const url = "http://example.com/webhook";
  const payload = JSON.stringify({ event: "test" });
  const event = "test.event";

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(ssrfModule.validateDestinationResolved).mockResolvedValue("1.2.3.4");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should truncate large response bodies and cancel the stream", async () => {
    let cancelCalled = false;
    const stream = new ReadableStream({
      start(controller) {
        // Enqueue a large chunk (5000 bytes)
        const chunk = new Uint8Array(5000).fill(65); // 'A'
        controller.enqueue(chunk);
        // Do not close, simulate more data potentially coming
      },
      cancel() {
        cancelCalled = true;
      },
    });

    // We verify that response.body is used directly.
    // Using a plain object ensures we bypass any buffering behavior of the Response constructor in the test environment.
    const responseMock = {
      ok: true,
      status: 200,
      headers: new Headers(),
      statusText: "OK",
      body: stream,
      // Fallback if implementation uses .text() (which it shouldn't)
      text: async () => {
        throw new Error("Should not use .text()");
      },
    };

    (global.fetch as any).mockResolvedValue(responseMock);

    const result = await deliverWebhook(url, payload, event);

    expect(result.status).toBe("success");
    expect(result.responseBody?.length).toBeLessThanOrEqual(1000);

    // Verify stream cancellation
    expect(cancelCalled).toBe(true);
  });
});

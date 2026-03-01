import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchTimeoutError, fetchWithTimeout } from "./fetchWithTimeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("FetchTimeoutError", () => {
    it("should create error with correct message", () => {
      const error = new FetchTimeoutError(5000);

      expect(error.message).toBe("Request timed out after 5000ms");
      expect(error.name).toBe("FetchTimeoutError");
    });
  });

  describe("fetchWithTimeout", () => {
    it("should return response when fetch succeeds", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
      });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const response = await fetchWithTimeout("https://example.com/api");

      expect(response).toBe(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/api",
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    it("should pass init options to fetch", async () => {
      const mockResponse = new Response("ok");
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await fetchWithTimeout("https://example.com/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: "test" }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://example.com/api",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: "test" }),
        }),
      );
    });

    it("should throw FetchTimeoutError when request times out", async () => {
      // Create a fetch that never resolves
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            // Simulate abort behavior
            setTimeout(() => {
              const error = new Error("Aborted");
              error.name = "AbortError";
              reject(error);
            }, 5001); // Just after timeout
          }),
      );

      const promise = fetchWithTimeout("https://example.com/api", {}, 5000);

      // Advance time past the timeout
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow(FetchTimeoutError);
      await expect(promise).rejects.toThrow("Request timed out after 5000ms");
    });

    it("should use default timeout of 10000ms", async () => {
      const mockResponse = new Response("ok");
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const promise = fetchWithTimeout("https://example.com/api");

      // Advance time less than default timeout
      vi.advanceTimersByTime(5000);

      await expect(promise).resolves.toBe(mockResponse);
    });

    it("should rethrow non-timeout errors", async () => {
      const networkError = new Error("Network error");
      global.fetch = vi.fn().mockRejectedValue(networkError);

      await expect(fetchWithTimeout("https://example.com/api")).rejects.toThrow("Network error");
    });

    it("should clear timeout after successful fetch", async () => {
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const mockResponse = new Response("ok");
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await fetchWithTimeout("https://example.com/api");

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});

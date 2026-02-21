import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchTimeoutError, fetchWithTimeout } from "./fetchWithTimeout";

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should resolve with response when fetch completes within timeout", async () => {
    const mockResponse = new Response("success");
    (global.fetch as any).mockResolvedValue(mockResponse);

    const promise = fetchWithTimeout("https://example.com");
    const result = await promise;

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("should throw FetchTimeoutError when fetch exceeds default timeout (10000ms)", async () => {
    (global.fetch as any).mockImplementation(async (_url: any, options: any) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    const promise = fetchWithTimeout("https://example.com");

    // Advance time past default timeout
    vi.advanceTimersByTime(10001);

    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toThrow("Request timed out after 10000ms");
  });

  it("should throw FetchTimeoutError when fetch exceeds custom timeout", async () => {
    (global.fetch as any).mockImplementation(async (_url: any, options: any) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    const promise = fetchWithTimeout("https://example.com", {}, 5000);

    // Advance time past custom timeout
    vi.advanceTimersByTime(5001);

    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toThrow("Request timed out after 5000ms");
  });

  it("should throw original AbortError when user aborts request", async () => {
    const controller = new AbortController();

    (global.fetch as any).mockImplementation(async (_url: any, options: any) => {
      return new Promise((_resolve, reject) => {
        const signal = options?.signal;
        // If already aborted
        if (signal?.aborted) {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
          return;
        }
        // Listen for abort
        signal?.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    });

    const promise = fetchWithTimeout("https://example.com", {
      signal: controller.signal,
    });

    // Simulate user aborting the request
    controller.abort();

    await expect(promise).rejects.toThrow("The operation was aborted");
    await expect(promise).rejects.not.toThrow(FetchTimeoutError);
  });

  it("should propagate network errors", async () => {
    const networkError = new Error("Network connection failed");
    (global.fetch as any).mockRejectedValue(networkError);

    const promise = fetchWithTimeout("https://example.com");

    await expect(promise).rejects.toThrow("Network connection failed");
    await expect(promise).rejects.not.toThrow(FetchTimeoutError);
  });
});

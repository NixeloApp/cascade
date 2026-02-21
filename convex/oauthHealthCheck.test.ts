import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("OAuth Health Check", () => {
  const env = {
    OAUTH_MONITOR_GOOGLE_CLIENT_ID: "mock-client-id",
    OAUTH_MONITOR_GOOGLE_CLIENT_SECRET: "mock-client-secret",
    OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN: "mock-refresh-token",
  };

  beforeEach(() => {
    vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_ID", env.OAUTH_MONITOR_GOOGLE_CLIENT_ID);
    vi.stubEnv("OAUTH_MONITOR_GOOGLE_CLIENT_SECRET", env.OAUTH_MONITOR_GOOGLE_CLIENT_SECRET);
    vi.stubEnv("OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN", env.OAUTH_MONITOR_GOOGLE_REFRESH_TOKEN);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("should record success when fetch succeeds", async () => {
    const t = convexTest(schema, modules);

    // Mock fetch for token exchange and user info
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

    vi.spyOn(global, "fetch").mockImplementation(fetchMock);

    await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth, {});

    const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
    expect(status.isHealthy).toBe(true);
    expect(status.lastError).toBeUndefined();
    expect(status.consecutiveFailures).toBe(0);
  });

  it("should record failure when fetch fails", async () => {
    const t = convexTest(schema, modules);

    // Mock fetch for token exchange failure
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "invalid_grant" }),
    } as Response);

    vi.spyOn(global, "fetch").mockImplementation(fetchMock);

    await t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth, {});

    const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
    expect(status.isHealthy).toBe(false);
    expect(status.lastError).toContain("invalid_grant");
  });

  it("should timeout if fetch hangs", async () => {
    const t = convexTest(schema, modules);

    // Mock fetch to hang but respect signal
    const fetchMock = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          if (init.signal.aborted) {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          } else {
            init.signal.addEventListener("abort", () => {
              const error = new Error("The operation was aborted");
              error.name = "AbortError";
              reject(error);
            });
          }
        }
      });
    });
    vi.spyOn(global, "fetch").mockImplementation(fetchMock);

    const actionPromise = t.action(internal.oauthHealthCheck.checkGoogleOAuthHealth, {});

    // Advance time by 11 seconds (timeout is 10s)
    await vi.advanceTimersByTimeAsync(11000);

    await actionPromise;

    const status = await t.query(internal.oauthHealthCheck.getHealthStatus);
    expect(status.isHealthy).toBe(false);
    expect(status.lastError).toContain("timed out");
  });
});

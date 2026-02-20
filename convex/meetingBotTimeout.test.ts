import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestUser } from "./testUtils";

describe("MeetingBot Timeout", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("BOT_SERVICE_URL", "https://bot-service.example.com");
    vi.stubEnv("BOT_SERVICE_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("should handle timeout when bot service hangs", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);

    // Mock fetch to simulate hanging and respecting AbortSignal
    global.fetch = vi.fn((_url, options: any) => {
      return new Promise((_resolve, reject) => {
        if (options?.signal) {
          if (options.signal.aborted) {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          } else {
            options.signal.addEventListener("abort", () => {
              const error = new Error("The operation was aborted");
              error.name = "AbortError";
              reject(error);
            });

            // Advance timers to trigger timeout inside the fetch call
            // This is necessary because t.action executes asynchronously and we can't
            // advance timers from the test body while the action is suspended on fetch.
            vi.advanceTimersByTime(31000);
          }
        }
        // Never resolve to simulate hang
      });
    }) as any;

    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        title: "Timeout Test",
        status: "scheduled",
        meetingUrl: "https://zoom.us/test",
        meetingPlatform: "zoom",
        scheduledStartTime: Date.now(),
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingBotJobs", {
        recordingId,
        meetingUrl: "https://zoom.us/test",
        scheduledTime: Date.now(),
        status: "queued",
        attempts: 0,
        maxAttempts: 1, // Set to 1 so it fails immediately
        updatedAt: Date.now(),
      });
    });

    // Start action
    const actionPromise = t.action(internal.meetingBot.notifyBotService, {
      jobId,
      recordingId,
      meetingUrl: "https://zoom.us/test",
      platform: "zoom",
    });

    // Wait for action to complete
    await actionPromise;

    // Verify job failure
    const job = await t.run(async (ctx) => ctx.db.get(jobId));
    expect(job?.status).toBe("failed");
    expect(job?.errorMessage).toMatch(/Timeout: Bot service request exceeded 30000ms/);

    // Verify recording failure
    const recording = await t.run(async (ctx) => ctx.db.get(recordingId));
    expect(recording?.status).toBe("failed");
  }, 20000);
});

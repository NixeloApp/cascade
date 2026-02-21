import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("MeetingBot Pending Jobs Starvation", () => {
  it("getPendingJobs should not starve urgent jobs when many future jobs exist", async () => {
    // Set the environment variable before creating the test context/running the query
    vi.stubEnv("BOT_SERVICE_API_KEY", "test-api-key");

    const t = convexTest(schema, modules);
    const { userId } = await createTestContext(t);

    const now = Date.now();
    const futureTime = now + 365 * 24 * 60 * 60 * 1000; // 1 year from now

    // 1. Create many future jobs (more than BOUNDED_LIST_LIMIT)
    // These will be returned first by the default index scan (by _id/creation time)
    // if we don't have a specific index for time.
    const futureJobsCount = BOUNDED_LIST_LIMIT + 50;

    await t.run(async (ctx) => {
      // Batch insert for speed
      await Promise.all(
        Array.from({ length: futureJobsCount }).map(async (_, i) => {
          const recordingId = await ctx.db.insert("meetingRecordings", {
            meetingUrl: `https://zoom.us/j/future-${i}`,
            meetingPlatform: "zoom",
            title: `Future Meeting ${i}`,
            status: "scheduled",
            scheduledStartTime: futureTime,
            botName: "Bot",
            createdBy: userId,
            isPublic: false,
            updatedAt: now,
          });

          await ctx.db.insert("meetingBotJobs", {
            recordingId,
            meetingUrl: `https://zoom.us/j/future-${i}`,
            scheduledTime: futureTime,
            status: "pending",
            attempts: 0,
            maxAttempts: 3,
            updatedAt: now,
          });
        }),
      );
    });

    // 2. Create one urgent job scheduled for NOW
    // This job is created LATER, so it has a higher _id.
    // Without a time-based index, a scan by _creationTime (default) or by_status (which uses _creationTime)
    // will see the future jobs first and fill the buffer (take(100)).
    // The urgent job will be missed.
    await t.run(async (ctx) => {
      const recordingId = await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/urgent",
        meetingPlatform: "zoom",
        title: "Urgent Meeting",
        status: "scheduled",
        scheduledStartTime: now,
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: now,
      });

      await ctx.db.insert("meetingBotJobs", {
        recordingId,
        meetingUrl: "https://zoom.us/j/urgent",
        scheduledTime: now,
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        updatedAt: now,
      });
    });

    // 3. Call getPendingJobs
    const pendingJobs = await t.query(api.meetingBot.getPendingJobs, {
      apiKey: "test-api-key",
    });

    // 4. Assert
    // We expect the urgent job to be found.
    const urgentJob = pendingJobs.find((j) => j.meetingUrl === "https://zoom.us/j/urgent");

    // NOTE: This assertion will FAIL if the bug exists.
    expect(urgentJob).toBeDefined();

    // Ensure we filtered correctly
    expect(pendingJobs.length).toBeGreaterThan(0);
    // All returned jobs should be scheduled soon (within 5 mins)
    for (const job of pendingJobs) {
      expect(job.scheduledTime).toBeLessThanOrEqual(now + 5 * 60 * 1000);
    }
  });
});

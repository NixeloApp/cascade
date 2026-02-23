import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { DAY } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";

describe("MeetingBot Pending Jobs", () => {
  it("getPendingJobs should not be starved by future jobs", async () => {
    // Stub the API key required by getPendingJobs
    vi.stubEnv("BOT_SERVICE_API_KEY", "test-api-key");

    const t = convexTest(schema, modules);

    // Create many "future" pending jobs (scheduled for next year)
    // BOUNDED_LIST_LIMIT is 100, so we create more than that to fill the first page
    const futureTime = Date.now() + 365 * DAY;

    // Use run to insert directly to avoid auth checks for this setup
    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        name: "Test User",
        email: "test@example.com",
      });

      // Create a dummy recording for linking
      const recordingId = await ctx.db.insert("meetingRecordings", {
        title: "Future Meeting",
        status: "scheduled",
        botName: "Bot",
        createdBy: userId,
        updatedAt: Date.now(),
        isPublic: false,
        meetingPlatform: "zoom", // Required field
      });

      // Insert 110 future jobs
      await Promise.all(
        Array.from({ length: 110 }, () =>
          ctx.db.insert("meetingBotJobs", {
            recordingId,
            meetingUrl: "https://zoom.us/future",
            scheduledTime: futureTime,
            status: "pending",
            attempts: 0,
            maxAttempts: 3,
            updatedAt: Date.now(),
          }),
        ),
      );
    });

    // Create 1 "urgent" pending job (scheduled for now)
    const now = Date.now();
    const urgentJobId = await t.run(async (ctx) => {
      // biome-ignore lint/style/noNonNullAssertion: testing convenience
      const userId = (await ctx.db.query("users").first())!._id;
      const recordingId = await ctx.db.insert("meetingRecordings", {
        title: "Urgent Meeting",
        status: "scheduled",
        botName: "Bot",
        createdBy: userId,
        updatedAt: now,
        isPublic: false,
        meetingPlatform: "zoom", // Required field
      });

      return await ctx.db.insert("meetingBotJobs", {
        recordingId,
        meetingUrl: "https://zoom.us/urgent",
        scheduledTime: now, // Ready now
        status: "pending",
        attempts: 0,
        maxAttempts: 3,
        updatedAt: now,
      });
    });

    // Call getPendingJobs
    const jobs = await t.query(api.meetingBot.getPendingJobs, {
      apiKey: "test-api-key",
    });

    // Assert that the urgent job is returned
    // If the query is unoptimized (fetching by status only), it will fetch the first 100 future jobs
    // and filter them out, returning empty list or missing the urgent job if it's not in the first 100.
    const found = jobs.some((job) => job._id === urgentJobId);

    expect(found).toBe(true);
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("MeetingBot", () => {
  it("scheduleRecording creates a recording and job", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const futureTime = Date.now() + 100000;
    const meetingUrl = "https://zoom.us/j/123";
    const title = "Test Meeting";
    const meetingPlatform = "zoom";

    const recordingId = await asUser.mutation(api.meetingBot.scheduleRecording, {
      meetingUrl,
      title,
      meetingPlatform,
      scheduledStartTime: futureTime,
      isPublic: false,
    });

    const recording = await t.run(async (ctx) => ctx.db.get(recordingId));
    expect(recording).toMatchObject({
      title,
      status: "scheduled",
      meetingUrl,
      meetingPlatform,
      scheduledStartTime: futureTime,
    });

    const job = await t.run(async (ctx) =>
      ctx.db
        .query("meetingBotJobs")
        .withIndex("by_recording", (q) => q.eq("recordingId", recordingId))
        .first(),
    );
    expect(job).toMatchObject({
      status: "pending",
      scheduledTime: futureTime,
      recordingId,
      meetingUrl,
    });
  });
});

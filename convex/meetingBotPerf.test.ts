import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("MeetingBot Performance", () => {
  it("listRecordings correctly sets flags based on status without fetching heavy data", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId } = await createTestContext(t);

    // Create recordings in various states
    // 1. Scheduled (no transcript, no summary)
    await t.run(async (ctx) => {
      await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/1",
        meetingPlatform: "zoom",
        title: "Scheduled Meeting",
        status: "scheduled",
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
      });
    });

    // 2. Summarizing (has transcript, no summary)
    await t.run(async (ctx) => {
      const recordingId = await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/2",
        meetingPlatform: "zoom",
        title: "Summarizing Meeting",
        status: "summarizing",
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
      });
      // Insert transcript to mimic real flow (though optimization won't check it)
      await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Some transcript text...",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 100,
      });
    });

    // 3. Completed (has transcript, has summary)
    await t.run(async (ctx) => {
      const recordingId = await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/3",
        meetingPlatform: "zoom",
        title: "Completed Meeting",
        status: "completed",
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
      });
      // Insert transcript
      const transcriptId = await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Some transcript text...",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 100,
      });
      // Insert summary
      await ctx.db.insert("meetingSummaries", {
        recordingId,
        transcriptId,
        executiveSummary: "Summary...",
        keyPoints: [],
        actionItems: [],
        decisions: [],
        openQuestions: [],
        topics: [],
        modelUsed: "gpt-4",
      });
    });

    // 4. Failed (no transcript, no summary - standard assumption)
    await t.run(async (ctx) => {
      await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/4",
        meetingPlatform: "zoom",
        title: "Failed Meeting",
        status: "failed",
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
        errorMessage: "Something went wrong",
      });
    });

    // Call listRecordings
    const recordings = await asUser.query(api.meetingBot.listRecordings, {});

    // Verify
    expect(recordings).toHaveLength(4);

    const scheduled = recordings.find((r) => r.status === "scheduled");
    expect(scheduled).toBeDefined();
    expect(scheduled?.hasTranscript).toBe(false);
    expect(scheduled?.hasSummary).toBe(false);

    const summarizing = recordings.find((r) => r.status === "summarizing");
    expect(summarizing).toBeDefined();
    // In current implementation (before fix), this should be true because we inserted transcript
    expect(summarizing?.hasTranscript).toBe(true);
    expect(summarizing?.hasSummary).toBe(false);

    const completed = recordings.find((r) => r.status === "completed");
    expect(completed).toBeDefined();
    // In current implementation (before fix), this should be true because we inserted transcript and summary
    expect(completed?.hasTranscript).toBe(true);
    expect(completed?.hasSummary).toBe(true);

    const failed = recordings.find((r) => r.status === "failed");
    expect(failed).toBeDefined();
    expect(failed?.hasTranscript).toBe(false);
    expect(failed?.hasSummary).toBe(false);

    // 5. Failed but has transcript (e.g. failed during summary)
    await t.run(async (ctx) => {
      const recordingId = await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/5",
        meetingPlatform: "zoom",
        title: "Failed during Summary",
        status: "failed",
        botName: "Bot",
        createdBy: userId,
        isPublic: false,
        updatedAt: Date.now(),
        errorMessage: "Summary generation failed",
      });
      // Insert transcript
      await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Some transcript text...",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 100,
      });
    });

    // Call listRecordings again
    const recordings2 = await asUser.query(api.meetingBot.listRecordings, {});
    const failedWithTranscript = recordings2.find((r) => r.title === "Failed during Summary");
    expect(failedWithTranscript).toBeDefined();
    // New behavior: false because status is 'failed', avoiding DB lookup
    expect(failedWithTranscript?.hasTranscript).toBe(false);
  });
});

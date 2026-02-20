import { convexTest } from "convex-test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("MeetingBot Performance", () => {
  const originalApiKey = process.env.BOT_SERVICE_API_KEY;

  beforeAll(() => {
    process.env.BOT_SERVICE_API_KEY = "test-api-key";
  });

  afterAll(() => {
    process.env.BOT_SERVICE_API_KEY = originalApiKey;
  });

  it("listRecordings returns correct hasTranscript/hasSummary based on status", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    // Create recordings in different states
    const scheduledId = await asUser.mutation(api.meetingBot.scheduleRecording, {
      meetingUrl: "https://zoom.us/j/1",
      title: "Scheduled Meeting",
      meetingPlatform: "zoom",
      scheduledStartTime: Date.now() + 100000,
    });

    const summarizingId = await asUser.mutation(api.meetingBot.startRecordingNow, {
      meetingUrl: "https://zoom.us/j/2",
      title: "Summarizing Meeting",
      meetingPlatform: "zoom",
    });

    // Simulate transcript created -> status becomes summarizing
    await t.mutation(api.meetingBot.saveTranscript, {
      apiKey: "test-api-key",
      recordingId: summarizingId,
      fullText: "Transcript text",
      segments: [],
      language: "en",
      modelUsed: "whisper",
      wordCount: 100,
    });

    const completedId = await asUser.mutation(api.meetingBot.startRecordingNow, {
      meetingUrl: "https://zoom.us/j/3",
      title: "Completed Meeting",
      meetingPlatform: "zoom",
    });

    // Simulate transcript and summary created -> status becomes completed
    const transcriptId = await t.mutation(api.meetingBot.saveTranscript, {
      apiKey: "test-api-key",
      recordingId: completedId,
      fullText: "Transcript text",
      segments: [],
      language: "en",
      modelUsed: "whisper",
      wordCount: 100,
    });

    await t.mutation(api.meetingBot.saveSummary, {
      apiKey: "test-api-key",
      recordingId: completedId,
      transcriptId,
      executiveSummary: "Summary",
      keyPoints: [],
      actionItems: [],
      decisions: [],
      openQuestions: [],
      topics: [],
      modelUsed: "gpt-4",
    });

    // Verify listRecordings
    const recordings = await asUser.query(api.meetingBot.listRecordings, {});

    // Find recordings
    const scheduled = recordings.find((r) => r._id === scheduledId);
    const summarizing = recordings.find((r) => r._id === summarizingId);
    const completed = recordings.find((r) => r._id === completedId);

    expect(scheduled).toBeDefined();
    expect(scheduled?.hasTranscript).toBe(false);
    expect(scheduled?.hasSummary).toBe(false);

    expect(summarizing).toBeDefined();
    expect(summarizing?.hasTranscript).toBe(true);
    expect(summarizing?.hasSummary).toBe(false);

    expect(completed).toBeDefined();
    expect(completed?.hasTranscript).toBe(true);
    expect(completed?.hasSummary).toBe(true);
  });
});

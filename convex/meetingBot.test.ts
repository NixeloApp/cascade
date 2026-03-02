import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot", () => {
  it("scheduleRecording creates a recording and job", async () => {
    const t = convexTest(schema, modules);
    const { asUser } = await createTestContext(t);

    const futureTime = Date.now() + 100000;
    const meetingUrl = "https://zoom.us/j/123";
    const title = "Test Meeting";
    const meetingPlatform = "zoom";

    const { recordingId } = await asUser.mutation(api.meetingBot.scheduleRecording, {
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

  it("createIssueFromActionItem creates an issue and links it to the action item", async () => {
    const t = convexTest(schema, modules);
    const { asUser, userId, organizationId } = await createTestContext(t);

    // Setup: Create a project
    const projectId = await createProjectInOrganization(t, userId, organizationId, {
      name: "Test Project",
      key: "TEST",
    });

    // Setup: Create a recording
    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/123",
        meetingPlatform: "zoom",
        title: "Meeting with Action Items",
        status: "completed",
        botName: "Bot",
        createdBy: userId,
        projectId,
        isPublic: false,
        updatedAt: Date.now(),
      });
    });

    // Setup: Create a transcript (required for summary foreign key)
    const transcriptId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Some text",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 10,
      });
    });

    // Setup: Create a summary with an action item
    const actionItemDescription = "Fix the critical bug";
    const summaryId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingSummaries", {
        recordingId,
        transcriptId,
        executiveSummary: "Summary",
        keyPoints: [],
        actionItems: [
          {
            description: actionItemDescription,
            assigneeUserId: userId,
            priority: "high",
          },
        ],
        decisions: [],
        openQuestions: [],
        topics: [],
        modelUsed: "gpt-4",
      });
    });

    // Act: Create issue from the action item (index 0)
    const { issueId } = await asUser.mutation(api.meetingBot.createIssueFromActionItem, {
      summaryId,
      actionItemIndex: 0,
      projectId,
    });

    // Assert: Issue created correctly
    const issue = await t.run(async (ctx) => ctx.db.get(issueId));
    expect(issue).toMatchObject({
      projectId,
      title: actionItemDescription,
      assigneeId: userId,
      priority: "high",
      reporterId: userId,
      key: "TEST-1", // Assuming it's the first issue in the project
    });

    // Assert: Summary updated with issue link
    const updatedSummary = await t.run(async (ctx) => ctx.db.get(summaryId));
    expect(updatedSummary?.actionItems[0].issueCreated).toEqual(issueId);
  });
});

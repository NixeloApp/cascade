
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot Security Reproduction", () => {
  it("VULNERABILITY: Attacker CANNOT modify public summary by linking issue from their own project", async () => {
    const t = convexTest(schema, modules);

    // Victim setup
    const {
      userId: victimId,
      organizationId: victimOrgId,
    } = await createTestContext(t);

    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/123",
        meetingPlatform: "zoom",
        title: "Victim Public Meeting",
        status: "completed",
        botName: "Bot",
        createdBy: victimId,
        projectId: undefined,
        isPublic: true, // Public recording
        updatedAt: Date.now(),
      });
    });

    const transcriptId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Public transcript",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 10,
      });
    });

    const summaryId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingSummaries", {
        recordingId,
        transcriptId,
        executiveSummary: "Public Summary",
        keyPoints: [],
        actionItems: [
          {
            description: "Action Item",
            assigneeUserId: victimId,
            priority: "high",
          },
        ],
        decisions: [],
        openQuestions: [],
        topics: [],
        modelUsed: "gpt-4",
      });
    });

    // Attacker setup
    const {
        asUser: asAttacker,
        userId: attackerId,
        organizationId: attackerOrgId,
    } = await createTestContext(t);

    // Attacker has their own project
    const attackerProject = await createProjectInOrganization(t, attackerId, attackerOrgId, {
      name: "Attacker Project",
      key: "ATT",
      isPublic: false,
    });

    // Act: Attacker attempts to create issue using victim's summary and attacker's project
    // This should now FAIL with "Not authorized"
    await expect(async () => {
      await asAttacker.mutation(api.meetingBot.createIssueFromActionItem, {
        summaryId,
        actionItemIndex: 0,
        projectId: attackerProject,
      });
    }).rejects.toThrow(/Not authorized/);

    // Verify the summary was NOT modified
    const updatedSummary = await t.run(async (ctx) => {
        return await ctx.db.get(summaryId);
    });

    // The summary should still be unmodified (no issueCreated link)
    expect(updatedSummary?.actionItems[0].issueCreated).toBeUndefined();
  });
});

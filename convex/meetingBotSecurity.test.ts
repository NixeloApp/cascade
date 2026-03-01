import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot Security", () => {
  it("should prevent assigning issues to users outside the organization", async () => {
    const t = convexTest(schema, modules);

    // Create User A in Org A
    const {
      asUser: asUserA,
      userId: userIdA,
      organizationId: organizationIdA,
    } = await createTestContext(t);

    // Create User B in Org B (separate organization)
    const { userId: userIdB } = await createTestContext(t);

    // Setup: User A creates a project in Org A
    const projectIdA = await createProjectInOrganization(t, userIdA, organizationIdA, {
      name: "Project A",
      key: "PROJA",
    });

    // Setup: User A creates a recording (orphaned, no project, but owned by User A)
    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/123",
        meetingPlatform: "zoom",
        title: "Meeting with External Assignee",
        status: "completed",
        botName: "Bot",
        createdBy: userIdA,
        // No project ID - orphaned recording
        isPublic: false,
        updatedAt: Date.now(),
      });
    });

    // Setup: Create a transcript
    const transcriptId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Transcript",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 10,
      });
    });

    // Setup: Create a summary with an action item assigned to User B (who is in Org B)
    const summaryId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingSummaries", {
        recordingId,
        transcriptId,
        executiveSummary: "Summary",
        keyPoints: [],
        actionItems: [
          {
            description: "Task for external user",
            assigneeUserId: userIdB, // This user is NOT in Org A
            priority: "medium",
          },
        ],
        decisions: [],
        openQuestions: [],
        topics: [],
        modelUsed: "gpt-4",
      });
    });

    // Act & Assert: Attempt to create issue from the action item
    // This SHOULD fail because userIdB is not in organizationIdA
    await expect(
      asUserA.mutation(api.meetingBot.createIssueFromActionItem, {
        summaryId,
        actionItemIndex: 0,
        projectId: projectIdA,
      }),
    ).rejects.toThrow(/User must be an organization member/);
  });
});

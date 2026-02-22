import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot Security", () => {
  it("VULNERABILITY: Unauthorized user can create issue from private summary in private project", async () => {
    const t = convexTest(schema, modules);

    // Victim setup
    const {
      asUser: asVictim,
      userId: victimId,
      organizationId: victimOrgId,
    } = await createTestContext(t);

    const victimProject = await createProjectInOrganization(t, victimId, victimOrgId, {
      name: "Victim Project",
      key: "VIC",
      isPublic: false,
    });

    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/123",
        meetingPlatform: "zoom",
        title: "Victim Private Meeting",
        status: "completed",
        botName: "Bot",
        createdBy: victimId,
        projectId: victimProject,
        isPublic: false,
        updatedAt: Date.now(),
      });
    });

    const transcriptId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "Private transcript",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 10,
      });
    });

    const actionItemDescription = "Leaked Action Item";
    const summaryId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingSummaries", {
        recordingId,
        transcriptId,
        executiveSummary: "Private Summary",
        keyPoints: [],
        actionItems: [
          {
            description: actionItemDescription,
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
    const { asUser: asAttacker } = await createTestContext(t);

    // Act: Attacker attempts to create issue using victim's summary and victim's project
    // This should now fail with the security fix
    await expect(async () => {
      await asAttacker.mutation(api.meetingBot.createIssueFromActionItem, {
        summaryId,
        actionItemIndex: 0,
        projectId: victimProject,
      });
    }).rejects.toThrow(/Not authorized to edit this recording summary/);

    // Verify no issue was created
    const issues = await t.run(async (ctx) =>
      ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", victimProject))
        .collect(),
    );
    expect(issues.length).toBe(0);
  });

  it("VULNERABILITY: User with read access to summary but NO project write access cannot create issue", async () => {
    const t = convexTest(schema, modules);

    // Victim setup (Project Owner)
    const {
      asUser: asVictim,
      userId: victimId,
      organizationId: victimOrgId,
    } = await createTestContext(t);

    const victimProject = await createProjectInOrganization(t, victimId, victimOrgId, {
      name: "Victim Project",
      key: "VIC",
      isPublic: false,
    });

    // Attacker setup (has access to recording via public flag, but NOT to project)
    const { asUser: asAttacker } = await createTestContext(t);

    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/123",
        meetingPlatform: "zoom",
        title: "Public Meeting",
        status: "completed",
        botName: "Bot",
        createdBy: victimId,
        projectId: undefined,
        isPublic: true, // Attacker can see this
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

    // Act: Attacker attempts to create issue in victim's private project using public summary
    // This should fail because attacker is not an editor of the project
    await expect(async () => {
      await asAttacker.mutation(api.meetingBot.createIssueFromActionItem, {
        summaryId,
        actionItemIndex: 0,
        projectId: victimProject,
      });
    }).rejects.toThrow(/Not authorized/);

    // Verify no issue was created
    const issues = await t.run(async (ctx) =>
      ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", victimProject))
        .collect(),
    );
    expect(issues.length).toBe(0);
  });
});

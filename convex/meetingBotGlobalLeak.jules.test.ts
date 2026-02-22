import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("MeetingBot Global Leak Vulnerability", () => {
  it("REPRO: User from Org B can access Public Orphan Recording from Org A", async () => {
    const t = convexTest(schema, modules);

    // 1. Setup User A in Org A
    const { asUser: asUserA, userId: userAId, organizationId: orgAId } = await createTestContext(t);

    // 2. Setup User B in Org B (completely separate tenant)
    const { asUser: asUserB, userId: userBId, organizationId: orgBId } = await createTestContext(t);

    // Ensure they are in different organizations
    expect(orgAId).not.toBe(orgBId);

    // 3. User A creates a "Public" recording WITHOUT a project (Orphan)
    // This simulates a user mistakenly thinking "Public" means "Public to my Org"
    // or just checking the box without selecting a project.
    const recordingId = await t.run(async (ctx) => {
      return await ctx.db.insert("meetingRecordings", {
        meetingUrl: "https://zoom.us/j/secret-meeting",
        meetingPlatform: "zoom",
        title: "CEO Secret Strategy Meeting",
        status: "completed",
        botName: "Bot",
        createdBy: userAId,
        projectId: undefined, // ORPHANED
        isPublic: true, // FLAGGED AS PUBLIC
        updatedAt: Date.now(),
      });
    });

    // Add some sensitive data (transcript)
    await t.run(async (ctx) => {
      return await ctx.db.insert("meetingTranscripts", {
        recordingId,
        fullText: "This is the secret acquisition target: Company X.",
        segments: [],
        language: "en",
        modelUsed: "whisper",
        wordCount: 10,
      });
    });

    // 4. User B attempts to access the recording transcript
    // EXPECTED BEHAVIOR: Access DENIED (Forbidden) because orphaned recordings are restricted to creator.
    await expect(async () => {
      await asUserB.query(api.meetingBot.getTranscript, {
        recordingId,
      });
    }).rejects.toThrow(/Not authorized/);
  });
});

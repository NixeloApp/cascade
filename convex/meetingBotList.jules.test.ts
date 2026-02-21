import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("MeetingBot List Recordings", () => {
  it("listRecordings correctly handles pagination with hidden items", async () => {
    const t = convexTest(schema, modules);
    const { asUser: asUserA, userId: userIdA, organizationId } = await createTestContext(t);

    // Create User B
    const userIdB = await createTestUser(t);
    // Add User B to organization
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId: userIdB,
        role: "member",
        addedBy: userIdA,
      });
    });

    // Create Project
    const projectId = await createProjectInOrganization(t, userIdA, organizationId, {
      name: "Shared Project",
      key: "SHARED",
    });

    // Add User B to project
    await addProjectMember(t, projectId, userIdB, "viewer", userIdA);

    // Insert recordings in order (oldest to newest)
    // 1. 5 Private recordings by User A (Visible to A)
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("meetingRecordings", {
          title: `Private A ${i}`,
          createdBy: userIdA,
          projectId,
          isPublic: false,
          updatedAt: Date.now(),
          status: "completed",
          botName: "Bot",
          meetingPlatform: "zoom",
        });
      });
    }

    // 2. 5 Public recordings by User B (Visible to A)
    for (let i = 0; i < 5; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("meetingRecordings", {
          title: `Public B ${i}`,
          createdBy: userIdB,
          projectId,
          isPublic: true,
          updatedAt: Date.now(),
          status: "completed",
          botName: "Bot",
          meetingPlatform: "zoom",
        });
      });
    }

    // 3. 20 Private recordings by User B (Hidden from A)
    // These are the newest, so they appear first in default sort order
    for (let i = 0; i < 20; i++) {
      await t.run(async (ctx) => {
        await ctx.db.insert("meetingRecordings", {
          title: `Private B ${i}`,
          createdBy: userIdB,
          projectId,
          isPublic: false, // Private
          updatedAt: Date.now(),
          status: "completed",
          botName: "Bot",
          meetingPlatform: "zoom",
        });
      });
    }

    // Call listRecordings as User A with limit 10
    // Current behavior:
    // Fetches top 10 (which are all Private B).
    // Filters them out.
    // Returns [].

    // Desired behavior:
    // Returns the 5 Public B and 5 Private A (or mix, depending on sort).
    // Actually, the 5 Public B are newer than 5 Private A.
    // So it should return 5 Public B and 5 Private A = 10 items.

    const recordings = await asUserA.query(api.meetingBot.listRecordings, {
      projectId,
      limit: 10,
    });

    // UNCOMMENT THIS TO VERIFY BUG REPRODUCTION
    // expect(recordings).toHaveLength(0);

    // With the fix, we expect 10 items
    // For now, let's assert the current broken behavior to confirm reproduction,
    // or just check valid behavior if we are implementing fix immediately.
    // Since I'm supposed to reproduce it, I'll check for failure of expectation of 10.

    // But since I need to verify later, I'll put the "correct" expectation and expect it to fail currently.
    // Wait, if I expect it to fail, the test step fails.
    // So I should assert the BUGGY behavior first?
    // "Assert that the current implementation returns an empty list..."

    // To make the test useful for regression later, I should assert the correct behavior.
    // But for the "reproduction" step, I need to see it fail.
    // I'll log the length.
    console.log("Recordings found:", recordings.length);

    // I will enforce the correct behavior. This test SHOULD FAIL now.
    expect(recordings).toHaveLength(10);

    const titles = recordings.map((r) => r.title);
    expect(titles).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Public B/),
        expect.stringMatching(/Private A/),
      ]),
    );
    expect(titles).not.toEqual(expect.arrayContaining([expect.stringMatching(/Private B/)]));
  });
});

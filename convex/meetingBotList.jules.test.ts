import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createProjectInOrganization, createTestContext } from "./testUtils";

describe("MeetingBot List", () => {
  it("listRecordings correctly merges public and private recordings", async () => {
    const t = convexTest(schema, modules);

    // Create User A (The viewer)
    const {
      asUser: asUserA,
      userId: userAId,
      organizationId,
    } = await createTestContext(t, { name: "User A" });

    // Create User B (The creator of private content)
    const { userId: userBId, asUser: asUserB_Accessor } = await createTestContext(t, {
      name: "User B",
    });

    // Create a project in User A's org
    const projectId = await createProjectInOrganization(t, userAId, organizationId, {
      name: "Shared Project",
      key: "SHARED",
      isPublic: false,
    });

    // Make User B a member of the project
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId,
        userId: userBId,
        role: "editor",
        addedBy: userAId,
      });
    });

    // 1. Create 1 public recording by User B (Oldest)
    // We want this to be the target we find.
    const { recordingId: publicRecIdB } = await asUserB_Accessor.mutation(
      api.meetingBot.scheduleRecording,
      {
        title: "Public Recording B",
        meetingUrl: "https://zoom.us/j/publicB",
        meetingPlatform: "zoom",
        scheduledStartTime: Date.now() - 100000,
        projectId,
        isPublic: true,
      },
    );

    // 2. Create 20 private recordings by User B (Newer)
    // These should clutter the "by_project" index if scanned sequentially (descending)
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        asUserB_Accessor.mutation(api.meetingBot.scheduleRecording, {
          title: `Private Recording ${i}`,
          meetingUrl: `https://zoom.us/j/priv${i}`,
          meetingPlatform: "zoom",
          scheduledStartTime: Date.now() + i * 1000, // Newer
          projectId,
          isPublic: false, // Private
        }),
      ),
    );

    // Act: User A lists recordings with limit=10
    // Currently (with the bug), this fetches the latest 20 from DB (which are B's private ones).
    // All 20 are filtered out because they are private to B.
    // Result: 0 items.
    // Expected (with fix): Should find the public recording by B.

    const recordings = await asUserA.query(api.meetingBot.listRecordings, {
      projectId,
      limit: 10,
    });

    expect(recordings.length).toBeGreaterThan(0);
    const found = recordings.find((r) => r._id === publicRecIdB);
    expect(found).toBeDefined();
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { createTestContext } from "./testUtils";

describe("Users Perf Optimization", () => {
  it("should return auth profile when users share an organization (optimized path)", async () => {
    const t = convexTest(schema, modules);

    // 1. Create Viewer (in Org A)
    const ctxViewer = await createTestContext(t, { name: "Viewer" });
    const viewerId = ctxViewer.userId;
    const orgAId = ctxViewer.organizationId;

    // 2. Create Target (in Org B first, then add to Org A)
    const targetEmail = "target@example.com";
    const ctxTarget = await createTestContext(t, { name: "Target", email: targetEmail });
    const targetId = ctxTarget.userId;
    const orgBId = ctxTarget.organizationId; // Target's own org

    // Add Target to Org A (shared context)
    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: orgAId,
        userId: targetId,
        role: "member",
        addedBy: viewerId,
      });
    });

    // 3. Verify Viewer can see Target's email (auth profile)
    // This exercises the `getUser` shared organization check
    const targetProfile = await ctxViewer.asUser.query(api.users.getUser, { id: targetId });

    expect(targetProfile).not.toBeNull();
    // Email should be visible if shared context is found
    expect(targetProfile?.email).toBeDefined();
    expect(targetProfile?.email).toBe(targetEmail);

    // 4. Verify accessing non-shared user (sanity check)
    const ctxStranger = await createTestContext(t, { name: "Stranger" });
    const strangerId = ctxStranger.userId;

    const strangerProfile = await ctxViewer.asUser.query(api.users.getUser, { id: strangerId });
    expect(strangerProfile).not.toBeNull();
    // Email should be hidden (public profile)
    expect(strangerProfile?.email).toBeUndefined();
  });
});

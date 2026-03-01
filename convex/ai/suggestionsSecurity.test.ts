import { convexTest } from "convex-test";
import { describe, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser, expectThrowsAsync } from "../testUtils";

describe("AI Suggestions Security", () => {
  it("should prevent unauthenticated users from responding to suggestions", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const suggestionId = await t.run(async (ctx) => {
      return await ctx.db.insert("aiSuggestions", {
        userId,
        projectId,
        suggestionType: "issue_description",
        targetId: "test",
        suggestion: "test suggestion",
        modelUsed: "test",
        respondedAt: undefined,
        accepted: undefined,
        dismissed: undefined,
      });
    });

    // Attempt to respond without authentication
    await expectThrowsAsync(async () => {
      await t.mutation(api.ai.suggestions.respondToSuggestion, {
        suggestionId,
        accepted: true,
      });
    }, "Not authenticated");
  });

  it("should prevent unauthenticated users from fetching project labels", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    // Attempt to fetch labels without authentication
    await expectThrowsAsync(async () => {
      await t.query(api.ai.suggestions.getProjectLabels, {
        projectId,
      });
    }, "Not authenticated");
  });
});

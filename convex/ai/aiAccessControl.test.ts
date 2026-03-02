import { convexTest } from "convex-test";
import { describe, it } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { createTestProject, createTestUser, expectThrowsAsync } from "../testUtils";

describe("AI Access Control Security", () => {
  it("should prevent unauthorized users from creating chats for a project", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const projectId = await createTestProject(t, ownerId); // Private project

    const attackerId = await createTestUser(t);

    // Switch to attacker context
    const tAttacker = t.withIdentity({ subject: attackerId });

    await expectThrowsAsync(async () => {
      await tAttacker.mutation(api.ai.mutations.createChat, {
        projectId,
        title: "Hacked Chat",
      });
    }, "Not authorized"); // Expecting this to fail after fix
  });

  it("should prevent unauthorized users from creating suggestions for a project", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const projectId = await createTestProject(t, ownerId);

    const attackerId = await createTestUser(t);
    const tAttacker = t.withIdentity({ subject: attackerId });

    await expectThrowsAsync(async () => {
      await tAttacker.mutation(api.ai.mutations.createSuggestion, {
        projectId,
        suggestionType: "issue_description",
        targetId: "hack",
        suggestion: "bad suggestion",
        modelUsed: "test",
      });
    }, "Not authorized");
  });

  it("should prevent unauthorized users from fetching project suggestions", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const projectId = await createTestProject(t, ownerId);

    // Insert a suggestion as owner
    await t.run(async (ctx) => {
      await ctx.db.insert("aiSuggestions", {
        userId: ownerId,
        projectId,
        suggestionType: "issue_description",
        targetId: "secret",
        suggestion: "Secret Project Info",
        modelUsed: "test",
      });
    });

    const attackerId = await createTestUser(t);
    const tAttacker = t.withIdentity({ subject: attackerId });

    await expectThrowsAsync(async () => {
      await tAttacker.query(api.ai.queries.getProjectSuggestions, {
        projectId,
      });
    }, "Not authorized");
  });

  it("should prevent unauthorized users from accepting/dismissing suggestions", async () => {
    const t = convexTest(schema, modules);
    const ownerId = await createTestUser(t);
    const projectId = await createTestProject(t, ownerId);

    // Insert a suggestion
    const suggestionId = await t.run(async (ctx) => {
      return await ctx.db.insert("aiSuggestions", {
        userId: ownerId,
        projectId,
        suggestionType: "issue_description",
        targetId: "secret",
        suggestion: "Secret Project Info",
        modelUsed: "test",
      });
    });

    const attackerId = await createTestUser(t);
    const tAttacker = t.withIdentity({ subject: attackerId });

    // Try accept
    await expectThrowsAsync(async () => {
      await tAttacker.mutation(api.ai.mutations.acceptSuggestion, {
        suggestionId,
      });
    }, "Not authorized");

    // Try dismiss
    await expectThrowsAsync(async () => {
      await tAttacker.mutation(api.ai.mutations.dismissSuggestion, {
        suggestionId,
      });
    }, "Not authorized");
  });
});

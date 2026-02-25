import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Automation Rules Validation", () => {
  it("should throw validation error when creating rule with mismatched actionType and actionValue", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    await expect(async () => {
      await asUser.mutation(api.automationRules.create, {
        projectId,
        name: "Invalid Rule",
        trigger: "issue_created",
        // Mismatched: type is set_priority, value is for add_label
        actionType: "set_priority",
        actionValue: { type: "add_label", label: "oops" } as any,
      });
    }).rejects.toThrow(
      /actionType \\"set_priority\\" does not match actionValue.type \\"add_label\\"/,
    );
  });

  it("should throw validation error when updating actionType to mismatch existing actionValue", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // First create a valid rule
    const { ruleId } = await asUser.mutation(api.automationRules.create, {
      projectId,
      name: "Valid Rule",
      trigger: "issue_created",
      actionType: "set_priority",
      actionValue: { type: "set_priority", priority: "high" },
    });

    // Update actionType to "add_label" but leave actionValue as "set_priority"
    await expect(async () => {
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        actionType: "add_label",
      });
    }).rejects.toThrow(
      /actionType \\"add_label\\" does not match actionValue.type \\"set_priority\\"/,
    );
  });

  it("should throw validation error when updating actionValue to mismatch existing actionType", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const projectId = await createTestProject(t, userId);

    const asUser = asAuthenticatedUser(t, userId);

    // First create a valid rule
    const { ruleId } = await asUser.mutation(api.automationRules.create, {
      projectId,
      name: "Valid Rule",
      trigger: "issue_created",
      actionType: "set_priority",
      actionValue: { type: "set_priority", priority: "high" },
    });

    // Update actionValue to "add_label" type but leave actionType as "set_priority"
    await expect(async () => {
      await asUser.mutation(api.automationRules.update, {
        id: ruleId,
        actionValue: { type: "add_label", label: "oops" } as any,
      });
    }).rejects.toThrow(
      /actionType \\"set_priority\\" does not match actionValue.type \\"add_label\\"/,
    );
  });
});

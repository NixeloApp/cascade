import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("customFieldsSecurity", () => {
  it("should prevent setting a custom field from a different project on an issue", async () => {
    const t = convexTest(schema, modules);
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);

    // Create Project A
    const projectIdA = await createProjectInOrganization(t, userId, organizationId, {
      key: "PRJA",
    });

    // Create Project B
    const projectIdB = await createProjectInOrganization(t, userId, organizationId, {
      key: "PRJB",
    });

    const asUser = asAuthenticatedUser(t, userId);

    // Create a custom field in Project A
    const { fieldId: fieldIdA } = await asUser.mutation(api.customFields.create, {
      projectId: projectIdA,
      name: "Field A",
      fieldKey: "field_a",
      fieldType: "text",
      isRequired: false,
    });

    // Create an issue in Project B
    const issueIdB = await createTestIssue(t, projectIdB, userId);

    // Attempt to set a value for Field A on Issue B
    // This should FAIL because Field A belongs to Project A, but Issue B belongs to Project B
    await expect(
      asUser.mutation(api.customFields.setValue, {
        issueId: issueIdB,
        fieldId: fieldIdA,
        value: "Cross-project value",
      }),
    ).rejects.toThrow(/Field does not belong to the same project/);
  });
});

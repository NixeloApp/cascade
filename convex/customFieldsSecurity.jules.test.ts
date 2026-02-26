import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addProjectMember,
  asAuthenticatedUser,
  createOrganizationAdmin,
  createProjectInOrganization,
  createTestIssue,
  createTestUser,
} from "./testUtils";

describe("customFields security", () => {
  // Helper to set up a project with custom field context
  async function setupProject(t: ReturnType<typeof convexTest>) {
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);
    const asUser = asAuthenticatedUser(t, userId);
    return { userId, organizationId, projectId, asUser, t };
  }

  describe("remove", () => {
    it("should prevent non-admin from removing a custom field", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      // Admin creates a field
      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Admin Field",
        fieldKey: "admin_field",
        fieldType: "text",
        isRequired: false,
      });

      // Create an Editor user
      const editorId = await createTestUser(t, { name: "Editor" });
      await addProjectMember(t, projectId, editorId, "editor", userId);
      const asEditor = asAuthenticatedUser(t, editorId);

      // Attempt to remove as Editor (should fail)
      await expect(
        asEditor.mutation(api.customFields.remove, { id: fieldId })
      ).rejects.toThrow();

      // Verify field still exists
      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields.length).toBe(1);
    });
  });

  describe("removeValue", () => {
    it("should prevent viewer from removing a custom field value", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      // Admin creates a field
      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Status",
        fieldKey: "status",
        fieldType: "text",
        isRequired: false,
      });

      // Admin creates an issue and sets a value
      const issueId = await createTestIssue(t, projectId, userId);
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Active",
      });

      // Create a Viewer user
      const viewerId = await createTestUser(t, { name: "Viewer" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      // Attempt to remove value as Viewer (should fail)
      await expect(
        asViewer.mutation(api.customFields.removeValue, { issueId, fieldId })
      ).rejects.toThrow();

      // Verify value still exists
      const values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(1);
      expect(values[0].value).toBe("Active");
    });
  });

  describe("getValuesForIssue", () => {
    it("should return empty array for user without project access", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      // Admin creates a field
      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Secret",
        fieldKey: "secret",
        fieldType: "text",
        isRequired: false,
      });

      // Admin creates an issue and sets a value
      const issueId = await createTestIssue(t, projectId, userId);
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Classified",
      });

      // Create a random user (no project access)
      const strangerId = await createTestUser(t, { name: "Stranger" });
      const asStranger = asAuthenticatedUser(t, strangerId);

      // Attempt to get values as Stranger (should return empty array)
      const values = await asStranger.query(api.customFields.getValuesForIssue, { issueId });
      expect(values).toEqual([]);
    });
  });

  describe("setValue", () => {
    it("should prevent setting a custom field from a different project", async () => {
      const t = convexTest(schema, modules);
      const { projectId: projectAId, userId, asUser, organizationId } = await setupProject(t);

      // Create another project in the same organization
      const projectBId = await createProjectInOrganization(t, userId, organizationId, {
        key: "PROJB",
      });

      // Create field in Project A
      const { fieldId: fieldAId } = await asUser.mutation(api.customFields.create, {
        projectId: projectAId,
        name: "Field A",
        fieldKey: "field_a",
        fieldType: "text",
        isRequired: false,
      });

      // Create issue in Project B
      const issueBId = await createTestIssue(t, projectBId, userId);

      // Attempt to set Field A on Issue B (should fail)
      await expect(
        asUser.mutation(api.customFields.setValue, {
          issueId: issueBId,
          fieldId: fieldAId,
          value: "Invalid",
        }),
      ).rejects.toThrow(/Field does not belong to the same project/);
    });
  });
});

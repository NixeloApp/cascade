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

describe("customFields", () => {
  // Helper to set up a project with custom field context
  async function setupProject(t: ReturnType<typeof convexTest>) {
    const userId = await createTestUser(t);
    const { organizationId } = await createOrganizationAdmin(t, userId);
    const projectId = await createProjectInOrganization(t, userId, organizationId);
    const asUser = asAuthenticatedUser(t, userId);
    return { userId, organizationId, projectId, asUser, t };
  }

  describe("create", () => {
    it("should create a text custom field", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Customer Name",
        fieldKey: "customer_name",
        fieldType: "text",
        isRequired: false,
      });

      expect(fieldId).toBeDefined();

      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields.length).toBe(1);
      expect(fields[0].name).toBe("Customer Name");
      expect(fields[0].fieldKey).toBe("customer_name");
      expect(fields[0].fieldType).toBe("text");
    });

    it("should create a select field with options", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      const { fieldId: _fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Priority Level",
        fieldKey: "priority_level",
        fieldType: "select",
        options: ["Critical", "High", "Medium", "Low"],
        isRequired: true,
      });

      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields[0].options).toEqual(["Critical", "High", "Medium", "Low"]);
      expect(fields[0].isRequired).toBe(true);
    });

    it("should reject duplicate field keys", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Field 1",
        fieldKey: "same_key",
        fieldType: "text",
        isRequired: false,
      });

      await expect(
        asUser.mutation(api.customFields.create, {
          projectId,
          name: "Field 2",
          fieldKey: "same_key",
          fieldType: "number",
          isRequired: false,
        }),
      ).rejects.toThrow(/already exists/);
    });

    it("should support all field types", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      const types = ["text", "number", "select", "multiselect", "date", "checkbox", "url"] as const;

      for (const fieldType of types) {
        const { fieldId } = await asUser.mutation(api.customFields.create, {
          projectId,
          name: `${fieldType} Field`,
          fieldKey: `${fieldType}_field`,
          fieldType,
          options: fieldType === "select" || fieldType === "multiselect" ? ["A", "B"] : undefined,
          isRequired: false,
        });
        expect(fieldId).toBeDefined();
      }

      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields.length).toBe(types.length);
    });

    it("should reject non-admin users", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId } = await setupProject(t);

      const viewerId = await createTestUser(t, { name: "Viewer" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      await expect(
        asViewer.mutation(api.customFields.create, {
          projectId,
          name: "Should Fail",
          fieldKey: "should_fail",
          fieldType: "text",
          isRequired: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update field name and options", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Original Name",
        fieldKey: "field_key",
        fieldType: "select",
        options: ["A", "B"],
        isRequired: false,
      });

      await asUser.mutation(api.customFields.update, {
        id: fieldId,
        name: "Updated Name",
        options: ["A", "B", "C"],
        isRequired: true,
      });

      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields[0].name).toBe("Updated Name");
      expect(fields[0].options).toEqual(["A", "B", "C"]);
      expect(fields[0].isRequired).toBe(true);
    });

    it("should reject updates from non-admin", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Admin Field",
        fieldKey: "admin_field",
        fieldType: "text",
        isRequired: false,
      });

      const editorId = await createTestUser(t, { name: "Editor" });
      await addProjectMember(t, projectId, editorId, "editor", userId);
      const asEditor = asAuthenticatedUser(t, editorId);

      await expect(
        asEditor.mutation(api.customFields.update, {
          id: fieldId,
          name: "Hacked Name",
        }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("should delete field and all its values", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "To Delete",
        fieldKey: "to_delete",
        fieldType: "text",
        isRequired: false,
      });

      // Create an issue and set a value
      const issueId = await createTestIssue(t, projectId, userId);
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Test Value",
      });

      // Verify value exists
      let values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(1);

      // Delete field
      await asUser.mutation(api.customFields.remove, { id: fieldId });

      // Verify field and values are gone
      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields.length).toBe(0);

      values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(0);
    });
  });

  describe("setValue", () => {
    it("should set a text field value", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Notes",
        fieldKey: "notes",
        fieldType: "text",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Important note here",
      });

      const values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(1);
      expect(values[0].value).toBe("Important note here");
      expect(values[0].field?.name).toBe("Notes");
    });

    it("should update existing value", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Status",
        fieldKey: "status",
        fieldType: "text",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Original",
      });

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Updated",
      });

      const values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(1);
      expect(values[0].value).toBe("Updated");
    });

    it("should validate number fields", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Story Points",
        fieldKey: "story_points",
        fieldType: "number",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      // Valid number
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "42",
      });

      // Invalid number
      await expect(
        asUser.mutation(api.customFields.setValue, {
          issueId,
          fieldId,
          value: "not-a-number",
        }),
      ).rejects.toThrow(/valid number/);
    });

    it("should validate URL fields", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Documentation Link",
        fieldKey: "doc_link",
        fieldType: "url",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      // Valid URL
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "https://example.com/docs",
      });

      // Invalid URL
      await expect(
        asUser.mutation(api.customFields.setValue, {
          issueId,
          fieldId,
          value: "not-a-valid-url",
        }),
      ).rejects.toThrow(/valid URL/);
    });

    it("should validate select field options", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Environment",
        fieldKey: "environment",
        fieldType: "select",
        options: ["Development", "Staging", "Production"],
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      // Valid option
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Production",
      });

      // Invalid option
      await expect(
        asUser.mutation(api.customFields.setValue, {
          issueId,
          fieldId,
          value: "InvalidEnvironment",
        }),
      ).rejects.toThrow(/Invalid option/);
    });

    it("should validate multiselect field options", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Tags",
        fieldKey: "tags",
        fieldType: "multiselect",
        options: ["Frontend", "Backend", "DevOps"],
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      // Valid options
      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "Frontend,Backend",
      });

      // One invalid option
      await expect(
        asUser.mutation(api.customFields.setValue, {
          issueId,
          fieldId,
          value: "Frontend,InvalidTag",
        }),
      ).rejects.toThrow(/Invalid option/);
    });

    it("should require edit permission", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Notes",
        fieldKey: "notes",
        fieldType: "text",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      const viewerId = await createTestUser(t, { name: "Viewer" });
      await addProjectMember(t, projectId, viewerId, "viewer", userId);
      const asViewer = asAuthenticatedUser(t, viewerId);

      await expect(
        asViewer.mutation(api.customFields.setValue, {
          issueId,
          fieldId,
          value: "Should fail",
        }),
      ).rejects.toThrow();
    });
  });

  describe("removeValue", () => {
    it("should remove a custom field value", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Notes",
        fieldKey: "notes",
        fieldType: "text",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "To be removed",
      });

      let values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(1);

      await asUser.mutation(api.customFields.removeValue, {
        issueId,
        fieldId,
      });

      values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(0);
    });

    it("should handle removing non-existent value gracefully", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Notes",
        fieldKey: "notes",
        fieldType: "text",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      // Should not throw even if value doesn't exist
      await asUser.mutation(api.customFields.removeValue, {
        issueId,
        fieldId,
      });
    });
  });

  describe("getValuesForIssue", () => {
    it("should return all custom field values for an issue", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId: field1Id } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Field 1",
        fieldKey: "field_1",
        fieldType: "text",
        isRequired: false,
      });

      const { fieldId: field2Id } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Field 2",
        fieldKey: "field_2",
        fieldType: "number",
        isRequired: false,
      });

      const issueId = await createTestIssue(t, projectId, userId);

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId: field1Id,
        value: "Text Value",
      });

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId: field2Id,
        value: "123",
      });

      const values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values.length).toBe(2);
      expect(values.map((v) => v.value)).toContain("Text Value");
      expect(values.map((v) => v.value)).toContain("123");
    });

    it("should include field definitions in response", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      const { fieldId } = await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Priority",
        fieldKey: "priority",
        fieldType: "select",
        options: ["High", "Low"],
        isRequired: true,
        description: "Issue priority level",
      });

      const issueId = await createTestIssue(t, projectId, userId);

      await asUser.mutation(api.customFields.setValue, {
        issueId,
        fieldId,
        value: "High",
      });

      const values = await asUser.query(api.customFields.getValuesForIssue, { issueId });
      expect(values[0].field).toBeDefined();
      expect(values[0].field?.name).toBe("Priority");
      expect(values[0].field?.fieldType).toBe("select");
      expect(values[0].field?.options).toEqual(["High", "Low"]);
    });

    it("should return empty array for issue with no custom field values", async () => {
      const t = convexTest(schema, modules);
      const { projectId, userId, asUser } = await setupProject(t);

      // Create issue but don't set any custom field values
      const issueId = await createTestIssue(t, projectId, userId);

      const values = await asUser.query(api.customFields.getValuesForIssue, {
        issueId,
      });
      expect(values).toEqual([]);
    });
  });

  describe("list", () => {
    it("should list all fields for a project", async () => {
      const t = convexTest(schema, modules);
      const { projectId, asUser } = await setupProject(t);

      await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Field A",
        fieldKey: "field_a",
        fieldType: "text",
        isRequired: false,
      });

      await asUser.mutation(api.customFields.create, {
        projectId,
        name: "Field B",
        fieldKey: "field_b",
        fieldType: "number",
        isRequired: true,
      });

      const fields = await asUser.query(api.customFields.list, { projectId });
      expect(fields.length).toBe(2);
    });

    it("should only return fields for the specified project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const { organizationId } = await createOrganizationAdmin(t, userId);
      const project1Id = await createProjectInOrganization(t, userId, organizationId, {
        key: "PROJ1",
      });
      const project2Id = await createProjectInOrganization(t, userId, organizationId, {
        key: "PROJ2",
      });
      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.customFields.create, {
        projectId: project1Id,
        name: "Project 1 Field",
        fieldKey: "p1_field",
        fieldType: "text",
        isRequired: false,
      });

      await asUser.mutation(api.customFields.create, {
        projectId: project2Id,
        name: "Project 2 Field",
        fieldKey: "p2_field",
        fieldType: "text",
        isRequired: false,
      });

      const project1Fields = await asUser.query(api.customFields.list, { projectId: project1Id });
      expect(project1Fields.length).toBe(1);
      expect(project1Fields[0].name).toBe("Project 1 Field");

      const project2Fields = await asUser.query(api.customFields.list, { projectId: project2Id });
      expect(project2Fields.length).toBe(1);
      expect(project2Fields[0].name).toBe("Project 2 Field");
    });
  });
});

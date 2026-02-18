import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestContext, createTestUser } from "./testUtils";

describe("Document Templates", () => {
  const sampleContent = [
    {
      type: "heading",
      props: { level: 1 },
      content: [{ type: "text", text: "Sample Template" }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Template content here" }],
    },
  ];

  describe("create", () => {
    it("should create a document template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Test Template",
        description: "A test template",
        category: "general",
        icon: "📄",
        content: sampleContent,
        isPublic: false,
      });

      expect(templateId).toBeDefined();

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });
      expect(template?.name).toBe("Test Template");
      expect(template?.category).toBe("general");
      expect(template?.isBuiltIn).toBe(false);
    });

    it("should create a public template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Public Template",
        category: "shared",
        icon: "🌐",
        content: sampleContent,
        isPublic: true,
      });

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });
      expect(template?.isPublic).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(
        t.mutation(api.documentTemplates.create, {
          name: "Test",
          category: "general",
          icon: "📄",
          content: sampleContent,
          isPublic: false,
        }),
      ).rejects.toThrow(/authenticated/i);
    });
  });

  describe("list", () => {
    it("should list user's own templates", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.documentTemplates.create, {
        name: "My Template 1",
        category: "personal",
        icon: "📝",
        content: sampleContent,
        isPublic: false,
      });

      await asUser.mutation(api.documentTemplates.create, {
        name: "My Template 2",
        category: "personal",
        icon: "📋",
        content: sampleContent,
        isPublic: false,
      });

      const templates = await asUser.query(api.documentTemplates.list, {});

      expect(templates.length).toBeGreaterThanOrEqual(2);
      expect(templates.some((t) => t.name === "My Template 1")).toBe(true);
      expect(templates.some((t) => t.name === "My Template 2")).toBe(true);
    });

    it("should filter by category", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.documentTemplates.create, {
        name: "Engineering Template",
        category: "engineering",
        icon: "⚙️",
        content: sampleContent,
        isPublic: false,
      });

      await asUser.mutation(api.documentTemplates.create, {
        name: "Meeting Template",
        category: "meeting",
        icon: "📅",
        content: sampleContent,
        isPublic: false,
      });

      const engineeringTemplates = await asUser.query(api.documentTemplates.list, {
        category: "engineering",
      });

      expect(engineeringTemplates.every((t) => t.category === "engineering")).toBe(true);
    });

    it("should include public templates from other users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      // User 1 creates a public template
      await asUser1.mutation(api.documentTemplates.create, {
        name: "User1 Public Template",
        category: "shared",
        icon: "🌍",
        content: sampleContent,
        isPublic: true,
      });

      // User 2 should see it
      const templates = await asUser2.query(api.documentTemplates.list, {});
      expect(templates.some((t) => t.name === "User1 Public Template")).toBe(true);
    });

    it("should not include private templates from other users", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      // User 1 creates a private template
      await asUser1.mutation(api.documentTemplates.create, {
        name: "User1 Private Template",
        category: "personal",
        icon: "🔒",
        content: sampleContent,
        isPublic: false,
      });

      // User 2 should not see it
      const templates = await asUser2.query(api.documentTemplates.list, {});
      expect(templates.some((t) => t.name === "User1 Private Template")).toBe(false);
    });
  });

  describe("get", () => {
    it("should get own template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Get Test Template",
        category: "test",
        icon: "🔍",
        content: sampleContent,
        isPublic: false,
      });

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });

      expect(template?.name).toBe("Get Test Template");
      expect(template?.content).toEqual(sampleContent);
    });

    it("should get public template from another user", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "Public Accessible",
        category: "public",
        icon: "🌐",
        content: sampleContent,
        isPublic: true,
      });

      const template = await asUser2.query(api.documentTemplates.get, { id: templateId });
      expect(template?.name).toBe("Public Accessible");
    });

    it("should reject access to private template from another user", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "Private Only",
        category: "private",
        icon: "🔒",
        content: sampleContent,
        isPublic: false,
      });

      await expect(asUser2.query(api.documentTemplates.get, { id: templateId })).rejects.toThrow(
        /FORBIDDEN/i,
      );
    });

    it("should return null for non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Temp",
        category: "temp",
        icon: "🗑️",
        content: sampleContent,
        isPublic: false,
      });
      await asUser.mutation(api.documentTemplates.remove, { id: templateId });

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });
      expect(template).toBeNull();
    });
  });

  describe("update", () => {
    it("should update own template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Original Name",
        category: "original",
        icon: "📄",
        content: sampleContent,
        isPublic: false,
      });

      await asUser.mutation(api.documentTemplates.update, {
        id: templateId,
        name: "Updated Name",
        description: "Added description",
        isPublic: true,
      });

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });
      expect(template?.name).toBe("Updated Name");
      expect(template?.description).toBe("Added description");
      expect(template?.isPublic).toBe(true);
    });

    it("should reject updating another user's template", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "User1 Template",
        category: "test",
        icon: "📄",
        content: sampleContent,
        isPublic: true, // Even public templates can't be updated by others
      });

      await expect(
        asUser2.mutation(api.documentTemplates.update, {
          id: templateId,
          name: "Hijacked",
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });

    it("should reject updating non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Temp",
        category: "temp",
        icon: "🗑️",
        content: sampleContent,
        isPublic: false,
      });
      await asUser.mutation(api.documentTemplates.remove, { id: templateId });

      await expect(
        asUser.mutation(api.documentTemplates.update, {
          id: templateId,
          name: "New Name",
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("remove", () => {
    it("should delete own template", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "To Delete",
        category: "temp",
        icon: "🗑️",
        content: sampleContent,
        isPublic: false,
      });

      await asUser.mutation(api.documentTemplates.remove, { id: templateId });

      const template = await asUser.query(api.documentTemplates.get, { id: templateId });
      expect(template).toBeNull();
    });

    it("should reject deleting another user's template", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const user2Id = await createTestUser(t, { name: "User 2", email: "user2@test.com" });

      const asUser1 = asAuthenticatedUser(t, user1Id);
      const asUser2 = asAuthenticatedUser(t, user2Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "User1 Template",
        category: "test",
        icon: "📄",
        content: sampleContent,
        isPublic: true,
      });

      await expect(
        asUser2.mutation(api.documentTemplates.remove, { id: templateId }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });
  });

  describe("createDocumentFromTemplate", () => {
    it("should create document from own template", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Doc Template",
        category: "docs",
        icon: "📄",
        content: sampleContent,
        isPublic: false,
      });

      const result = await asUser.mutation(api.documentTemplates.createDocumentFromTemplate, {
        templateId,
        title: "New Document from Template",
        organizationId,
        isPublic: false,
      });

      expect(result.documentId).toBeDefined();
      expect(result.templateContent).toEqual(sampleContent);
    });

    it("should create document from public template", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const { organizationId, asUser: asUser2 } = await createTestContext(t);

      const asUser1 = asAuthenticatedUser(t, user1Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "Public Doc Template",
        category: "public",
        icon: "🌐",
        content: sampleContent,
        isPublic: true,
      });

      const result = await asUser2.mutation(api.documentTemplates.createDocumentFromTemplate, {
        templateId,
        title: "Doc from Public Template",
        organizationId,
        isPublic: false,
      });

      expect(result.documentId).toBeDefined();
    });

    it("should reject creating document from private template of another user", async () => {
      const t = convexTest(schema, modules);
      const user1Id = await createTestUser(t, { name: "User 1", email: "user1@test.com" });
      const { organizationId, asUser: asUser2 } = await createTestContext(t);

      const asUser1 = asAuthenticatedUser(t, user1Id);

      const templateId = await asUser1.mutation(api.documentTemplates.create, {
        name: "Private Doc Template",
        category: "private",
        icon: "🔒",
        content: sampleContent,
        isPublic: false,
      });

      await expect(
        asUser2.mutation(api.documentTemplates.createDocumentFromTemplate, {
          templateId,
          title: "Should Fail",
          organizationId,
          isPublic: false,
        }),
      ).rejects.toThrow(/FORBIDDEN/i);
    });

    it("should reject non-existent template", async () => {
      const t = convexTest(schema, modules);
      const { organizationId, asUser } = await createTestContext(t);

      // Create and delete to get valid non-existent ID
      const templateId = await asUser.mutation(api.documentTemplates.create, {
        name: "Temp",
        category: "temp",
        icon: "🗑️",
        content: sampleContent,
        isPublic: false,
      });
      await asUser.mutation(api.documentTemplates.remove, { id: templateId });

      await expect(
        asUser.mutation(api.documentTemplates.createDocumentFromTemplate, {
          templateId,
          title: "Should Fail",
          organizationId,
          isPublic: false,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("initializeBuiltInTemplates", () => {
    it("should create built-in templates", async () => {
      const t = convexTest(schema, modules);

      const result = await t.mutation(internal.documentTemplates.initializeBuiltInTemplates, {});

      expect(result.message).toContain("Created");
      expect(result.message).toContain("built-in templates");
    });

    it("should not recreate if already exist", async () => {
      const t = convexTest(schema, modules);

      await t.mutation(internal.documentTemplates.initializeBuiltInTemplates, {});
      const result = await t.mutation(internal.documentTemplates.initializeBuiltInTemplates, {});

      expect(result.message).toContain("already exist");
    });
  });
});

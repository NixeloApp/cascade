import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  addUserToOrganization,
  asAuthenticatedUser,
  createTestProject,
  createTestUser,
} from "./testUtils";

// Mock DNS resolution
vi.mock("./lib/dns", () => ({
  resolveDNS: vi.fn(async (hostname: string) => {
    if (hostname === "example.com") {
      return ["93.184.216.34"]; // Public IP
    }
    if (hostname === "localtest.me") {
      return ["127.0.0.1"]; // Private IP
    }
    return [];
  }),
}));

describe("Webhooks", () => {
  describe("create", () => {
    it("should create a webhook with all fields", async () => {
      const t = convexTest(schema, modules);
      // Verify swap

      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Issue Webhook",
        url: "https://example.com/webhook",
        events: ["issue.created", "issue.updated"],
        secret: "secret123",
      });

      expect(webhookId).toBeDefined();

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("Issue Webhook");
      expect(webhook?.url).toBe("https://example.com/webhook");
      expect(webhook?.events).toEqual(["issue.created", "issue.updated"]);
      expect(webhook?.secret).toBe("secret123");
      expect(webhook?.isActive).toBe(true);
      expect(webhook?.createdBy).toBe(userId);
      await t.finishInProgressScheduledFunctions();
    });

    it("should create webhook without secret", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Simple Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.secret).toBeUndefined();
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Editor tries to create webhook - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.mutation(api.webhooks.createWebhook, {
          projectId,
          name: "Webhook",
          url: "https://example.com/hook",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      let error: any;
      try {
        await t.mutation(api.webhooks.createWebhook, {
          projectId,
          name: "Webhook",
          url: "https://example.com/hook",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("listByProject", () => {
    it("should list all webhooks for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create multiple webhooks
      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook 1",
        url: "https://example.com/hook1",
        events: ["issue.created"],
      });
      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook 2",
        url: "https://example.com/hook2",
        events: ["issue.updated"],
      });

      const webhooks = await asUser.query(api.webhooks.listByProject, {
        projectId,
      });

      expect(webhooks).toHaveLength(2);
      expect(webhooks.map((w) => w.name)).toContain("Webhook 1");
      expect(webhooks.map((w) => w.name)).toContain("Webhook 2");
      await t.finishInProgressScheduledFunctions();
    });

    it("should return empty array for project with no webhooks", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const webhooks = await asUser.query(api.webhooks.listByProject, {
        projectId,
      });

      expect(webhooks).toEqual([]);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      // Editor tries to list webhooks - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.query(api.webhooks.listByProject, { projectId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      let error: any;
      try {
        await t.query(api.webhooks.listByProject, { projectId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/UNAUTHENTICATED|Not authenticated/i);
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("update", () => {
    it("should update webhook fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Original Name",
        url: "https://example.com/original",
        events: ["issue.created"],
      });

      await asUser.mutation(api.webhooks.updateWebhook, {
        id: webhookId,
        name: "Updated Name",
        url: "https://example.com/updated",
        events: ["issue.created", "issue.updated", "issue.deleted"],
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("Updated Name");
      expect(webhook?.url).toBe("https://example.com/updated");
      expect(webhook?.events).toEqual(["issue.created", "issue.updated", "issue.deleted"]);
      await t.finishInProgressScheduledFunctions();
    });

    it("should toggle isActive status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Deactivate
      await asUser.mutation(api.webhooks.updateWebhook, {
        id: webhookId,
        isActive: false,
      });

      let webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });
      expect(webhook?.isActive).toBe(false);

      // Reactivate
      await asUser.mutation(api.webhooks.updateWebhook, {
        id: webhookId,
        isActive: true,
      });

      webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });
      expect(webhook?.isActive).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should update only specified fields", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Original Name",
        url: "https://example.com/original",
        events: ["issue.created"],
      });

      // Update only name
      await asUser.mutation(api.webhooks.updateWebhook, {
        id: webhookId,
        name: "New Name",
      });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.name).toBe("New Name");
      expect(webhook?.url).toBe("https://example.com/original"); // Unchanged
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const { webhookId } = await asOwner.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to update - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.mutation(api.webhooks.updateWebhook, {
          id: webhookId,
          name: "Hacked",
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      let error: any;
      try {
        await t.mutation(api.webhooks.updateWebhook, {
          id: webhookId,
          name: "Hacked",
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a webhook to get a valid but non-existent ID
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Temp",
        url: "https://example.com/temp",
        events: ["issue.created"],
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(webhookId);
      });

      let error: any;
      try {
        await asUser.mutation(api.webhooks.updateWebhook, {
          id: webhookId,
          name: "Test",
          url: "https://example.com/temp",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Webhook not found");
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject private IP addresses (SSRF protection)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      let error: any;
      try {
        await asUser.mutation(api.webhooks.createWebhook, {
          projectId,
          name: "Hacker",
          url: "http://127.0.0.1/hack",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Private IP addresses are not allowed");

      // Ensure transaction is cleaned up
      await t.finishInProgressScheduledFunctions();
    });

    it("should reject ambiguous IP addresses (Integer IP)", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      let error: any;
      try {
        await asUser.mutation(api.webhooks.createWebhook, {
          projectId,
          name: "Hacker 2",
          url: "http://2130706433/hack",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/Private IP|Ambiguous/);

      await t.finishInProgressScheduledFunctions();
    });

    it("should reject metadata IP addresses", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      let error: any;
      try {
        await asUser.mutation(api.webhooks.createWebhook, {
          projectId,
          name: "Hacker 3",
          url: "http://169.254.169.254/latest/meta-data",
          events: ["issue.created"],
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Private IP addresses are not allowed");

      await t.finishInProgressScheduledFunctions();
    });

    it("should accept valid public URLs", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Valid",
        url: "https://example.com/webhook",
        events: ["issue.created"],
      });

      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("softDelete", () => {
    it("should delete webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "To Delete",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const result = await asUser.mutation(api.webhooks.softDeleteWebhook, { id: webhookId });
      expect(result).toEqual({ success: true, deleted: true });

      const webhook = await t.run(async (ctx) => {
        return await ctx.db.get(webhookId);
      });

      expect(webhook?.isDeleted).toBe(true);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const { webhookId } = await asOwner.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to delete - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.mutation(api.webhooks.softDeleteWebhook, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      let error: any;
      try {
        await t.mutation(api.webhooks.softDeleteWebhook, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a webhook to get a valid but non-existent ID
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Temp",
        url: "https://example.com/temp",
        events: ["issue.created"],
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(webhookId);
      });

      let error: any;
      try {
        await asUser.mutation(api.webhooks.softDeleteWebhook, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Webhook not found");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("listExecutions", () => {
    it("should list webhook executions", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create execution logs directly
      await t.run(async (ctx) => {
        await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "success",
          responseStatus: 200,
          attempts: 1,
          completedAt: Date.now(),
        });
        await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.updated",
          requestPayload: '{"test": true}',
          status: "failed",
          error: "Connection timeout",
          attempts: 1,
          completedAt: Date.now(),
        });
      });

      const executions = await asUser.query(api.webhooks.listExecutions, {
        webhookId,
        paginationOpts: { numItems: 20, cursor: null },
      });

      expect(executions.page).toHaveLength(2);
      await t.finishInProgressScheduledFunctions();
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create multiple execution logs
      await t.run(async (ctx) => {
        for (let i = 0; i < 10; i++) {
          await ctx.db.insert("webhookExecutions", {
            webhookId,
            event: "issue.created",
            requestPayload: `{"index": ${i}}`,
            status: "success",
            attempts: 1,
            completedAt: Date.now(),
          });
        }
      });

      const executions = await asUser.query(api.webhooks.listExecutions, {
        webhookId,
        paginationOpts: { numItems: 5, cursor: null },
      });

      expect(executions.page.length).toBeLessThanOrEqual(5);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const { webhookId } = await asOwner.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to view executions - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.query(api.webhooks.listExecutions, {
          webhookId,
          paginationOpts: { numItems: 20, cursor: null },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      let error: any;
      try {
        await t.query(api.webhooks.listExecutions, {
          webhookId,
          paginationOpts: { numItems: 20, cursor: null },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a webhook to get a valid but non-existent ID
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Temp",
        url: "https://example.com/temp",
        events: ["issue.created"],
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(webhookId);
      });

      let error: any;
      try {
        await asUser.query(api.webhooks.listExecutions, {
          webhookId,
          paginationOpts: { numItems: 20, cursor: null },
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Webhook not found");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("test", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should schedule test webhook delivery", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const result = await asUser.mutation(api.webhooks.test, { id: webhookId });

      expect(result.success).toBe(true);

      // Don't run the scheduled actions - they make HTTP calls to external URLs
      // The test only verifies the mutation returns success (scheduling works)
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const { webhookId } = await asOwner.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Editor tries to test webhook - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.mutation(api.webhooks.test, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      let error: any;
      try {
        await t.mutation(api.webhooks.test, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for non-existent webhook", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete a webhook to get a valid but non-existent ID
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Temp",
        url: "https://example.com/temp",
        events: ["issue.created"],
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(webhookId);
      });

      let error: any;
      try {
        await asUser.mutation(api.webhooks.test, { id: webhookId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Webhook not found");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("retryExecution", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should schedule retry for failed execution", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Test Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      // Create failed execution
      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          error: "Connection timeout",
          attempts: 1,
          completedAt: Date.now(),
        });
      });

      const result = await asUser.mutation(api.webhooks.retryExecution, {
        id: executionId,
      });

      expect(result.success).toBe(true);

      // The test only verifies the mutation returns success (scheduling works)
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny non-admin users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const editor = await createTestUser(t, {
        name: "Editor",
        email: "editor@test.com",
      });
      const projectId = await createTestProject(t, owner);

      // Get the organization ID from the project
      const project = await t.run(async (ctx) => ctx.db.get(projectId));
      if (!project) throw new Error("Project not found");

      // Add editor
      const asOwner = asAuthenticatedUser(t, owner);
      // Add editor to organization first (required by security check)
      await addUserToOrganization(t, project.organizationId, editor, owner);
      await asOwner.mutation(api.projects.addProjectMember, {
        projectId,
        userEmail: "editor@test.com",
        role: "editor",
      });

      const { webhookId } = await asOwner.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          attempts: 1,
        });
      });

      // Editor tries to retry - should be forbidden (requires admin)
      const asEditor = asAuthenticatedUser(t, editor);

      let error: any;
      try {
        await asEditor.mutation(api.webhooks.retryExecution, { id: executionId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch(/FORBIDDEN|admin/i);
      await t.finishInProgressScheduledFunctions();
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Webhook",
        url: "https://example.com/hook",
        events: ["issue.created"],
      });

      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          attempts: 1,
        });
      });

      let error: any;
      try {
        await t.mutation(api.webhooks.retryExecution, { id: executionId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Not authenticated");
      await t.finishInProgressScheduledFunctions();
    });

    it("should throw error for non-existent execution", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { webhookId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Temp",
        url: "https://example.com/temp",
        events: ["issue.created"],
      });

      // Create and delete an execution to get a valid but non-existent ID
      const executionId = await t.run(async (ctx) => {
        return await ctx.db.insert("webhookExecutions", {
          webhookId,
          event: "issue.created",
          requestPayload: '{"test": true}',
          status: "failed",
          attempts: 1,
        });
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(executionId);
      });

      let error: any;
      try {
        await asUser.mutation(api.webhooks.retryExecution, { id: executionId });
      } catch (e) {
        error = e;
      }
      expect(error).toBeDefined();
      expect(error.message).toMatch("Execution not found");
      await t.finishInProgressScheduledFunctions();
    });
  });

  describe("internal functions", () => {
    it("getActiveWebhooksForEvent - should return webhooks for specific event", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create webhooks for different events
      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Issue Webhook",
        url: "https://example.com/hook1",
        events: ["issue.created", "issue.updated"],
      });
      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Comment Webhook",
        url: "https://example.com/hook2",
        events: ["comment.created"],
      });

      // Get webhooks for issue.created event (internal query doesn't need auth)
      const webhooks = await t.query(internal.webhooks.getActiveWebhooksForEvent, {
        projectId,
        event: "issue.created",
      });

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]?.name).toBe("Issue Webhook");
      await t.finishInProgressScheduledFunctions();
    });

    it("getActiveWebhooksForEvent - should only return active webhooks", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create active webhook
      await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Active Webhook",
        url: "https://example.com/hook1",
        events: ["issue.created"],
      });

      // Create and deactivate webhook
      const { webhookId: inactiveId } = await asUser.mutation(api.webhooks.createWebhook, {
        projectId,
        name: "Inactive Webhook",
        url: "https://example.com/hook2",
        events: ["issue.created"],
      });
      await asUser.mutation(api.webhooks.updateWebhook, {
        id: inactiveId,
        isActive: false,
      });

      // Get webhooks (internal query doesn't need auth)
      const webhooks = await t.query(internal.webhooks.getActiveWebhooksForEvent, {
        projectId,
        event: "issue.created",
      });

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]?.name).toBe("Active Webhook");
      await t.finishInProgressScheduledFunctions();
    });
  });
});

/**
 * Tests for Workflow Automation functionality
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Workflows", () => {
  describe("create", () => {
    it("should create a workflow", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Booking Confirmation",
        description: "Send confirmation email on booking",
        trigger: "booking_created",
        actions: [
          {
            type: "email_attendee",
            template: "Thank you for booking!",
            subject: "Booking Confirmed",
          },
        ],
      });

      expect(workflowId).toBeDefined();
    });

    it("should create a workflow with trigger offset", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Event Reminder",
        trigger: "event_reminder",
        triggerOffset: -24 * 60 * 60 * 1000, // 24 hours before
        actions: [
          {
            type: "email_attendee",
            template: "Your event is tomorrow!",
            subject: "Event Reminder",
          },
        ],
      });

      expect(workflowId).toBeDefined();

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.triggerOffset).toBe(-24 * 60 * 60 * 1000);
    });

    it("should create a workflow with project scope", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Issue Assignment",
        projectId,
        trigger: "issue_assigned",
        actions: [
          {
            type: "email_assignee",
            template: "You have been assigned an issue",
            subject: "Issue Assigned",
          },
        ],
      });

      expect(workflowId).toBeDefined();

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.projectId).toBe(projectId);
    });
  });

  describe("listMine", () => {
    it("should list user workflows", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.workflows.create, {
        name: "Workflow 1",
        trigger: "booking_created",
        actions: [{ type: "email_attendee", template: "Test" }],
      });
      await asUser.mutation(api.workflows.create, {
        name: "Workflow 2",
        trigger: "event_reminder",
        actions: [{ type: "sms_attendee", template: "Test" }],
      });

      const workflows = await asUser.query(api.workflows.listMine, {});
      expect(workflows).toHaveLength(2);
    });

    it("should filter by project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      await asUser.mutation(api.workflows.create, {
        name: "Project Workflow",
        projectId,
        trigger: "issue_assigned",
        actions: [{ type: "email_assignee", template: "Test" }],
      });
      await asUser.mutation(api.workflows.create, {
        name: "Global Workflow",
        trigger: "booking_created",
        actions: [{ type: "email_attendee", template: "Test" }],
      });

      const projectWorkflows = await asUser.query(api.workflows.listMine, { projectId });
      expect(projectWorkflows).toHaveLength(1);
      expect(projectWorkflows[0].name).toBe("Project Workflow");
    });
  });

  describe("update", () => {
    it("should update workflow name", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Old Name",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      await asUser.mutation(api.workflows.update, {
        workflowId,
        name: "New Name",
      });

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.name).toBe("New Name");
    });

    it("should update workflow trigger", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Test Workflow",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      await asUser.mutation(api.workflows.update, {
        workflowId,
        trigger: "event_reminder",
      });

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.trigger).toBe("event_reminder");
    });

    it("should update workflow actions", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Test Workflow",
        trigger: "booking_created",
        actions: [{ type: "email_attendee", template: "Old template" }],
      });

      await asUser.mutation(api.workflows.update, {
        workflowId,
        actions: [
          { type: "email_attendee", template: "New template", subject: "New Subject" },
          { type: "sms_attendee", template: "SMS notification" },
        ],
      });

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.actions).toHaveLength(2);
      expect(workflow?.actions[0].template).toBe("New template");
      expect(workflow?.actions[1].type).toBe("sms_attendee");
    });
  });

  describe("toggleActive", () => {
    it("should toggle workflow active status", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Toggle Test",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      // Initially active
      let workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.isActive).toBe(true);

      // Toggle off
      const result = await asUser.mutation(api.workflows.toggleActive, { workflowId });
      expect(result.isActive).toBe(false);

      workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow?.isActive).toBe(false);

      // Toggle back on
      const result2 = await asUser.mutation(api.workflows.toggleActive, { workflowId });
      expect(result2.isActive).toBe(true);
    });
  });

  describe("duplicate", () => {
    it("should duplicate a workflow", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "Original Workflow",
        description: "Original description",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      const duplicateId = await asUser.mutation(api.workflows.duplicate, { workflowId });
      expect(duplicateId).toBeDefined();
      expect(duplicateId).not.toBe(workflowId);

      const duplicate = await asUser.query(api.workflows.get, { workflowId: duplicateId });
      expect(duplicate?.name).toBe("Original Workflow (copy)");
      expect(duplicate?.description).toBe("Original description");
      expect(duplicate?.trigger).toBe("booking_created");
      expect(duplicate?.isActive).toBe(false); // Duplicates start inactive
    });
  });

  describe("remove", () => {
    it("should delete a workflow", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);

      const asUser = asAuthenticatedUser(t, userId);
      const workflowId = await asUser.mutation(api.workflows.create, {
        name: "To Delete",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      await asUser.mutation(api.workflows.remove, { workflowId });

      const workflow = await asUser.query(api.workflows.get, { workflowId });
      expect(workflow).toBeNull();
    });

    it("should reject deletion by non-owner", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const otherUser = await createTestUser(t, { name: "Other" });

      const asOwner = asAuthenticatedUser(t, owner);
      const workflowId = await asOwner.mutation(api.workflows.create, {
        name: "Owner's Workflow",
        trigger: "booking_created",
        actions: [{ type: "email_host", template: "Test" }],
      });

      const asOther = asAuthenticatedUser(t, otherUser);
      await expect(async () => {
        await asOther.mutation(api.workflows.remove, { workflowId });
      }).rejects.toThrow("Workflow not found");
    });
  });
});

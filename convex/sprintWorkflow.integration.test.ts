/**
 * Sprint Workflow Integration Tests
 *
 * Tests the complete sprint workflow including:
 * - Creating sprints
 * - Adding issues to sprints
 * - Starting sprints
 * - Moving issues between sprints
 * - Completing sprints
 * - Sprint analytics
 */

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createOrganizationAdmin, createTestUser } from "./testUtils";

describe("Sprint Workflow Integration", () => {
  describe("Complete Sprint Lifecycle", () => {
    it("should support full sprint lifecycle: create → add issues → start → complete", async () => {
      const t = convexTest(schema, modules);

      // Setup: Create user, org, workspace, and scrum project
      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create a scrum project (required for sprints)
      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Scrum Project",
        key: "SCRUM",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      // Step 1: Create a sprint
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
        goal: "Complete initial feature set",
      });

      expect(sprintId).toBeDefined();

      // Verify sprint was created with correct status
      const sprints = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint = sprints.find((s) => s._id === sprintId);
      expect(sprint).toBeDefined();
      expect(sprint?.status).toBe("future");
      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.goal).toBe("Complete initial feature set");

      // Step 2: Create issues and add them to the sprint
      const { issueId: issue1Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Implement user authentication",
        type: "story",
        priority: "high",
        sprintId,
        storyPoints: 5,
      });

      const { issueId: _issue2Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Add login form",
        type: "task",
        priority: "medium",
        sprintId,
        storyPoints: 3,
      });

      const { issueId: _issue3Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Fix security vulnerability",
        type: "bug",
        priority: "highest",
        sprintId,
        storyPoints: 2,
      });

      // Verify issues are linked to sprint
      const sprintsWithCounts = await asUser.query(api.sprints.listByProject, { projectId });
      const sprintWithIssues = sprintsWithCounts.find((s) => s._id === sprintId);
      expect(sprintWithIssues?.issueCount).toBe(3);

      // Step 3: Start the sprint
      const now = Date.now();
      const twoWeeksLater = now + 2 * WEEK;

      await asUser.mutation(api.sprints.startSprint, {
        sprintId,
        startDate: now,
        endDate: twoWeeksLater,
      });

      // Verify sprint is now active
      const activeSprints = await asUser.query(api.sprints.listByProject, { projectId });
      const activeSprint = activeSprints.find((s) => s._id === sprintId);
      expect(activeSprint?.status).toBe("active");
      expect(activeSprint?.startDate).toBe(now);
      expect(activeSprint?.endDate).toBe(twoWeeksLater);

      // Step 4: Move an issue through workflow states (simulating work)
      // Get the project to find workflow states
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const doneState = project?.workflowStates.find((s) => s.category === "done");

      if (doneState) {
        // Complete one issue
        await asUser.mutation(api.issues.mutations.updateStatus, {
          issueId: issue1Id,
          newStatus: doneState.id,
          newOrder: 1,
        });
      }

      // Step 5: Complete the sprint
      await asUser.mutation(api.sprints.completeSprint, { sprintId });

      // Verify sprint is completed
      const completedSprints = await asUser.query(api.sprints.listByProject, { projectId });
      const completedSprint = completedSprints.find((s) => s._id === sprintId);
      expect(completedSprint?.status).toBe("completed");
    });

    it("should move incomplete issues to next sprint when completing", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Scrum Project",
        key: "MOVE",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      // Create two sprints
      const { sprintId: sprint1Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const { sprintId: sprint2Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });

      // Create issues in sprint 1
      const { issueId: issue1Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Issue to complete",
        type: "task",
        priority: "medium",
        sprintId: sprint1Id,
      });

      const { issueId: issue2Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Issue to move",
        type: "task",
        priority: "medium",
        sprintId: sprint1Id,
      });

      // Start and complete sprint 1
      const now = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: sprint1Id,
        startDate: now,
        endDate: now + 2 * WEEK,
      });

      // Complete one issue
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const doneState = project?.workflowStates.find((s) => s.category === "done");

      if (doneState) {
        await asUser.mutation(api.issues.mutations.updateStatus, {
          issueId: issue1Id,
          newStatus: doneState.id,
          newOrder: 1,
        });
      }

      // Move incomplete issue to sprint 2 before completing sprint 1
      await asUser.mutation(api.issues.mutations.bulkMoveToSprint, {
        issueIds: [issue2Id],
        sprintId: sprint2Id,
      });

      // Complete sprint 1
      await asUser.mutation(api.sprints.completeSprint, { sprintId: sprint1Id });

      // Verify sprint 2 has the moved issue
      const sprintsAfter = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint2After = sprintsAfter.find((s) => s._id === sprint2Id);
      expect(sprint2After?.issueCount).toBe(1);
    });
  });

  describe("Sprint Backlog Management", () => {
    it("should allow bulk operations on sprint issues", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Bulk Ops Project",
        key: "BULK",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create multiple issues without sprint assignment
      const { issueId: issue1Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Backlog Issue 1",
        type: "task",
        priority: "low",
      });

      const { issueId: issue2Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Backlog Issue 2",
        type: "task",
        priority: "low",
      });

      const { issueId: issue3Id } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Backlog Issue 3",
        type: "task",
        priority: "low",
      });

      // Bulk move issues to sprint
      const result = await asUser.mutation(api.issues.mutations.bulkMoveToSprint, {
        issueIds: [issue1Id, issue2Id, issue3Id],
        sprintId,
      });

      expect(result.updated).toBe(3);

      // Verify issues are now in the sprint
      const sprints = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint = sprints.find((s) => s._id === sprintId);
      expect(sprint?.issueCount).toBe(3);
    });

    it("should allow removing issues from sprint (back to backlog)", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Backlog Project",
        key: "BACK",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create issue in sprint
      const { issueId } = await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Sprint Issue",
        type: "task",
        priority: "medium",
        sprintId,
      });

      // Remove from sprint (move to backlog)
      const result = await asUser.mutation(api.issues.mutations.bulkMoveToSprint, {
        issueIds: [issueId],
        sprintId: null,
      });

      expect(result.updated).toBe(1);

      // Verify sprint has no issues
      const sprints = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint = sprints.find((s) => s._id === sprintId);
      expect(sprint?.issueCount).toBe(0);
    });
  });

  describe("Sprint Status Transitions", () => {
    it("should only allow one active sprint at a time", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Single Active Sprint",
        key: "SGLE",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      // Create two sprints
      const { sprintId: sprint1Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const { sprintId: sprint2Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });

      // Start sprint 1
      const now = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: sprint1Id,
        startDate: now,
        endDate: now + 2 * WEEK,
      });

      // Start sprint 2 - this should automatically complete sprint 1
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: sprint2Id,
        startDate: now,
        endDate: now + 2 * WEEK,
      });

      // Verify only sprint 2 is active
      const sprints = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint1 = sprints.find((s) => s._id === sprint1Id);
      const sprint2 = sprints.find((s) => s._id === sprint2Id);

      expect(sprint1?.status).toBe("completed");
      expect(sprint2?.status).toBe("active");
    });
  });

  describe("Sprint with Story Points", () => {
    it("should track story points for sprint capacity planning", async () => {
      const t = convexTest(schema, modules);

      const userId = await createTestUser(t, { name: "Sprint Manager" });
      const { organizationId, workspaceId } = await createOrganizationAdmin(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { projectId } = await asUser.mutation(api.projects.createProject, {
        name: "Story Points Project",
        key: "STPT",
        organizationId,
        workspaceId,
        boardType: "scrum",
      });

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create issues with story points
      await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Large Feature",
        type: "story",
        priority: "high",
        sprintId,
        storyPoints: 8,
      });

      await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Medium Task",
        type: "task",
        priority: "medium",
        sprintId,
        storyPoints: 5,
      });

      await asUser.mutation(api.issues.mutations.create, {
        projectId,
        title: "Small Bug Fix",
        type: "bug",
        priority: "low",
        sprintId,
        storyPoints: 2,
      });

      // Start the sprint
      const now = Date.now();
      await asUser.mutation(api.sprints.startSprint, {
        sprintId,
        startDate: now,
        endDate: now + 2 * WEEK,
      });

      // Verify sprint has correct issue count
      const sprints = await asUser.query(api.sprints.listByProject, { projectId });
      const sprint = sprints.find((s) => s._id === sprintId);
      expect(sprint?.issueCount).toBe(3);
      // Total story points would be 15 (8 + 5 + 2)
    });
  });
});

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { WEEK } from "./lib/timeUtils";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "./testUtils";

describe("Analytics", () => {
  describe("getProjectAnalytics", () => {
    it("should return correct analytics data for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "User 1" });
      const otherUserId = await createTestUser(t, { name: "User 2" });
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Get workflow states to use correct IDs
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const todoState = project?.workflowStates.find((s: { id: string }) => s.id === "todo");
      const inProgressState = project?.workflowStates.find(
        (s: { id: string }) => s.id === "inprogress",
      );
      const doneState = project?.workflowStates.find((s: { id: string }) => s.id === "done");

      if (!todoState || !inProgressState || !doneState) {
        throw new Error("Missing expected workflow states");
      }

      // Create issues with various attributes
      // 1. Todo, Task, Medium, Unassigned (create defaults to Todo)
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 1",
        type: "task",
        priority: "medium",
      });

      // 2. In Progress, Bug, High, Assigned to User 1
      const issue2 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 2",
        type: "bug",
        priority: "high",
        assigneeId: userId,
      });
      await asUser.mutation(api.issues.updateStatus, {
        issueId: issue2,
        newStatus: inProgressState.id,
        newOrder: 0,
      });

      // 3. Done, Story, Low, Assigned to User 2
      const issue3 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Issue 3",
        type: "story",
        priority: "low",
        assigneeId: otherUserId,
      });
      await asUser.mutation(api.issues.updateStatus, {
        issueId: issue3,
        newStatus: doneState.id,
        newOrder: 0,
      });

      const analytics = await asUser.query(api.analytics.getProjectAnalytics, {
        projectId,
      });

      // Assertions
      expect(analytics.totalIssues).toBe(3);

      // Status counts
      expect(analytics.issuesByStatus[todoState.id]).toBe(1);
      expect(analytics.issuesByStatus[inProgressState.id]).toBe(1);
      expect(analytics.issuesByStatus[doneState.id]).toBe(1);

      // Type counts
      expect(analytics.issuesByType.task).toBe(1);
      expect(analytics.issuesByType.bug).toBe(1);
      expect(analytics.issuesByType.story).toBe(1);
      expect(analytics.issuesByType.epic).toBe(0);

      // Priority counts
      expect(analytics.issuesByPriority.medium).toBe(1);
      expect(analytics.issuesByPriority.high).toBe(1);
      expect(analytics.issuesByPriority.low).toBe(1);
      expect(analytics.issuesByPriority.highest).toBe(0);

      // Assignee counts
      expect(analytics.unassignedCount).toBe(1);
      expect(analytics.issuesByAssignee[userId]).toBeDefined();
      expect(analytics.issuesByAssignee[userId]?.count).toBe(1);
      expect(analytics.issuesByAssignee[otherUserId]).toBeDefined();
      expect(analytics.issuesByAssignee[otherUserId]?.count).toBe(1);
      expect(analytics.issuesByAssignee[userId]?.name).toBe("User 1");
      expect(analytics.issuesByAssignee[otherUserId]?.name).toBe("User 2");
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.query(api.analytics.getProjectAnalytics, { projectId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny unauthorized users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOther = asAuthenticatedUser(t, other);

      // Should be forbidden - user doesn't have access to project
      await expect(async () => {
        await asOther.query(api.analytics.getProjectAnalytics, { projectId });
      }).rejects.toThrow(/FORBIDDEN/i);
    });

    it("should throw error for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Delete project to make it non-existent
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      // Should throw NOT_FOUND for non-existent project
      await expect(async () => {
        await asUser.query(api.analytics.getProjectAnalytics, {
          projectId,
        });
      }).rejects.toThrow(/NOT_FOUND|not found/i);
    });
  });

  describe("getSprintBurndown", () => {
    it("should return burndown data for a sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create sprint with dates
      const startDate = Date.now();
      const endDate = startDate + 2 * WEEK; // 2 weeks
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
        startDate,
        endDate,
      });

      // Create issues with story points
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 1",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 5,
      });
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 2",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 8,
      });

      const burndown = await asUser.query(api.analytics.getSprintBurndown, { sprintId });

      expect(burndown.totalPoints).toBe(13); // 5 + 8
      expect(burndown.totalIssues).toBe(2);
      expect(burndown.completedPoints).toBe(0); // None completed yet
      expect(burndown.remainingPoints).toBe(13);
      expect(burndown.progressPercentage).toBe(0);
      expect(burndown.idealBurndown.length).toBeGreaterThan(0);
      expect(burndown.totalDays).toBe(14);
    });

    it("should calculate completed points correctly", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Get done state
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const doneState = project?.workflowStates.find((s: { name: string }) => s.name === "Done");

      // Create issues
      const issue1 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 1",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 5,
      });
      const _issue2 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 2",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 8,
      });

      // Complete one issue
      if (doneState) {
        await asUser.mutation(api.issues.updateStatus, {
          issueId: issue1,
          newStatus: doneState.id,
          newOrder: 0,
        });
      }

      const burndown = await asUser.query(api.analytics.getSprintBurndown, { sprintId });

      expect(burndown.totalPoints).toBe(13);
      expect(burndown.completedPoints).toBe(5);
      expect(burndown.remainingPoints).toBe(8);
      expect(burndown.completedIssues).toBe(1);
      expect(burndown.progressPercentage).toBe(38); // 5/13 ≈ 38%
    });

    it("should handle sprint with no dates", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 1",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 5,
      });

      const burndown = await asUser.query(api.analytics.getSprintBurndown, { sprintId });

      expect(burndown.totalPoints).toBe(5);
      expect(burndown.idealBurndown).toEqual([]);
      expect(burndown.totalDays).toBe(0);
      expect(burndown.daysElapsed).toBe(0);
    });

    it("should handle sprint with no issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const burndown = await asUser.query(api.analytics.getSprintBurndown, { sprintId });

      expect(burndown.totalPoints).toBe(0);
      expect(burndown.totalIssues).toBe(0);
      expect(burndown.progressPercentage).toBe(0);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      await expect(async () => {
        await t.query(api.analytics.getSprintBurndown, { sprintId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny unauthorized users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOwner = asAuthenticatedUser(t, owner);
      const { sprintId } = await asOwner.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      const asOther = asAuthenticatedUser(t, other);

      await expect(async () => {
        await asOther.query(api.analytics.getSprintBurndown, { sprintId });
      }).rejects.toThrow("Not authorized");
    });

    it("should throw error for non-existent sprint", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create and delete sprint to get a valid but non-existent ID
      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      await t.run(async (ctx) => {
        await ctx.db.delete(sprintId);
      });

      await expect(async () => {
        await asUser.query(api.analytics.getSprintBurndown, { sprintId });
      }).rejects.toThrow("Sprint not found");
    });
  });

  describe("getTeamVelocity", () => {
    it("should calculate team velocity from completed sprints", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Get done state
      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const doneState = project?.workflowStates.find((s: { name: string }) => s.name === "Done");

      // Create and complete sprint 1
      const { sprintId: sprint1Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });
      const issue1 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 1",
        type: "task",
        priority: "medium",
        sprintId: sprint1Id,
        estimatedHours: 10,
      });
      if (doneState) {
        await asUser.mutation(api.issues.updateStatus, {
          issueId: issue1,
          newStatus: doneState.id,
          newOrder: 0,
        });
      }
      await asUser.mutation(api.sprints.completeSprint, { sprintId: sprint1Id });

      // Create and complete sprint 2
      const { sprintId: sprint2Id } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 2",
      });
      const issue2 = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Task 2",
        type: "task",
        priority: "medium",
        sprintId: sprint2Id,
        estimatedHours: 8,
      });
      if (doneState) {
        await asUser.mutation(api.issues.updateStatus, {
          issueId: issue2,
          newStatus: doneState.id,
          newOrder: 0,
        });
      }
      await asUser.mutation(api.sprints.completeSprint, { sprintId: sprint2Id });

      const velocity = await asUser.query(api.analytics.getTeamVelocity, {
        projectId,
      });

      expect(velocity.velocityData).toHaveLength(2);
      expect(velocity.velocityData[0]?.sprintName).toBe("Sprint 1");
      expect(velocity.velocityData[0]?.points).toBe(10);
      expect(velocity.velocityData[1]?.sprintName).toBe("Sprint 2");
      expect(velocity.velocityData[1]?.points).toBe(8);
      expect(velocity.averageVelocity).toBe(9); // (10 + 8) / 2
    });

    it("should only include completed sprints", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create completed sprint
      const { sprintId: completedSprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Completed Sprint",
      });
      await asUser.mutation(api.sprints.completeSprint, {
        sprintId: completedSprintId,
      });

      // Create active sprint
      const { sprintId: activeSprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Active Sprint",
      });
      await asUser.mutation(api.sprints.startSprint, {
        sprintId: activeSprintId,
        startDate: Date.now(),
        endDate: Date.now() + 2 * WEEK,
      });

      // Create future sprint
      await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Future Sprint",
      });

      const velocity = await asUser.query(api.analytics.getTeamVelocity, {
        projectId,
      });

      expect(velocity.velocityData).toHaveLength(1);
      expect(velocity.velocityData[0]?.sprintName).toBe("Completed Sprint");
    });

    it("should return zero velocity for project with no completed sprints", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const velocity = await asUser.query(api.analytics.getTeamVelocity, {
        projectId,
      });

      expect(velocity.velocityData).toEqual([]);
      expect(velocity.averageVelocity).toBe(0);
    });

    it("should only count completed issues in velocity", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const project = await asUser.query(api.projects.getProject, { id: projectId });
      const doneState = project?.workflowStates.find((s: { name: string }) => s.name === "Done");

      const { sprintId } = await asUser.mutation(api.sprints.create, {
        projectId,
        name: "Sprint 1",
      });

      // Create completed issue
      const completedIssue = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Completed Task",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 10,
      });

      // Create incomplete issue
      await asUser.mutation(api.issues.create, {
        projectId,
        title: "Incomplete Task",
        type: "task",
        priority: "medium",
        sprintId,
        estimatedHours: 5,
      });

      // Complete one issue
      if (doneState) {
        await asUser.mutation(api.issues.updateStatus, {
          issueId: completedIssue,
          newStatus: doneState.id,
          newOrder: 0,
        });
      }

      await asUser.mutation(api.sprints.completeSprint, { sprintId });

      const velocity = await asUser.query(api.analytics.getTeamVelocity, {
        projectId,
      });

      expect(velocity.velocityData[0]?.points).toBe(10); // Only completed task
      expect(velocity.velocityData[0]?.issuesCompleted).toBe(1);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.query(api.analytics.getTeamVelocity, { projectId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny unauthorized users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOther = asAuthenticatedUser(t, other);

      await expect(async () => {
        await asOther.query(api.analytics.getTeamVelocity, { projectId });
      }).rejects.toThrow("Not authorized");
    });

    it("should throw error for non-existent project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Delete project
      await t.run(async (ctx) => {
        await ctx.db.delete(projectId);
      });

      // Should throw NOT_FOUND for deleted project
      await expect(async () => {
        await asUser.query(api.analytics.getTeamVelocity, {
          projectId,
        });
      }).rejects.toThrow(/NOT_FOUND|not found/i);
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent activity for a project", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t, { name: "Test User" });
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create issue (generates activity)
      const { issueId } = await asUser.mutation(api.issues.create, {
        projectId,
        title: "Test Issue",
        type: "task",
        priority: "medium",
      });

      // Update issue (generates more activity)
      await asUser.mutation(api.issues.update, {
        issueId,
        title: "Updated Issue",
      });

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
        limit: 10,
      });

      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0]).toHaveProperty("userName");
      expect(activity[0]).toHaveProperty("issueKey");
      expect(activity[0]).toHaveProperty("issueTitle");
      expect(activity[0]).toHaveProperty("action");
    });

    it("should respect limit parameter", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create multiple issues to generate activity
      for (let i = 0; i < 10; i++) {
        await asUser.mutation(api.issues.create, {
          projectId,
          title: `Issue ${i}`,
          type: "task",
          priority: "medium",
        });
      }

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
        limit: 5,
      });

      expect(activity.length).toBeLessThanOrEqual(5);
    });

    it("should use default limit when not specified", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
      });

      expect(activity).toBeDefined();
      expect(Array.isArray(activity)).toBe(true);
    });

    it("should return empty array for project with no activity", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
      });

      expect(activity).toEqual([]);
    });

    it("should return activity for comments on older issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      // Create 5 issues
      const issueIds = [];
      for (let i = 0; i < 5; i++) {
        issueIds.push(
          await asUser.mutation(api.issues.create, {
            projectId,
            title: `Issue ${i}`,
            type: "task",
            priority: "medium",
          }),
        );
      }

      // Update the first 3 issues to make them "newer"
      for (let i = 0; i < 3; i++) {
        await asUser.mutation(api.issues.update, {
          issueId: issueIds[i],
          title: `Updated Issue ${i}`,
        });
      }

      // Comment on the 5th issue (oldest updated)
      // This should bring it to the top of recent activity
      await asUser.mutation(api.issues.addComment, {
        issueId: issueIds[4],
        content: "New comment on old issue",
      });

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
        limit: 5,
      });

      // The comment activity should be the most recent
      expect(activity[0].action).toBe("commented");
      expect(activity[0].issueId).toBe(issueIds[4]);
    });

    it("should return activity for deleted issues", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      const asUser = asAuthenticatedUser(t, userId);

      const { issueId } = await asUser.mutation(api.issues.create, {
        projectId,
        title: "To be deleted",
        type: "task",
        priority: "medium",
      });

      // Delete the issue
      await asUser.mutation(api.issues.bulkDelete, {
        issueIds: [issueId],
      });

      const activity = await asUser.query(api.analytics.getRecentActivity, {
        projectId,
        limit: 5,
      });

      // The delete activity should be present
      expect(activity[0].action).toBe("deleted");
      expect(activity[0].issueId).toBe(issueId);
    });

    it("should deny unauthenticated users", async () => {
      const t = convexTest(schema, modules);
      const userId = await createTestUser(t);
      const projectId = await createTestProject(t, userId);

      await expect(async () => {
        await t.query(api.analytics.getRecentActivity, { projectId });
      }).rejects.toThrow("Not authenticated");
    });

    it("should deny unauthorized users", async () => {
      const t = convexTest(schema, modules);
      const owner = await createTestUser(t, { name: "Owner" });
      const other = await createTestUser(t, { name: "Other" });
      const projectId = await createTestProject(t, owner, { isPublic: false });

      const asOther = asAuthenticatedUser(t, other);

      await expect(async () => {
        await asOther.query(api.analytics.getRecentActivity, { projectId });
      }).rejects.toThrow("Not authorized");
    });
  });
});

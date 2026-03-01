import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import { asAuthenticatedUser, createTestUser } from "./testUtils";

describe("Global User Enumeration", () => {
  it("should not allow distinguishing between non-existent users and users outside the organization", async () => {
    const t = convexTest(schema, modules);

    // Create two users in different organizations
    const userA = await createTestUser(t, { email: "userA@example.com" });
    const userB = await createTestUser(t, { email: "userB@example.com" });

    // Setup Org 1 for User A
    const org1Id = await t.run(async (ctx) => {
      return await ctx.db.insert("organizations", {
        name: "Org 1",
        slug: "org-1",
        timezone: "UTC",
        settings: {
          defaultMaxHoursPerDay: 8,
          defaultMaxHoursPerWeek: 40,
          requiresTimeApproval: false,
          billingEnabled: false,
        },
        createdBy: userA,
        updatedAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("organizationMembers", {
        organizationId: org1Id,
        userId: userA,
        role: "owner",
        addedBy: userA,
      });
    });

    // Create Workspace and Project for User A
    const workspaceId = await t.run(async (ctx) => {
      return await ctx.db.insert("workspaces", {
        name: "Workspace 1",
        slug: "ws-1",
        organizationId: org1Id,
        createdBy: userA,
        updatedAt: Date.now(),
      });
    });

    const projectId = await t.run(async (ctx) => {
      return await ctx.db.insert("projects", {
        name: "Project 1",
        key: "PROJ1",
        organizationId: org1Id,
        workspaceId: workspaceId,
        ownerId: userA,
        createdBy: userA,
        updatedAt: Date.now(),
        boardType: "kanban",
        workflowStates: [],
      });
    });

    // Add User A as project admin
    await t.run(async (ctx) => {
      await ctx.db.insert("projectMembers", {
        projectId: projectId,
        userId: userA,
        role: "admin",
        addedBy: userA,
      });
    });

    const asUserA = asAuthenticatedUser(t, userA);

    // 1. Try to add User B (exists globally, but not in Org 1)
    let errorUserB: any;
    try {
      await asUserA.mutation(api.projects.addProjectMember, {
        projectId: projectId,
        userEmail: "userB@example.com",
        role: "viewer",
      });
    } catch (e: any) {
      errorUserB = e;
    }

    // 2. Try to add Non-existent user
    let errorNonExistent: any;
    try {
      await asUserA.mutation(api.projects.addProjectMember, {
        projectId: projectId,
        userEmail: "nonexistent@example.com",
        role: "viewer",
      });
    } catch (e: any) {
      errorNonExistent = e;
    }

    // Security Fix: They should be the SAME (indistinguishable) to prevent enumeration
    expect(errorUserB).toBeDefined();
    expect(errorNonExistent).toBeDefined();

    const dataB =
      typeof errorUserB.data === "string" ? JSON.parse(errorUserB.data) : errorUserB.data;
    const dataNonExistent =
      typeof errorNonExistent.data === "string"
        ? JSON.parse(errorNonExistent.data)
        : errorNonExistent.data;

    // Both should be NOT_FOUND
    expect(dataB.code).toBe("NOT_FOUND");
    expect(dataNonExistent.code).toBe("NOT_FOUND");

    // Both should have the same message
    expect(dataB.message).toBe(dataNonExistent.message);
  });
});

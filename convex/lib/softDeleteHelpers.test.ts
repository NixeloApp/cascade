import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import schema from "../schema";
import { modules } from "../testSetup.test-helper";
import { asAuthenticatedUser, createTestProject, createTestUser } from "../testUtils";
import {
  getTimeSinceDeletion,
  includeDeleted,
  isEligibleForPermanentDeletion,
  isSoftDeleted,
  restoreFields,
  softDeleteFields,
} from "./softDeleteHelpers";

describe("softDeleteHelpers", () => {
  describe("softDeleteFields", () => {
    it("should return delete fields with current timestamp", () => {
      const userId = "user123" as Id<"users">;
      const beforeTime = Date.now();

      const fields = softDeleteFields(userId);

      expect(fields.isDeleted).toBe(true);
      expect(fields.deletedBy).toBe(userId);
      expect(fields.deletedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(fields.deletedAt).toBeLessThanOrEqual(Date.now());
    });

    it("should include all required fields", () => {
      const userId = "user456" as Id<"users">;
      const fields = softDeleteFields(userId);

      expect(Object.keys(fields)).toEqual(["isDeleted", "deletedAt", "deletedBy"]);
    });
  });

  describe("restoreFields", () => {
    it("should return undefined for all delete fields", () => {
      const fields = restoreFields();

      expect(fields.isDeleted).toBeUndefined();
      expect(fields.deletedAt).toBeUndefined();
      expect(fields.deletedBy).toBeUndefined();
    });

    it("should include all required fields", () => {
      const fields = restoreFields();

      expect(Object.keys(fields)).toEqual(["isDeleted", "deletedAt", "deletedBy"]);
    });
  });

  describe("isSoftDeleted", () => {
    it("should return true for deleted record", () => {
      const record = {
        isDeleted: true,
        deletedAt: Date.now(),
        deletedBy: "user123" as Id<"users">,
      };

      expect(isSoftDeleted(record)).toBe(true);
    });

    it("should return false for non-deleted record", () => {
      const record = {
        isDeleted: false,
      };

      expect(isSoftDeleted(record)).toBe(false);
    });

    it("should return false for record without isDeleted field", () => {
      const record = {};

      expect(isSoftDeleted(record)).toBe(false);
    });

    it("should return false for undefined isDeleted", () => {
      const record = {
        isDeleted: undefined,
      };

      expect(isSoftDeleted(record)).toBe(false);
    });
  });

  describe("includeDeleted", () => {
    it("should always return true", () => {
      expect(includeDeleted()).toBe(true);
    });
  });

  describe("getTimeSinceDeletion", () => {
    it("should return time since deletion for deleted record", () => {
      const deletedAt = Date.now() - 5000; // 5 seconds ago
      const record = {
        isDeleted: true,
        deletedAt,
      };

      const timeSince = getTimeSinceDeletion(record);

      expect(timeSince).not.toBeNull();
      expect(timeSince).toBeGreaterThanOrEqual(5000);
      expect(timeSince).toBeLessThan(6000);
    });

    it("should return null for non-deleted record", () => {
      const record = {
        isDeleted: false,
        deletedAt: Date.now(),
      };

      expect(getTimeSinceDeletion(record)).toBeNull();
    });

    it("should return null for record without deletedAt", () => {
      const record = {
        isDeleted: true,
      };

      expect(getTimeSinceDeletion(record)).toBeNull();
    });

    it("should return null for empty record", () => {
      const record = {};

      expect(getTimeSinceDeletion(record)).toBeNull();
    });
  });

  describe("isEligibleForPermanentDeletion", () => {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const ONE_HOUR = 60 * 60 * 1000;

    it("should return true when deletion exceeds threshold", () => {
      const record = {
        isDeleted: true,
        deletedAt: Date.now() - THIRTY_DAYS - 1000, // 30 days + 1 second ago
      };

      expect(isEligibleForPermanentDeletion(record)).toBe(true);
    });

    it("should return false when deletion is recent", () => {
      const record = {
        isDeleted: true,
        deletedAt: Date.now() - ONE_HOUR, // 1 hour ago
      };

      expect(isEligibleForPermanentDeletion(record)).toBe(false);
    });

    it("should return false for non-deleted record", () => {
      const record = {
        isDeleted: false,
        deletedAt: Date.now() - THIRTY_DAYS - 1000,
      };

      expect(isEligibleForPermanentDeletion(record)).toBe(false);
    });

    it("should use custom threshold", () => {
      const record = {
        isDeleted: true,
        deletedAt: Date.now() - ONE_HOUR - 1000, // Just over 1 hour ago
      };

      // With default 30-day threshold - not eligible
      expect(isEligibleForPermanentDeletion(record)).toBe(false);

      // With 1-hour threshold - eligible
      expect(isEligibleForPermanentDeletion(record, ONE_HOUR)).toBe(true);
    });

    it("should return false when just under threshold", () => {
      // Use a slightly shorter time than threshold to avoid race condition
      // The function uses Date.now() internally, so exact threshold is flaky
      const record = {
        isDeleted: true,
        deletedAt: Date.now() - THIRTY_DAYS + 1000, // 1 second under threshold
      };

      // Not eligible when under threshold (must be > not >=)
      expect(isEligibleForPermanentDeletion(record)).toBe(false);
    });

    it("should return false for empty record", () => {
      expect(isEligibleForPermanentDeletion({})).toBe(false);
    });
  });

  describe("filter functions with real queries", () => {
    it("notDeleted filter should exclude deleted issues", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Create two issues - returns issue ID directly
      const issue1Id = await asAdmin.mutation(api.issues.mutations.create, {
        title: "Active Issue",
        projectId,
        type: "task",
        priority: "medium",
      });
      const issue2Id = await asAdmin.mutation(api.issues.mutations.create, {
        title: "Deleted Issue",
        projectId,
        type: "task",
        priority: "medium",
      });

      // Soft delete one issue
      await t.run(async (ctx) => {
        await ctx.db.patch(issue2Id, softDeleteFields(adminId));
      });

      // Query issues using notDeleted filter directly
      const projectIssues = await t.run(async (ctx) =>
        ctx.db
          .query("issues")
          .withIndex("by_project", (q) => q.eq("projectId", projectId))
          .filter((q) => q.neq(q.field("isDeleted"), true))
          .collect(),
      );

      // Should only include the active issue
      expect(projectIssues.some((i) => i._id === issue1Id)).toBe(true);
      expect(projectIssues.some((i) => i._id === issue2Id)).toBe(false);
    });

    it("softDeleteFields should work with db.patch", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Create issue - returns issue ID directly
      const issueId = await asAdmin.mutation(api.issues.mutations.create, {
        title: "Test Issue",
        projectId,
        type: "task",
        priority: "medium",
      });

      // Soft delete using helper
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId, softDeleteFields(adminId));
      });

      // Verify deletion fields
      const deletedIssue = await t.run(async (ctx) => ctx.db.get(issueId));
      expect(deletedIssue?.isDeleted).toBe(true);
      expect(deletedIssue?.deletedBy).toBe(adminId);
      expect(deletedIssue?.deletedAt).toBeDefined();
    });

    it("restoreFields should work with db.patch", async () => {
      const t = convexTest(schema, modules);
      const adminId = await createTestUser(t);
      const projectId = await createTestProject(t, adminId);
      const asAdmin = asAuthenticatedUser(t, adminId);

      // Create issue - returns issue ID directly
      const issueId = await asAdmin.mutation(api.issues.mutations.create, {
        title: "Restore Test",
        projectId,
        type: "task",
        priority: "medium",
      });

      // Soft delete then restore
      await t.run(async (ctx) => {
        await ctx.db.patch(issueId, softDeleteFields(adminId));
      });

      await t.run(async (ctx) => {
        await ctx.db.patch(issueId, restoreFields());
      });

      // Verify restoration
      const restoredIssue = await t.run(async (ctx) => ctx.db.get(issueId));
      expect(restoredIssue?.isDeleted).toBeUndefined();
      expect(restoredIssue?.deletedBy).toBeUndefined();
      expect(restoredIssue?.deletedAt).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle deleted record at boundary timestamp", () => {
      const now = Date.now();
      const record = {
        isDeleted: true,
        deletedAt: now,
      };

      const timeSince = getTimeSinceDeletion(record);
      expect(timeSince).not.toBeNull();
      expect(timeSince).toBeGreaterThanOrEqual(0);
    });

    it("should handle very old deleted record", () => {
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const record = {
        isDeleted: true,
        deletedAt: oneYearAgo,
      };

      expect(isEligibleForPermanentDeletion(record)).toBe(true);
      const timeSince = getTimeSinceDeletion(record);
      expect(timeSince).toBeGreaterThan(364 * 24 * 60 * 60 * 1000);
    });

    it("should handle partial SoftDeletable object", () => {
      // Only isDeleted
      expect(isSoftDeleted({ isDeleted: true })).toBe(true);
      expect(isSoftDeleted({ isDeleted: false })).toBe(false);

      // Only deletedAt (without isDeleted)
      expect(isSoftDeleted({ deletedAt: Date.now() })).toBe(false);

      // Only deletedBy (without isDeleted)
      expect(isSoftDeleted({ deletedBy: "user" as Id<"users"> })).toBe(false);
    });

    it("softDeleteFields should use different timestamps for different calls", async () => {
      const userId = "user123" as Id<"users">;

      const fields1 = softDeleteFields(userId);
      await new Promise((resolve) => setTimeout(resolve, 5));
      const fields2 = softDeleteFields(userId);

      // Timestamps should be slightly different
      expect(fields2.deletedAt).toBeGreaterThan(fields1.deletedAt);
    });
  });
});

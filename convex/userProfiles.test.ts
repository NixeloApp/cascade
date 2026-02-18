import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./testSetup.test-helper";
import {
  asAuthenticatedUser,
  createProjectInOrganization,
  createTestContext,
  createTestUser,
} from "./testUtils";

describe("User Profiles", () => {
  // Helper to create employment type configs
  async function initializeEmploymentConfigs(asUser: ReturnType<typeof asAuthenticatedUser>) {
    return await asUser.mutation(api.userProfiles.initializeEmploymentTypes, {});
  }

  // Helper to create a project (makes user an admin)
  async function makeUserAdmin(
    t: ReturnType<typeof convexTest>,
    userId: Id<"users">,
    organizationId: Id<"organizations">,
  ) {
    return await createProjectInOrganization(t, userId, organizationId, {
      name: "Admin Project",
      key: "ADMIN",
    });
  }

  describe("initializeEmploymentTypes", () => {
    it("should create default employment type configurations", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      const result = await asUser.mutation(api.userProfiles.initializeEmploymentTypes, {});

      expect(result.message).toContain("Created 3 employment type configurations");
    });

    it("should not recreate configs if they already exist", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await asUser.mutation(api.userProfiles.initializeEmploymentTypes, {});
      const result = await asUser.mutation(api.userProfiles.initializeEmploymentTypes, {});

      expect(result.message).toContain("already exist");
    });
  });

  describe("getEmploymentTypeConfigs", () => {
    it("should return all employment type configurations", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await initializeEmploymentConfigs(asUser);

      const configs = await asUser.query(api.userProfiles.getEmploymentTypeConfigs, {});

      expect(configs).toHaveLength(3);
      expect(configs.some((c) => c.type === "employee")).toBe(true);
      expect(configs.some((c) => c.type === "contractor")).toBe(true);
      expect(configs.some((c) => c.type === "intern")).toBe(true);
    });

    it("should reject unauthenticated users", async () => {
      const t = convexTest(schema, modules);

      await expect(t.query(api.userProfiles.getEmploymentTypeConfigs, {})).rejects.toThrow(
        /authenticated/i,
      );
    });
  });

  describe("getEmploymentTypeConfig", () => {
    it("should return specific employment type configuration", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      await initializeEmploymentConfigs(asUser);

      const config = await asUser.query(api.userProfiles.getEmploymentTypeConfig, {
        type: "employee",
      });

      expect(config).not.toBeNull();
      expect(config?.type).toBe("employee");
      expect(config?.name).toBe("Full-time Employee");
      expect(config?.defaultMaxHoursPerWeek).toBe(40);
    });

    it("should return null for non-existent type", async () => {
      const t = convexTest(schema, modules);
      const { asUser } = await createTestContext(t);

      // Don't initialize configs
      const config = await asUser.query(api.userProfiles.getEmploymentTypeConfig, {
        type: "employee",
      });

      expect(config).toBeNull();
    });
  });

  describe("updateEmploymentTypeConfig", () => {
    it("should update config when user is admin", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);
      await initializeEmploymentConfigs(asUser);

      await asUser.mutation(api.userProfiles.updateEmploymentTypeConfig, {
        type: "contractor",
        defaultMaxHoursPerWeek: 30,
        defaultMaxHoursPerDay: 6,
      });

      const config = await asUser.query(api.userProfiles.getEmploymentTypeConfig, {
        type: "contractor",
      });

      expect(config?.defaultMaxHoursPerWeek).toBe(30);
      expect(config?.defaultMaxHoursPerDay).toBe(6);
    });

    it("should reject non-admin users", async () => {
      const t = convexTest(schema, modules);
      const nonAdminId = await createTestUser(t, { name: "NonAdmin", email: "nonadmin@test.com" });
      const asNonAdmin = asAuthenticatedUser(t, nonAdminId);

      // Initialize configs as someone else
      const { asUser } = await createTestContext(t);
      await initializeEmploymentConfigs(asUser);

      await expect(
        asNonAdmin.mutation(api.userProfiles.updateEmploymentTypeConfig, {
          type: "employee",
          defaultMaxHoursPerWeek: 35,
        }),
      ).rejects.toThrow(/FORBIDDEN|Admin/i);
    });
  });

  describe("upsertUserProfile", () => {
    it("should create user profile when admin", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const targetUserId = await createTestUser(t, { name: "Target", email: "target@test.com" });

      const profileId = await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: targetUserId,
        employmentType: "employee",
        maxHoursPerWeek: 40,
        maxHoursPerDay: 8,
        hasEquity: false,
        isActive: true,
      });

      expect(profileId).toBeDefined();

      const profile = await asUser.query(api.userProfiles.getUserProfile, {
        userId: targetUserId,
      });

      expect(profile?.employmentType).toBe("employee");
      expect(profile?.maxHoursPerWeek).toBe(40);
      expect(profile?.isActive).toBe(true);
    });

    it("should update existing profile", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const targetUserId = await createTestUser(t, { name: "Target", email: "target@test.com" });

      // Create profile
      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: targetUserId,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      // Update profile
      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: targetUserId,
        employmentType: "contractor",
        maxHoursPerWeek: 30,
        hasEquity: true,
        equityPercentage: 1.5,
        isActive: true,
      });

      const profile = await asUser.query(api.userProfiles.getUserProfile, {
        userId: targetUserId,
      });

      expect(profile?.employmentType).toBe("contractor");
      expect(profile?.maxHoursPerWeek).toBe(30);
      expect(profile?.hasEquity).toBe(true);
      expect(profile?.equityPercentage).toBe(1.5);
    });

    it("should reject non-admin users", async () => {
      const t = convexTest(schema, modules);
      const nonAdminId = await createTestUser(t, { name: "NonAdmin", email: "nonadmin@test.com" });
      const asNonAdmin = asAuthenticatedUser(t, nonAdminId);

      await expect(
        asNonAdmin.mutation(api.userProfiles.upsertUserProfile, {
          userId: nonAdminId,
          employmentType: "employee",
          hasEquity: false,
          isActive: true,
        }),
      ).rejects.toThrow(/FORBIDDEN|Admin/i);
    });
  });

  describe("getUserProfile", () => {
    it("should return user profile", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: userId,
        employmentType: "employee",
        department: "Engineering",
        jobTitle: "Software Engineer",
        hasEquity: true,
        equityPercentage: 0.5,
        isActive: true,
      });

      const profile = await asUser.query(api.userProfiles.getUserProfile, { userId });

      expect(profile).not.toBeNull();
      expect(profile?.department).toBe("Engineering");
      expect(profile?.jobTitle).toBe("Software Engineer");
      expect(profile?.hasEquity).toBe(true);
    });

    it("should return null for user without profile", async () => {
      const t = convexTest(schema, modules);
      const { userId, asUser } = await createTestContext(t);

      const profile = await asUser.query(api.userProfiles.getUserProfile, { userId });

      expect(profile).toBeNull();
    });
  });

  describe("getUserProfileWithDefaults", () => {
    it("should merge user profile with employment type defaults", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);
      await initializeEmploymentConfigs(asUser);

      // Create profile without maxHoursPerWeek (should use type default)
      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: userId,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      const profile = await asUser.query(api.userProfiles.getUserProfileWithDefaults, { userId });

      expect(profile).not.toBeNull();
      if (!profile || !("effectiveMaxHoursPerWeek" in profile)) {
        throw new Error("Expected profile with computed defaults");
      }
      expect(profile.effectiveMaxHoursPerWeek).toBe(40); // From employee default
      expect(profile.effectiveMaxHoursPerDay).toBe(8);
      expect(profile.typeConfig?.type).toBe("employee");
    });

    it("should use profile overrides when set", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);
      await initializeEmploymentConfigs(asUser);

      // Create profile with specific maxHoursPerWeek
      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: userId,
        employmentType: "employee",
        maxHoursPerWeek: 35, // Override the default 40
        hasEquity: false,
        isActive: true,
      });

      const profile = await asUser.query(api.userProfiles.getUserProfileWithDefaults, { userId });

      if (!profile || !("effectiveMaxHoursPerWeek" in profile)) {
        throw new Error("Expected profile with computed defaults");
      }
      expect(profile.effectiveMaxHoursPerWeek).toBe(35); // Profile override
    });
  });

  describe("listUserProfiles", () => {
    it("should return all profiles for admin", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const user2 = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
      const user3 = await createTestUser(t, { name: "User 3", email: "user3@test.com" });

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: user2,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: user3,
        employmentType: "contractor",
        hasEquity: false,
        isActive: true,
      });

      const profiles = await asUser.query(api.userProfiles.listUserProfiles, {});

      expect(profiles.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by employment type", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const user2 = await createTestUser(t, { name: "User 2", email: "user2@test.com" });
      const user3 = await createTestUser(t, { name: "User 3", email: "user3@test.com" });

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: user2,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: user3,
        employmentType: "contractor",
        hasEquity: false,
        isActive: true,
      });

      const employeeProfiles = await asUser.query(api.userProfiles.listUserProfiles, {
        employmentType: "employee",
      });

      expect(employeeProfiles.every((p) => p.employmentType === "employee")).toBe(true);
    });

    it("should return empty array for non-admin", async () => {
      const t = convexTest(schema, modules);
      const nonAdminId = await createTestUser(t, { name: "NonAdmin", email: "nonadmin@test.com" });
      const asNonAdmin = asAuthenticatedUser(t, nonAdminId);

      const profiles = await asNonAdmin.query(api.userProfiles.listUserProfiles, {});

      expect(profiles).toEqual([]);
    });
  });

  describe("getUsersWithoutProfiles", () => {
    it("should return users without profiles for admin", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      // Create a user without profile
      const newUser = await createTestUser(t, { name: "New User", email: "newuser@test.com" });

      const usersWithoutProfiles = await asUser.query(api.userProfiles.getUsersWithoutProfiles, {});

      expect(usersWithoutProfiles.some((u) => u._id === newUser)).toBe(true);
    });

    it("should return empty array for non-admin", async () => {
      const t = convexTest(schema, modules);
      const nonAdminId = await createTestUser(t, { name: "NonAdmin", email: "nonadmin@test.com" });
      const asNonAdmin = asAuthenticatedUser(t, nonAdminId);

      const users = await asNonAdmin.query(api.userProfiles.getUsersWithoutProfiles, {});

      expect(users).toEqual([]);
    });
  });

  describe("deleteUserProfile", () => {
    it("should delete user profile when admin", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const targetUser = await createTestUser(t, { name: "Target", email: "target@test.com" });

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId: targetUser,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      await asUser.mutation(api.userProfiles.deleteUserProfile, { userId: targetUser });

      const profile = await asUser.query(api.userProfiles.getUserProfile, { userId: targetUser });
      expect(profile).toBeNull();
    });

    it("should throw error for non-existent profile", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      const nonExistentUser = await createTestUser(t, {
        name: "NoProfile",
        email: "noprofile@test.com",
      });

      await expect(
        asUser.mutation(api.userProfiles.deleteUserProfile, { userId: nonExistentUser }),
      ).rejects.toThrow(/not found/i);
    });

    it("should reject non-admin users", async () => {
      const t = convexTest(schema, modules);
      const nonAdminId = await createTestUser(t, { name: "NonAdmin", email: "nonadmin@test.com" });
      const asNonAdmin = asAuthenticatedUser(t, nonAdminId);

      await expect(
        asNonAdmin.mutation(api.userProfiles.deleteUserProfile, { userId: nonAdminId }),
      ).rejects.toThrow(/FORBIDDEN|Admin/i);
    });
  });

  describe("getEquityHoursStats", () => {
    it("should return empty stats for user without equity", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId,
        employmentType: "employee",
        hasEquity: false,
        isActive: true,
      });

      const now = Date.now();
      const stats = await asUser.query(api.userProfiles.getEquityHoursStats, {
        userId,
        startDate: now - 7 * 24 * 60 * 60 * 1000, // 1 week ago
        endDate: now,
      });

      expect(stats.hasEquity).toBe(false);
      expect(stats.totalEquityHours).toBe(0);
    });

    it("should reject unauthorized access to other user stats", async () => {
      const t = convexTest(schema, modules);
      const { userId } = await createTestContext(t);

      const otherUser = await createTestUser(t, { name: "Other", email: "other@test.com" });
      const asOther = asAuthenticatedUser(t, otherUser);

      const now = Date.now();
      await expect(
        asOther.query(api.userProfiles.getEquityHoursStats, {
          userId,
          startDate: now - 7 * 24 * 60 * 60 * 1000,
          endDate: now,
        }),
      ).rejects.toThrow(/FORBIDDEN|Not authorized/i);
    });

    it("should allow user to view own stats", async () => {
      const t = convexTest(schema, modules);
      const { userId, organizationId, asUser } = await createTestContext(t);

      await makeUserAdmin(t, userId, organizationId);

      await asUser.mutation(api.userProfiles.upsertUserProfile, {
        userId,
        employmentType: "employee",
        hasEquity: true,
        equityPercentage: 1.0,
        requiredEquityHoursPerWeek: 10,
        isActive: true,
      });

      const now = Date.now();
      const stats = await asUser.query(api.userProfiles.getEquityHoursStats, {
        userId,
        startDate: now - 7 * 24 * 60 * 60 * 1000,
        endDate: now,
      });

      expect(stats.hasEquity).toBe(true);
      expect(stats.requiredEquityHoursPerWeek).toBe(10);
    });
  });
});

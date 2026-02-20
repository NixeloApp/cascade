import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { forbidden, notFound } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { notDeleted } from "./lib/softDeleteHelpers";
import { sanitizeUserForAuth } from "./lib/userUtils";
import { employmentTypes } from "./validators";

// Limits for user profile queries
const MAX_PROFILES = 500;
const MAX_TIME_ENTRIES_FOR_STATS = 1000;

// Check if user is admin (has admin role in any project they created)
async function isAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  // Check if user has created any projects (project creators are admins)
  const createdProjects = await ctx.db
    .query("projects")
    .withIndex("by_creator", (q) => q.eq("createdBy", userId))
    .filter(notDeleted)
    .first();

  if (createdProjects) return true;

  // Check if user has admin role in any project
  const adminMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .filter(notDeleted)
    .first();

  return !!adminMembership;
}

// ===== EMPLOYMENT TYPE CONFIGURATIONS =====

// Initialize default employment type configurations (run once)
export const initializeEmploymentTypes = authenticatedMutation({
  args: {},
  handler: async (ctx) => {
    // Check if configs already exist
    const existing = await ctx.db.query("employmentTypeConfigs").first();
    if (existing) {
      return { message: "Employment type configurations already exist" };
    }

    const now = Date.now();
    const configs = [
      {
        type: "employee" as const,
        name: "Full-time Employee",
        description: "Standard full-time employees with regular work hours",
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 8,
        defaultRequiresApproval: false,
        defaultCanWorkOvertime: true,
        canAccessBilling: true,
        canManageProjects: true,
        isActive: true,
        updatedAt: now,
      },
      {
        type: "contractor" as const,
        name: "Contractor",
        description: "Independent contractors with flexible hours",
        defaultMaxHoursPerWeek: 40,
        defaultMaxHoursPerDay: 10,
        defaultRequiresApproval: true,
        defaultCanWorkOvertime: true,
        canAccessBilling: false,
        canManageProjects: false,
        isActive: true,
        updatedAt: now,
      },
      {
        type: "intern" as const,
        name: "Intern",
        description: "Interns with limited work hours and supervision",
        defaultMaxHoursPerWeek: 20,
        defaultMaxHoursPerDay: 4,
        defaultRequiresApproval: true,
        defaultCanWorkOvertime: false,
        canAccessBilling: false,
        canManageProjects: false,
        isActive: true,
        updatedAt: now,
      },
    ];

    for (const config of configs) {
      await ctx.db.insert("employmentTypeConfigs", config);
    }

    return { message: `Created ${configs.length} employment type configurations` };
  },
});

// Get all employment type configurations
export const getEmploymentTypeConfigs = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Small lookup table but still add reasonable limit
    const configs = await ctx.db.query("employmentTypeConfigs").take(MAX_PAGE_SIZE);
    return configs;
  },
});

// Get a specific employment type configuration
export const getEmploymentTypeConfig = authenticatedQuery({
  args: {
    type: employmentTypes,
  },
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    return config;
  },
});

// Update employment type configuration (admin only)
export const updateEmploymentTypeConfig = authenticatedMutation({
  args: {
    type: employmentTypes,
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    defaultMaxHoursPerWeek: v.optional(v.number()),
    defaultMaxHoursPerDay: v.optional(v.number()),
    defaultRequiresApproval: v.optional(v.boolean()),
    defaultCanWorkOvertime: v.optional(v.boolean()),
    canAccessBilling: v.optional(v.boolean()),
    canManageProjects: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin", "Admin access required");
    }

    const config = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .first();

    if (!config) {
      throw notFound("employmentTypeConfig", args.type);
    }

    const updates: {
      updatedAt: number;
      name?: string;
      description?: string;
      defaultMaxHoursPerWeek?: number;
      defaultMaxHoursPerDay?: number;
      defaultRequiresApproval?: boolean;
      defaultCanWorkOvertime?: boolean;
      canAccessBilling?: boolean;
      canManageProjects?: boolean;
    } = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.defaultMaxHoursPerWeek !== undefined)
      updates.defaultMaxHoursPerWeek = args.defaultMaxHoursPerWeek;
    if (args.defaultMaxHoursPerDay !== undefined)
      updates.defaultMaxHoursPerDay = args.defaultMaxHoursPerDay;
    if (args.defaultRequiresApproval !== undefined)
      updates.defaultRequiresApproval = args.defaultRequiresApproval;
    if (args.defaultCanWorkOvertime !== undefined)
      updates.defaultCanWorkOvertime = args.defaultCanWorkOvertime;
    if (args.canAccessBilling !== undefined) updates.canAccessBilling = args.canAccessBilling;
    if (args.canManageProjects !== undefined) updates.canManageProjects = args.canManageProjects;

    await ctx.db.patch(config._id, updates);
  },
});

// ===== USER PROFILES =====

// Create or update user profile (admin only)
export const upsertUserProfile = authenticatedMutation({
  args: {
    userId: v.id("users"),
    employmentType: employmentTypes,
    maxHoursPerWeek: v.optional(v.number()),
    maxHoursPerDay: v.optional(v.number()),
    requiresApproval: v.optional(v.boolean()),
    canWorkOvertime: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    // Equity compensation
    hasEquity: v.boolean(),
    equityPercentage: v.optional(v.number()),
    requiredEquityHoursPerWeek: v.optional(v.number()),
    requiredEquityHoursPerMonth: v.optional(v.number()),
    maxEquityHoursPerWeek: v.optional(v.number()),
    equityHourlyValue: v.optional(v.number()),
    equityNotes: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check admin permissions
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin", "Admin access required");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();
    const profileData = {
      userId: args.userId,
      employmentType: args.employmentType,
      maxHoursPerWeek: args.maxHoursPerWeek,
      maxHoursPerDay: args.maxHoursPerDay,
      requiresApproval: args.requiresApproval,
      canWorkOvertime: args.canWorkOvertime,
      startDate: args.startDate,
      endDate: args.endDate,
      department: args.department,
      jobTitle: args.jobTitle,
      managerId: args.managerId,
      hasEquity: args.hasEquity ?? false,
      equityPercentage: args.equityPercentage,
      requiredEquityHoursPerWeek: args.requiredEquityHoursPerWeek,
      requiredEquityHoursPerMonth: args.requiredEquityHoursPerMonth,
      maxEquityHoursPerWeek: args.maxEquityHoursPerWeek,
      equityHourlyValue: args.equityHourlyValue,
      equityNotes: args.equityNotes,
      isActive: args.isActive,
      updatedAt: now,
    };

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, profileData);
      return existingProfile._id;
    }

    return await ctx.db.insert("userProfiles", {
      ...profileData,
      createdBy: ctx.userId,
    });
  },
});

// Get user profile
export const getUserProfile = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return profile;
  },
});

// Get user profile with computed effective hours (merging defaults with overrides)
export const getUserProfileWithDefaults = authenticatedQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    // Get employment type defaults
    const typeConfig = await ctx.db
      .query("employmentTypeConfigs")
      .withIndex("by_type", (q) => q.eq("type", profile.employmentType))
      .first();

    if (!typeConfig) return profile;

    // Merge defaults with overrides
    return {
      ...profile,
      effectiveMaxHoursPerWeek: profile.maxHoursPerWeek ?? typeConfig.defaultMaxHoursPerWeek,
      effectiveMaxHoursPerDay: profile.maxHoursPerDay ?? typeConfig.defaultMaxHoursPerDay,
      effectiveRequiresApproval: profile.requiresApproval ?? typeConfig.defaultRequiresApproval,
      effectiveCanWorkOvertime: profile.canWorkOvertime ?? typeConfig.defaultCanWorkOvertime,
      typeConfig,
    };
  },
});

// List all user profiles (admin only)
export const listUserProfiles = authenticatedQuery({
  args: {
    employmentType: v.optional(employmentTypes),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check admin permissions - return empty for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, ctx.userId))) {
      return [];
    }

    let profiles: Doc<"userProfiles">[];
    if (args.employmentType && args.isActive !== undefined) {
      const employmentType = args.employmentType;
      const isActive = args.isActive;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_employment_active", (q) =>
          q.eq("employmentType", employmentType).eq("isActive", isActive),
        )
        .filter(notDeleted)
        .take(MAX_PROFILES);
    } else if (args.employmentType) {
      const employmentType = args.employmentType;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_employment_type", (q) => q.eq("employmentType", employmentType))
        .filter(notDeleted)
        .take(MAX_PROFILES);
    } else if (args.isActive !== undefined) {
      const isActive = args.isActive;
      profiles = await ctx.db
        .query("userProfiles")
        .withIndex("by_active", (q) => q.eq("isActive", isActive))
        .take(MAX_PROFILES);
    } else {
      // Bounded query when no filters provided
      profiles = await ctx.db.query("userProfiles").take(MAX_PROFILES);
    }

    // Batch fetch users and managers to avoid N+1 queries
    const userIds = profiles.map((p) => p.userId);
    const managerIds = profiles.map((p) => p.managerId).filter(Boolean) as Id<"users">[];
    const allUserIds = [...userIds, ...managerIds];
    const userMap = await batchFetchUsers(ctx, allUserIds);

    // Enrich with pre-fetched data (no N+1)
    const profilesWithUsers = profiles.map((profile) => ({
      ...profile,
      createdAt: profile._creationTime,
      user: sanitizeUserForAuth(userMap.get(profile.userId)),
      manager: profile.managerId ? sanitizeUserForAuth(userMap.get(profile.managerId)) : null,
    }));

    return profilesWithUsers;
  },
});

// Get all users without profiles (for admin to assign)
export const getUsersWithoutProfiles = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Check admin permissions - return empty for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, ctx.userId))) {
      return [];
    }

    // Bounded queries for admin function
    const MAX_USERS = 500;
    const [allUsers, allProfiles] = await Promise.all([
      ctx.db.query("users").take(MAX_USERS),
      ctx.db.query("userProfiles").take(MAX_USERS),
    ]);

    const profileUserIds = new Set(allProfiles.map((p) => p.userId));

    // Filter users without profiles
    const usersWithoutProfiles = allUsers.filter((user) => !profileUserIds.has(user._id));

    return usersWithoutProfiles.map((user) => sanitizeUserForAuth(user)).filter((u) => u !== null);
  },
});

// Delete user profile (admin only)
export const deleteUserProfile = authenticatedMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check admin permissions
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin", "Admin access required");
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw notFound("userProfile", args.userId);
    }

    await ctx.db.delete(profile._id);
  },
});

// Get equity hours statistics for a user (for a specific time period)
export const getEquityHoursStats = authenticatedQuery({
  args: {
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  },
  handler: async (ctx, args) => {
    // Users can view their own stats, admins can view anyone's
    const isAdminUser = await isAdmin(ctx, ctx.userId);
    if (ctx.userId !== args.userId && !isAdminUser) {
      throw forbidden("equityHoursStats", "Not authorized to view equity hours for this user");
    }

    // Get user profile with equity configuration
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile?.hasEquity) {
      return {
        hasEquity: false,
        totalEquityHours: 0,
        requiredEquityHoursPerWeek: 0,
        requiredEquityHoursPerMonth: 0,
        maxEquityHoursPerWeek: 0,
      };
    }

    // Get all equity time entries for the period
    const allEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("isEquityHour"), true),
        ),
      )
      .take(MAX_TIME_ENTRIES_FOR_STATS);

    const totalEquitySeconds = allEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const totalEquityHours = totalEquitySeconds / 3600;

    const totalEquityValue = allEntries.reduce((sum, entry) => sum + (entry.equityValue || 0), 0);

    // Calculate weeks in period
    const periodDays = (args.endDate - args.startDate) / (1000 * 60 * 60 * 24);
    const weeksInPeriod = Math.ceil(periodDays / 7);

    return {
      hasEquity: true,
      totalEquityHours,
      totalEquityValue,
      entriesCount: allEntries.length,
      requiredEquityHoursPerWeek: profile.requiredEquityHoursPerWeek,
      requiredEquityHoursPerMonth: profile.requiredEquityHoursPerMonth,
      maxEquityHoursPerWeek: profile.maxEquityHoursPerWeek,
      equityHourlyValue: profile.equityHourlyValue,
      equityPercentage: profile.equityPercentage,
      weeksInPeriod,
      // Compliance metrics
      requiredTotalHours: profile.requiredEquityHoursPerWeek
        ? profile.requiredEquityHoursPerWeek * weeksInPeriod
        : 0,
      isCompliant:
        !profile.requiredEquityHoursPerWeek ||
        totalEquityHours >= profile.requiredEquityHoursPerWeek * weeksInPeriod,
    };
  },
});

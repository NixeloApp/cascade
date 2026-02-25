import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound } from "./lib/errors";
import { notDeleted } from "./lib/softDeleteHelpers";
import { periodTypes } from "./validators";

// Check if user is admin (copied from userProfiles.ts)
async function isAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const createdProjects = await ctx.db
    .query("projects")
    .withIndex("by_creator", (q) => q.eq("createdBy", userId))
    .filter(notDeleted)
    .first();

  if (createdProjects) return true;

  const adminMembership = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter((q) => q.eq(q.field("role"), "admin"))
    .filter(notDeleted)
    .first();

  return !!adminMembership;
}

// Helper to calculate start/end of week
function _getWeekBounds(date: Date): { start: number; end: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day; // Adjust to Sunday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.getTime(), end: end.getTime() };
}

// Helper to calculate start/end of month
function _getMonthBounds(date: Date): { start: number; end: number } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

// Helper: Calculate hours from time entries
function calculateHours(timeEntries: Array<{ duration: number; isEquityHour?: boolean }>) {
  const totalSeconds = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalHoursWorked = totalSeconds / 3600;

  const equityEntries = timeEntries.filter((e) => e.isEquityHour);
  const totalEquitySeconds = equityEntries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalEquityHours = totalEquitySeconds / 3600;

  return { totalHoursWorked, totalEquityHours };
}

// Helper: Determine requirements based on period type
function determineRequirements(
  profile: {
    maxHoursPerWeek?: number;
    requiredEquityHoursPerWeek?: number;
    requiredEquityHoursPerMonth?: number;
  },
  periodType: "week" | "month",
) {
  if (periodType === "week") {
    return {
      requiredHours: profile.maxHoursPerWeek || 40,
      requiredEquityHours: profile.requiredEquityHoursPerWeek || 0,
      maxHours: profile.maxHoursPerWeek || 0,
    };
  }

  return {
    requiredHours: profile.maxHoursPerWeek ? profile.maxHoursPerWeek * 4.33 : 173,
    requiredEquityHours: profile.requiredEquityHoursPerMonth || 0,
    maxHours: profile.maxHoursPerWeek ? profile.maxHoursPerWeek * 4.33 : 0,
  };
}

// Helper: Determine compliance status
function determineComplianceStatus(
  totalHoursWorked: number,
  totalEquityHours: number,
  requiredHours: number,
  requiredEquityHours: number,
  maxHours: number,
  hasEquity: boolean,
) {
  let status: "compliant" | "under_hours" | "over_hours" | "equity_under";
  let hoursDeficit = 0;
  let hoursExcess = 0;
  let equityHoursDeficit = 0;

  if (hasEquity && requiredEquityHours > 0 && totalEquityHours < requiredEquityHours) {
    status = "equity_under";
    equityHoursDeficit = requiredEquityHours - totalEquityHours;
  } else if (totalHoursWorked < requiredHours) {
    status = "under_hours";
    hoursDeficit = requiredHours - totalHoursWorked;
  } else if (maxHours > 0 && totalHoursWorked > maxHours) {
    status = "over_hours";
    hoursExcess = totalHoursWorked - maxHours;
  } else {
    status = "compliant";
  }

  return { status, hoursDeficit, hoursExcess, equityHoursDeficit };
}

// Helper: Create notification message
function createNotificationMessage(
  status: "under_hours" | "over_hours" | "equity_under",
  userName: string,
  totalHoursWorked: number,
  totalEquityHours: number,
  hoursDeficit: number,
  hoursExcess: number,
  equityHoursDeficit: number,
  requiredHours: number,
  requiredEquityHours: number,
  maxHours: number,
) {
  switch (status) {
    case "under_hours":
      return {
        title: "Hour Requirement Not Met",
        message: `${userName} worked ${totalHoursWorked.toFixed(1)} hours (${hoursDeficit.toFixed(1)} hours short of ${requiredHours} required)`,
      };
    case "over_hours":
      return {
        title: "Maximum Hours Exceeded",
        message: `${userName} worked ${totalHoursWorked.toFixed(1)} hours (${hoursExcess.toFixed(1)} hours over ${maxHours} maximum)`,
      };
    case "equity_under":
      return {
        title: "Equity Hour Requirement Not Met",
        message: `${userName} worked ${totalEquityHours.toFixed(1)} equity hours (${equityHoursDeficit.toFixed(1)} hours short of ${requiredEquityHours} required)`,
      };
  }
}

// Internal helper for compliance checking logic
async function checkUserComplianceInternal(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    periodType: "week" | "month";
    periodStart: number;
    periodEnd: number;
  },
): Promise<{ recordId: Id<"hourComplianceRecords"> }> {
  // Get user profile
  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user", (q) => q.eq("userId", args.userId))
    .first();

  if (!profile) {
    throw notFound("userProfile");
  }

  // Get all time entries for the period (bounded - typically ~30-50 entries per week/month)
  const timeEntries = await ctx.db
    .query("timeEntries")
    .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
    .filter((q) =>
      q.and(q.gte(q.field("date"), args.periodStart), q.lte(q.field("date"), args.periodEnd)),
    )
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  // Calculate hours
  const { totalHoursWorked, totalEquityHours } = calculateHours(timeEntries);

  // Determine requirements
  const { requiredHours, requiredEquityHours, maxHours } = determineRequirements(
    profile,
    args.periodType,
  );

  // Determine compliance status
  const { status, hoursDeficit, hoursExcess, equityHoursDeficit } = determineComplianceStatus(
    totalHoursWorked,
    totalEquityHours,
    requiredHours,
    requiredEquityHours,
    maxHours,
    profile.hasEquity,
  );

  // Check if record already exists for this period
  const existingRecord = await ctx.db
    .query("hourComplianceRecords")
    .withIndex("by_user_period", (q) =>
      q.eq("userId", args.userId).eq("periodStart", args.periodStart),
    )
    .first();

  const now = Date.now();
  const recordData = {
    userId: args.userId,
    periodType: args.periodType,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    totalHoursWorked,
    totalEquityHours: totalEquityHours > 0 ? totalEquityHours : undefined,
    requiredHoursPerWeek: args.periodType === "week" ? requiredHours : undefined,
    requiredHoursPerMonth: args.periodType === "month" ? requiredHours : undefined,
    requiredEquityHoursPerWeek:
      args.periodType === "week" && requiredEquityHours > 0 ? requiredEquityHours : undefined,
    requiredEquityHoursPerMonth:
      args.periodType === "month" && requiredEquityHours > 0 ? requiredEquityHours : undefined,
    maxHoursPerWeek: maxHours > 0 ? maxHours : undefined,
    status,
    hoursDeficit: hoursDeficit > 0 ? hoursDeficit : undefined,
    hoursExcess: hoursExcess > 0 ? hoursExcess : undefined,
    equityHoursDeficit: equityHoursDeficit > 0 ? equityHoursDeficit : undefined,
    notificationSent: false,
    updatedAt: now,
  };

  let recordId: Id<"hourComplianceRecords">;
  if (existingRecord) {
    await ctx.db.patch(existingRecord._id, recordData);
    recordId = existingRecord._id;
  } else {
    recordId = await ctx.db.insert("hourComplianceRecords", {
      ...recordData,
    });
  }

  // Send notifications if needed
  await sendComplianceNotifications(
    ctx,
    args.userId,
    status,
    existingRecord,
    recordId,
    totalHoursWorked,
    totalEquityHours,
    hoursDeficit,
    hoursExcess,
    equityHoursDeficit,
    requiredHours,
    requiredEquityHours,
    maxHours,
    profile.managerId,
    now,
  );

  return { recordId };
}

// Helper: Send compliance notifications
async function sendComplianceNotifications(
  ctx: MutationCtx,
  userId: Id<"users">,
  status: "compliant" | "under_hours" | "over_hours" | "equity_under",
  existingRecord: { notificationSent: boolean } | null,
  recordId: Id<"hourComplianceRecords">,
  totalHoursWorked: number,
  totalEquityHours: number,
  hoursDeficit: number,
  hoursExcess: number,
  equityHoursDeficit: number,
  requiredHours: number,
  requiredEquityHours: number,
  maxHours: number,
  managerId: Id<"users"> | undefined,
  _now: number,
) {
  if (status === "compliant" || existingRecord?.notificationSent) {
    return;
  }

  const user = await ctx.db.get(userId);
  const userName = user?.name || "User";

  const { title, message } = createNotificationMessage(
    status,
    userName,
    totalHoursWorked,
    totalEquityHours,
    hoursDeficit,
    hoursExcess,
    equityHoursDeficit,
    requiredHours,
    requiredEquityHours,
    maxHours,
  );

  // Get admin user IDs efficiently (NOT loading all users!)
  // 1. Get project creators (they are admins)
  const projectCreators = await ctx.db.query("projects").take(500);
  const creatorIds = new Set(projectCreators.map((w) => w.createdBy));

  // 2. Get project members with admin role
  const adminMembers = await ctx.db
    .query("projectMembers")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(500);
  const adminMemberIds = new Set(adminMembers.map((m) => m.userId));

  // 3. Combine and add manager if present
  const adminUserIds = new Set([...creatorIds, ...adminMemberIds]);
  if (managerId) {
    adminUserIds.add(managerId);
  }

  // Create notifications only for actual admins/managers (in parallel)
  const notifications = await Promise.all(
    [...adminUserIds].map((adminId) =>
      ctx.db.insert("notifications", {
        userId: adminId,
        type: "hour_compliance",
        title,
        message,
        isRead: false,
        isDeleted: false,
      }),
    ),
  );

  // Update record with notification info
  if (notifications.length > 0) {
    await ctx.db.patch(recordId, {
      notificationSent: true,
      notificationId: notifications[0],
    });
  }
}

// Check and record compliance for a user for a specific period
export const checkUserCompliance = authenticatedMutation({
  args: {
    userId: v.id("users"),
    periodType: periodTypes,
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    // Only admins can check compliance
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin");
    }

    return await checkUserComplianceInternal(ctx, args);
  },
});

// Check compliance for all active users for a period
export const checkAllUsersCompliance = authenticatedMutation({
  args: {
    periodType: periodTypes,
    periodStart: v.number(),
    periodEnd: v.number(),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin");
    }

    // Get active user profiles (bounded - compliance checks batch within limits)
    const profiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .filter(notDeleted)
      .take(BOUNDED_LIST_LIMIT);

    const results = [];
    for (const profile of profiles) {
      try {
        const recordId = await checkUserComplianceInternal(ctx, {
          userId: profile.userId,
          periodType: args.periodType,
          periodStart: args.periodStart,
          periodEnd: args.periodEnd,
        });
        results.push({ userId: profile.userId, recordId, success: true });
      } catch (error) {
        results.push({
          userId: profile.userId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

// List compliance records (admin only)
export const listComplianceRecords = authenticatedQuery({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("compliant"),
        v.literal("under_hours"),
        v.literal("over_hours"),
        v.literal("equity_under"),
      ),
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return empty for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, ctx.userId))) {
      return [];
    }

    let records: Doc<"hourComplianceRecords">[];

    if (args.userId && args.status) {
      const userId = args.userId;
      const status = args.status;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", status))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.userId) {
      const userId = args.userId;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 50);
    } else if (args.status) {
      const status = args.status;
      records = await ctx.db
        .query("hourComplianceRecords")
        .withIndex("by_status", (q) => q.eq("status", status))
        .order("desc")
        .take(args.limit || 50);
    } else {
      records = await ctx.db
        .query("hourComplianceRecords")
        .order("desc")
        .take(args.limit || 50);
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      records = records.filter((r) => {
        if (args.startDate && r.periodStart < args.startDate) return false;
        if (args.endDate && r.periodEnd > args.endDate) return false;
        return true;
      });
    }

    // Batch fetch user details to avoid N+1 queries
    const userIds = records.map((r) => r.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched data (no N+1)
    const recordsWithUsers = records.map((record) => ({
      ...record,
      user: userMap.get(record.userId) ?? null,
    }));

    return recordsWithUsers;
  },
});

// Get compliance summary stats
export const getComplianceSummary = authenticatedQuery({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return empty summary for non-admins (UI-driven visibility)
    if (!(await isAdmin(ctx, ctx.userId))) {
      return {
        totalRecords: 0,
        compliant: 0,
        underHours: 0,
        overHours: 0,
        equityUnder: 0,
        complianceRate: 0,
      };
    }

    let records = await ctx.db.query("hourComplianceRecords").order("desc").take(1000); // Get recent records

    // Filter by date range (JS array filter, not a DB query filter)
    if (args.startDate || args.endDate) {
      // Apply date bounds to in-memory results
      records = records.filter((r) => {
        if (args.startDate && r.periodStart < args.startDate) return false;
        if (args.endDate && r.periodEnd > args.endDate) return false;
        return true;
      });
    }

    const summary = {
      totalRecords: records.length,
      compliant: records.filter((r) => r.status === "compliant").length,
      underHours: records.filter((r) => r.status === "under_hours").length,
      overHours: records.filter((r) => r.status === "over_hours").length,
      equityUnder: records.filter((r) => r.status === "equity_under").length,
      complianceRate:
        records.length > 0
          ? (records.filter((r) => r.status === "compliant").length / records.length) * 100
          : 0,
    };

    return summary;
  },
});

// Mark compliance record as reviewed
export const reviewComplianceRecord = authenticatedMutation({
  args: {
    recordId: v.id("hourComplianceRecords"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isAdmin(ctx, ctx.userId))) {
      throw forbidden("admin");
    }

    await ctx.db.patch(args.recordId, {
      reviewedBy: ctx.userId,
      reviewedAt: Date.now(),
      reviewNotes: args.notes,
    });
  },
});

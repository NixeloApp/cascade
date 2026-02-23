import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import {
  batchFetchIssues,
  batchFetchProjects,
  batchFetchUsers,
} from "./lib/batchHelpers";
import { getUserName } from "./lib/userUtils";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";
import { DAY, HOUR, SECOND } from "./lib/timeUtils";
import { assertCanAccessProject, assertIsProjectAdmin } from "./projectAccess";
import { rateTypes } from "./validators";

// Time entries can be large - use a reasonable limit
const MAX_TIME_ENTRIES = 500;

/**
 * Native Time Tracking - Kimai-like Features
 *
 * Track time on projects and issues, calculate burn rate,
 * manage costs and hourly rates.
 */

// Helper: Build time entry field updates
function buildTimeEntryUpdates(args: {
  description?: string;
  activity?: string;
  tags?: string[];
  billable?: boolean;
  startTime?: number;
  endTime?: number;
}): Record<string, unknown> {
  const updates: Record<string, unknown> = { updatedAt: Date.now() };

  if (args.description !== undefined) updates.description = args.description;
  if (args.activity !== undefined) updates.activity = args.activity;
  if (args.tags !== undefined) updates.tags = args.tags;
  if (args.billable !== undefined) updates.billable = args.billable;
  if (args.startTime !== undefined) updates.startTime = args.startTime;
  if (args.endTime !== undefined) updates.endTime = args.endTime;

  return updates;
}

// Helper: Calculate duration and cost for time entry
function calculateTimeEntryCost(
  startTime: number,
  endTime: number,
  hourlyRate?: number,
): { duration: number; totalCost: number } {
  const duration = Math.floor((endTime - startTime) / SECOND);
  const hours = duration / (HOUR / SECOND);
  const totalCost = hourlyRate ? hours * hourlyRate : 0;

  return { duration, totalCost };
}

// ===== Time Entry Management =====

export const startTimer = authenticatedMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    billable: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if user has any running timers - just need to know if one exists
    const runningTimer = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (runningTimer) {
      throw conflict("You already have a running timer. Stop it first.");
    }

    // Check project permissions if specified
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, ctx.userId);
    }

    // Get user's current rate
    const rate = await getUserCurrentRate(ctx, ctx.userId, args.projectId);

    const now = Date.now();
    const startOfDay = new Date(now).setHours(0, 0, 0, 0);

    return await ctx.db.insert("timeEntries", {
      userId: ctx.userId,
      projectId: args.projectId,
      issueId: args.issueId,
      startTime: now,
      endTime: undefined,
      duration: 0,
      date: startOfDay,
      description: args.description,
      activity: args.activity,
      tags: args.tags ?? [],
      hourlyRate: rate?.hourlyRate,
      totalCost: 0,
      currency: rate?.currency || "USD",
      billable: args.billable ?? false,
      billed: false,
      invoiceId: undefined,
      isEquityHour: false,
      equityValue: undefined,
      isLocked: false,
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
      updatedAt: now,
    });
  },
});

export const stopTimer = authenticatedMutation({
  args: {
    entryId: v.id("timeEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw notFound("timeEntry", args.entryId);
    }

    if (entry.userId !== ctx.userId) {
      throw forbidden();
    }

    if (entry.endTime) {
      throw conflict("Timer already stopped");
    }

    const now = Date.now();
    const duration = Math.floor((now - entry.startTime) / SECOND); // seconds
    const hours = duration / (HOUR / SECOND);
    const totalCost = entry.hourlyRate ? hours * entry.hourlyRate : 0;

    await ctx.db.patch(args.entryId, {
      endTime: now,
      duration,
      totalCost,
      updatedAt: now,
    });

    return { duration, totalCost };
  },
});

export const createTimeEntry = authenticatedMutation({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    billable: v.optional(v.boolean()),
    isEquityHour: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check project permissions if specified
    if (args.projectId) {
      await assertCanAccessProject(ctx, args.projectId, ctx.userId);
    }

    // Validate time range
    if (args.endTime <= args.startTime) {
      throw validation("endTime", "End time must be after start time");
    }

    // Get user's current rate
    const rate = await getUserCurrentRate(ctx, ctx.userId, args.projectId);

    const duration = Math.floor((args.endTime - args.startTime) / SECOND);
    const hours = duration / (HOUR / SECOND);
    const totalCost = rate?.hourlyRate ? hours * rate.hourlyRate : 0;

    const now = Date.now();
    const startOfDay = new Date(args.startTime).setHours(0, 0, 0, 0);

    return await ctx.db.insert("timeEntries", {
      userId: ctx.userId,
      projectId: args.projectId,
      issueId: args.issueId,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      date: startOfDay,
      description: args.description,
      activity: args.activity,
      tags: args.tags || [],
      hourlyRate: rate?.hourlyRate,
      totalCost,
      currency: rate?.currency || "USD",
      billable: args.billable ?? true,
      billed: false,
      invoiceId: undefined,
      isEquityHour: args.isEquityHour ?? false,
      equityValue: undefined,
      isLocked: false,
      isApproved: false,
      approvedBy: undefined,
      approvedAt: undefined,
      updatedAt: now,
    });
  },
});

export const updateTimeEntry = authenticatedMutation({
  args: {
    entryId: v.id("timeEntries"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    description: v.optional(v.string()),
    activity: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    billable: v.optional(v.boolean()),
    isEquityHour: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw notFound("timeEntry", args.entryId);
    }

    if (entry.userId !== ctx.userId) {
      throw forbidden();
    }

    if (entry.isLocked) {
      throw forbidden(undefined, "Cannot edit locked time entry");
    }

    // Build basic field updates
    const updates = buildTimeEntryUpdates(args);

    // Recalculate duration and cost if times changed
    const startTime = args.startTime ?? entry.startTime;
    const endTime = args.endTime ?? entry.endTime;

    if (endTime && startTime) {
      const { duration, totalCost } = calculateTimeEntryCost(startTime, endTime, entry.hourlyRate);
      updates.duration = duration;
      updates.totalCost = totalCost;
    }

    await ctx.db.patch(args.entryId, updates);
  },
});

export const deleteTimeEntry = authenticatedMutation({
  args: {
    entryId: v.id("timeEntries"),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw notFound("timeEntry", args.entryId);
    }

    if (entry.userId !== ctx.userId) {
      throw forbidden();
    }

    if (entry.isLocked) {
      throw forbidden(undefined, "Cannot delete locked time entry");
    }

    if (entry.billed) {
      throw forbidden(undefined, "Cannot delete billed time entry");
    }

    await ctx.db.delete(args.entryId);
  },
});

// ===== Queries =====

export const getRunningTimer = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    const runningTimer = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first();

    if (!runningTimer) {
      return null;
    }

    // Enrich with project and issue data
    const project = runningTimer.projectId ? await ctx.db.get(runningTimer.projectId) : null;
    const issue = runningTimer.issueId ? await ctx.db.get(runningTimer.issueId) : null;

    // Calculate current duration
    const now = Date.now();
    const currentDuration = Math.floor((now - runningTimer.startTime) / SECOND);
    const hours = currentDuration / (HOUR / SECOND);
    const currentCost = runningTimer.hourlyRate ? hours * runningTimer.hourlyRate : 0;

    return {
      ...runningTimer,
      currentDuration,
      currentCost,
      project: project
        ? {
            _id: project._id,
            name: project.name,
            key: project.key,
          }
        : null,
      issue: issue
        ? {
            _id: issue._id,
            key: issue.key,
            title: issue.title,
          }
        : null,
    };
  },
});

export const listTimeEntries = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || ctx.userId;

    let entries: Doc<"timeEntries">[];

    if (args.projectId && args.startDate !== undefined && args.endDate !== undefined) {
      const startDate = args.startDate;
      const endDate = args.endDate;
      const projectId = args.projectId;
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project_date", (q) =>
          q.eq("projectId", projectId).gte("date", startDate).lte("date", endDate),
        )
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .take(args.limit || 100);
    } else if (args.startDate !== undefined && args.endDate !== undefined) {
      const startDate = args.startDate;
      const endDate = args.endDate;
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_user_date", (q) =>
          q.eq("userId", userId).gte("date", startDate).lte("date", endDate),
        )
        .order("desc")
        .take(args.limit || 100);
    } else if (args.issueId) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .take(args.limit || 100);
    } else {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(args.limit || 100);
    }

    // Batch fetch all related data (avoid N+1!)
    const userIds = entries.map((e) => e.userId);
    const projectIds = entries.map((e) => e.projectId);
    const issueIds = entries.map((e) => e.issueId);

    const [userMap, projectMap, issueMap] = await Promise.all([
      batchFetchUsers(ctx, userIds),
      batchFetchProjects(ctx, projectIds),
      batchFetchIssues(ctx, issueIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    return entries.map((entry) => {
      const user = userMap.get(entry.userId);
      const project = entry.projectId ? projectMap.get(entry.projectId) : null;
      const issue = entry.issueId ? issueMap.get(entry.issueId) : null;

      return {
        ...entry,
        user: user
          ? {
              _id: user._id,
              name: user.name || user.email || "Unknown",
              email: user.email,
              image: user.image,
            }
          : null,
        project: project
          ? {
              _id: project._id,
              name: project.name,
              key: project.key,
            }
          : null,
        issue: issue
          ? {
              _id: issue._id,
              key: issue.key,
              title: issue.title,
            }
          : null,
      };
    });
  },
});

// Get current week timesheet for the logged in user
export const getCurrentWeekTimesheet = authenticatedQuery({
  args: {},
  handler: async (ctx) => {
    // Calculate week start (Monday) and end (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const startDate = weekStart.getTime();
    const endDate = weekEnd.getTime();

    // Get all entries for the week
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", ctx.userId).gte("date", startDate).lte("date", endDate),
      )
      .take(MAX_TIME_ENTRIES);

    // Group by day

    // Batch fetch project and issue data
    const projectIds = [
      ...new Set(entries.map((e) => e.projectId).filter((id): id is Id<"projects"> => !!id)),
    ];
    const issueIds = [
      ...new Set(entries.map((e) => e.issueId).filter((id): id is Id<"issues"> => !!id)),
    ];

    const [projectMap, issueMap] = await Promise.all([
      batchFetchProjects(ctx, projectIds),
      batchFetchIssues(ctx, issueIds),
    ]);

    // Enrich entries first to let TypeScript infer the type
    const enrichedEntries = entries.map((entry) => {
      const project = entry.projectId ? projectMap.get(entry.projectId) : undefined;
      const issue = entry.issueId ? issueMap.get(entry.issueId) : undefined;
      const hours = entry.duration / (HOUR / SECOND);

      return {
        ...entry,
        hours,
        projectKey: project?.key,
        issueKey: issue?.key,
      };
    });

    const byDay: Record<string, typeof enrichedEntries> = {};
    let totalHours = 0;
    let billableHours = 0;

    for (const entry of enrichedEntries) {
      const dayKey = new Date(entry.date).toISOString().split("T")[0];

      if (!byDay[dayKey]) {
        byDay[dayKey] = [];
      }

      byDay[dayKey].push(entry);
      totalHours += entry.hours;

      if (entry.billable) {
        billableHours += entry.hours;
      }
    }

    return {
      startDate,
      endDate,
      byDay,
      totalHours,
      billableHours,
      entries: entries.length,
    };
  },
});

// ===== Burn Rate & Cost Analysis =====

export const getBurnRate = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Check permissions - strictly admin only for financial data
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Get all time entries in date range
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_project_date", (q) =>
        q.eq("projectId", args.projectId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .take(MAX_TIME_ENTRIES);

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Calculate totals
    let totalCost = 0;
    let totalHours = 0;
    let billableHours = 0;
    let billableCost = 0;

    const userCosts: Record<string, { hours: number; cost: number; name: string }> = {};

    for (const entry of entries) {
      const hours = entry.duration / (HOUR / SECOND);
      const cost = entry.totalCost || 0;

      totalHours += hours;
      totalCost += cost;

      if (entry.billable) {
        billableHours += hours;
        billableCost += cost;
      }

      // Track per-user costs (using pre-fetched data)
      const userIdStr = entry.userId;
      if (!userCosts[userIdStr]) {
        const user = userMap.get(entry.userId);
        userCosts[userIdStr] = {
          hours: 0,
          cost: 0,
          name: getUserName(user),
        };
      }
      userCosts[userIdStr].hours += hours;
      userCosts[userIdStr].cost += cost;
    }

    // Calculate burn rate (cost per day/week/month)
    const days = Math.max(1, (args.endDate - args.startDate) / DAY);
    const burnRatePerDay = totalCost / days;
    const burnRatePerWeek = burnRatePerDay * 7;
    const burnRatePerMonth = burnRatePerDay * 30;

    return {
      totalCost,
      totalHours,
      billableCost,
      billableHours,
      burnRatePerDay,
      burnRatePerWeek,
      burnRatePerMonth,
      userCosts: Object.entries(userCosts).map(([userId, data]) => ({
        userId,
        ...data,
      })),
      entriesCount: entries.length,
    };
  },
});

export const getTeamCosts = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Check permissions - strictly admin only for financial data
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Get all time entries in date range
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_project_date", (q) =>
        q.eq("projectId", args.projectId).gte("date", args.startDate).lte("date", args.endDate),
      )
      .take(MAX_TIME_ENTRIES);

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Group by user (using pre-fetched data)
    const userCosts: Record<
      string,
      {
        hours: number;
        cost: number;
        user: {
          _id: Id<"users">;
          name: string;
          email: string | undefined;
          image: string | undefined;
        } | null;
        billableHours: number;
        billableCost: number;
      }
    > = {};

    for (const entry of entries) {
      const userIdStr = entry.userId;
      if (!userCosts[userIdStr]) {
        const user = userMap.get(entry.userId);
        userCosts[userIdStr] = {
          hours: 0,
          cost: 0,
          billableHours: 0,
          billableCost: 0,
          user: user
            ? {
                _id: user._id,
                name: user.name || user.email || "Unknown",
                email: user.email,
                image: user.image,
              }
            : null,
        };
      }

      const hours = entry.duration / (HOUR / SECOND);
      const cost = entry.totalCost || 0;

      userCosts[userIdStr].hours += hours;
      userCosts[userIdStr].cost += cost;

      if (entry.billable) {
        userCosts[userIdStr].billableHours += hours;
        userCosts[userIdStr].billableCost += cost;
      }
    }

    return Object.values(userCosts).sort((a, b) => b.cost - a.cost);
  },
});

// ===== User Rates Management =====

export const setUserRate = authenticatedMutation({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    hourlyRate: v.number(),
    currency: v.string(),
    rateType: rateTypes,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check permissions - must be admin of project or setting own rate
    if (args.projectId) {
      await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);
    } else if (args.userId !== ctx.userId) {
      throw forbidden();
    }

    // End current rate for this user/project/type combination
    const currentRates = await ctx.db
      .query("userRates")
      .withIndex("by_user_project", (q) =>
        q.eq("userId", args.userId).eq("projectId", args.projectId),
      )
      .take(MAX_PAGE_SIZE);

    const now = Date.now();

    // Close existing rates of the same type (in parallel)
    const ratesToClose = currentRates.filter(
      (rate) => rate.rateType === args.rateType && !rate.effectiveTo,
    );
    await Promise.all(ratesToClose.map((rate) => ctx.db.patch(rate._id, { effectiveTo: now })));

    // Create new rate
    return await ctx.db.insert("userRates", {
      userId: args.userId,
      projectId: args.projectId,
      hourlyRate: args.hourlyRate,
      currency: args.currency,
      effectiveFrom: now,
      effectiveTo: undefined,
      rateType: args.rateType,
      setBy: ctx.userId,
      notes: args.notes,
      updatedAt: now,
    });
  },
});

export const getUserRate = authenticatedQuery({
  args: {
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    rateType: v.optional(rateTypes),
  },
  handler: async (ctx, args) => {
    return await getUserCurrentRate(ctx, args.userId, args.projectId, args.rateType);
  },
});

export const listUserRates = authenticatedQuery({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    // Check permissions if project-specific
    if (args.projectId) {
      await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);
    }

    const rates = args.projectId
      ? await ctx.db
          .query("userRates")
          .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
          .filter((q) => q.eq(q.field("effectiveTo"), undefined))
          .take(MAX_PAGE_SIZE)
      : await ctx.db
          .query("userRates")
          .withIndex("by_effective_to", (q) => q.eq("effectiveTo", undefined))
          .take(MAX_PAGE_SIZE);

    // Batch fetch all users (avoid N+1!)
    const userIds = rates.map((r) => r.userId);
    const userMap = await batchFetchUsers(ctx, userIds);

    // Enrich with pre-fetched user data
    return rates.map((rate) => {
      const user = userMap.get(rate.userId);
      return {
        ...rate,
        user: user
          ? {
              _id: user._id,
              name: user.name || user.email || "Unknown",
              email: user.email,
            }
          : null,
      };
    });
  },
});

// Get billing summary for a project
export const getProjectBilling = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertIsProjectAdmin(ctx, args.projectId, ctx.userId);

    // Get time entries for this project
    let entries: Doc<"timeEntries">[];
    const { startDate, endDate } = args;
    if (startDate !== undefined && endDate !== undefined) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project_date", (q) =>
          q.eq("projectId", args.projectId).gte("date", startDate).lte("date", endDate),
        )
        .take(MAX_TIME_ENTRIES);
    } else {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
        .take(MAX_TIME_ENTRIES);
    }

    // Batch fetch all users upfront (avoid N+1!)
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userMap = await batchFetchUsers(ctx, userIds);

    // Aggregate stats
    let totalHours = 0;
    let billableHours = 0;
    let totalRevenue = 0;

    // FIX: Group by userId (not userName) to avoid merging different users with same name
    const byUserData: Record<
      string,
      { name: string; hours: number; billableHours: number; revenue: number }
    > = {};

    for (const entry of entries) {
      const hours = entry.duration / (HOUR / SECOND);
      totalHours += hours;

      if (entry.billable) {
        billableHours += hours;
        totalRevenue += entry.totalCost || 0;
      }

      // Group by userId (using pre-fetched data)
      const userIdStr = entry.userId.toString();
      if (!byUserData[userIdStr]) {
        const user = userMap.get(entry.userId);
        byUserData[userIdStr] = {
          name: getUserName(user),
          hours: 0,
          billableHours: 0,
          revenue: 0,
        };
      }

      byUserData[userIdStr].hours += hours;
      if (entry.billable) {
        byUserData[userIdStr].billableHours += hours;
        byUserData[userIdStr].revenue += entry.totalCost || 0;
      }
    }

    return {
      totalHours,
      billableHours,
      nonBillableHours: totalHours - billableHours,
      totalRevenue,
      entries: entries.length,
      byUser: byUserData,
    };
  },
});

// ===== Helper Functions =====

async function getUserCurrentRate(
  ctx: { db: QueryCtx["db"] },
  userId: Id<"users">,
  projectId?: Id<"projects">,
  rateType?: "internal" | "billable",
) {
  // Try project-specific rate first
  if (projectId) {
    const projectRate = await ctx.db
      .query("userRates")
      .withIndex("by_user_project", (q) => q.eq("userId", userId).eq("projectId", projectId))
      .filter((q) => q.eq(q.field("effectiveTo"), undefined))
      .first();

    if (projectRate && (!rateType || projectRate.rateType === rateType)) {
      return projectRate;
    }
  }

  // Fall back to default user rate
  const defaultRate = await ctx.db
    .query("userRates")
    .withIndex("by_user_project", (q) => q.eq("userId", userId).eq("projectId", undefined))
    .filter((q) => q.eq(q.field("effectiveTo"), undefined))
    .first();

  if (defaultRate && (!rateType || defaultRate.rateType === rateType)) {
    return defaultRate;
  }

  return null;
}

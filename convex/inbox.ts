/**
 * Inbox/Triage API
 *
 * Handles issue triage workflow. Issues can be submitted to the inbox
 * where they await review before being accepted into the backlog.
 *
 * Status Flow:
 * - pending: Newly submitted, awaiting triage
 * - accepted: Approved and added to backlog
 * - declined: Rejected (with optional reason)
 * - snoozed: Hidden until a specific date
 * - duplicate: Marked as duplicate of another issue
 */

import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { authenticatedQuery, projectEditorMutation, projectQuery } from "./customFunctions";
import { BOUNDED_RELATION_LIMIT } from "./lib/boundedQueries";
import { forbidden, notFound, validation } from "./lib/errors";
import { inboxIssueSources, inboxIssueStatuses } from "./validators";

// =============================================================================
// Types
// =============================================================================

export type InboxIssueWithDetails = Doc<"inboxIssues"> & {
  issue: Doc<"issues">;
  createdByUser: Pick<Doc<"users">, "_id" | "name" | "image"> | null;
  triagedByUser: Pick<Doc<"users">, "_id" | "name" | "image"> | null;
  duplicateOfIssue: Pick<Doc<"issues">, "_id" | "key" | "title"> | null;
};

// =============================================================================
// Queries
// =============================================================================

/** List inbox issues for a project with optional status filter */
export const list = projectQuery({
  args: {
    status: v.optional(inboxIssueStatuses),
    tab: v.optional(v.union(v.literal("open"), v.literal("closed"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("inboxIssues")
      .withIndex("by_project_status", (q) => q.eq("projectId", ctx.projectId));

    // Filter by specific status or tab
    if (args.status) {
      const statusValue = args.status;
      query = ctx.db
        .query("inboxIssues")
        .withIndex("by_project_status", (q) =>
          q.eq("projectId", ctx.projectId).eq("status", statusValue),
        );
    }

    const inboxIssues = await query.order("desc").take(limit);

    // Filter by tab if provided (open = pending/snoozed, closed = accepted/declined/duplicate)
    let filtered = inboxIssues;
    if (args.tab === "open") {
      filtered = inboxIssues.filter((i) => i.status === "pending" || i.status === "snoozed");
    } else if (args.tab === "closed") {
      filtered = inboxIssues.filter(
        (i) => i.status === "accepted" || i.status === "declined" || i.status === "duplicate",
      );
    }

    // Batch fetch related data
    const issueIds = filtered.map((i) => i.issueId);
    const userIds = [
      ...new Set([
        ...filtered.map((i) => i.createdBy),
        ...filtered.map((i) => i.triagedBy).filter(Boolean),
      ]),
    ] as Id<"users">[];
    const duplicateIds = filtered.map((i) => i.duplicateOfId).filter(Boolean) as Id<"issues">[];

    const [issues, users, duplicates] = await Promise.all([
      Promise.all(issueIds.map((id) => ctx.db.get(id))),
      Promise.all(userIds.map((id) => ctx.db.get(id))),
      Promise.all(duplicateIds.map((id) => ctx.db.get(id))),
    ]);

    // Create lookup maps - use type-safe filtering
    const validIssues = issues.filter((i): i is NonNullable<typeof i> => i !== null);
    const validUsers = users.filter((u): u is NonNullable<typeof u> => u !== null);
    const validDuplicates = duplicates.filter((i): i is NonNullable<typeof i> => i !== null);

    const issueMap = new Map(validIssues.map((i) => [i._id, i]));
    const userMap = new Map(
      validUsers.map((u) => [u._id, { _id: u._id, name: u.name, image: u.image }]),
    );
    const duplicateMap = new Map(
      validDuplicates.map((i) => [i._id, { _id: i._id, key: i.key, title: i.title }]),
    );

    // Assemble results
    return filtered
      .map((inboxIssue) => {
        const issue = issueMap.get(inboxIssue.issueId);
        if (!issue) return null;

        return {
          ...inboxIssue,
          issue,
          createdByUser: userMap.get(inboxIssue.createdBy) ?? null,
          triagedByUser: inboxIssue.triagedBy ? (userMap.get(inboxIssue.triagedBy) ?? null) : null,
          duplicateOfIssue: inboxIssue.duplicateOfId
            ? (duplicateMap.get(inboxIssue.duplicateOfId) ?? null)
            : null,
        };
      })
      .filter(Boolean) as InboxIssueWithDetails[];
  },
});

/** Get a single inbox issue by ID */
export const get = authenticatedQuery({
  args: {
    id: v.id("inboxIssues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      return null;
    }

    // Get related data
    const [issue, createdByUser, triagedByUser, duplicateOfIssue] = await Promise.all([
      ctx.db.get(inboxIssue.issueId),
      ctx.db.get(inboxIssue.createdBy),
      inboxIssue.triagedBy ? ctx.db.get(inboxIssue.triagedBy) : null,
      inboxIssue.duplicateOfId ? ctx.db.get(inboxIssue.duplicateOfId) : null,
    ]);

    if (!issue) {
      return null;
    }

    return {
      ...inboxIssue,
      issue,
      createdByUser: createdByUser
        ? { _id: createdByUser._id, name: createdByUser.name, image: createdByUser.image }
        : null,
      triagedByUser: triagedByUser
        ? { _id: triagedByUser._id, name: triagedByUser.name, image: triagedByUser.image }
        : null,
      duplicateOfIssue: duplicateOfIssue
        ? { _id: duplicateOfIssue._id, key: duplicateOfIssue.key, title: duplicateOfIssue.title }
        : null,
    };
  },
});

/** Get inbox counts for a project (for badges) */
export const getCounts = projectQuery({
  args: {},
  handler: async (ctx) => {
    const inboxIssues = await ctx.db
      .query("inboxIssues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .take(BOUNDED_RELATION_LIMIT);

    const counts = {
      pending: 0,
      snoozed: 0,
      accepted: 0,
      declined: 0,
      duplicate: 0,
      total: inboxIssues.length,
      open: 0,
      closed: 0,
    };

    for (const item of inboxIssues) {
      counts[item.status]++;
      if (item.status === "pending" || item.status === "snoozed") {
        counts.open++;
      } else {
        counts.closed++;
      }
    }

    return counts;
  },
});

/** Check if an issue is in the inbox */
export const getByIssueId = authenticatedQuery({
  args: {
    issueId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db
      .query("inboxIssues")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .first();

    return inboxIssue;
  },
});

// =============================================================================
// Mutations
// =============================================================================

/** Submit an issue to the inbox for triage */
export const submit = projectEditorMutation({
  args: {
    issueId: v.id("issues"),
    source: v.optional(inboxIssueSources),
    sourceEmail: v.optional(v.string()),
  },
  returns: v.object({ inboxIssueId: v.id("inboxIssues") }),
  handler: async (ctx, args) => {
    // Verify issue exists and belongs to this project
    const issue = await ctx.db.get(args.issueId);
    if (!issue || issue.isDeleted) {
      throw notFound("issue", args.issueId);
    }
    if (issue.projectId !== ctx.projectId) {
      throw validation("issueId", "Issue does not belong to this project");
    }

    // Check if issue is already in inbox
    const existing = await ctx.db
      .query("inboxIssues")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .first();

    if (existing) {
      throw validation("issueId", "Issue is already in the inbox");
    }

    const now = Date.now();
    const inboxIssueId = await ctx.db.insert("inboxIssues", {
      projectId: ctx.projectId,
      issueId: args.issueId,
      status: "pending",
      source: args.source ?? "in_app",
      sourceEmail: args.sourceEmail,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
    });

    return { inboxIssueId };
  },
});

/** Accept an inbox issue (move to backlog) */
export const accept = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
    triageNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to triage this inbox issue");
    }
    if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") {
      throw validation("status", "Can only accept pending or snoozed issues");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "accepted",
      triageNotes: args.triageNotes,
      triagedBy: ctx.userId,
      triagedAt: now,
      updatedAt: now,
    });

    // Create notification for the issue creator
    const issue = await ctx.db.get(inboxIssue.issueId);
    if (issue && issue.reporterId !== ctx.userId) {
      await ctx.db.insert("notifications", {
        userId: issue.reporterId,
        type: "inbox_accepted",
        title: "Issue accepted",
        message: `Your issue "${issue.title}" has been accepted into the backlog.`,
        issueId: issue._id,
        projectId: ctx.projectId,
        actorId: ctx.userId,
        isRead: false,
        isDeleted: false,
      });
    }

    return { success: true };
  },
});

/** Decline an inbox issue */
export const decline = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to triage this inbox issue");
    }
    if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") {
      throw validation("status", "Can only decline pending or snoozed issues");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "declined",
      declineReason: args.reason,
      triagedBy: ctx.userId,
      triagedAt: now,
      updatedAt: now,
    });

    // Create notification for the issue creator
    const issue = await ctx.db.get(inboxIssue.issueId);
    if (issue && issue.reporterId !== ctx.userId) {
      await ctx.db.insert("notifications", {
        userId: issue.reporterId,
        type: "inbox_declined",
        title: "Issue declined",
        message: `Your issue "${issue.title}" was declined.${args.reason ? ` Reason: ${args.reason}` : ""}`,
        issueId: issue._id,
        projectId: ctx.projectId,
        actorId: ctx.userId,
        isRead: false,
        isDeleted: false,
      });
    }

    return { success: true };
  },
});

/** Snooze an inbox issue until a specific date */
export const snooze = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to triage this inbox issue");
    }
    if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") {
      throw validation("status", "Can only snooze pending or snoozed issues");
    }

    // Validate snooze date is in the future
    if (args.until <= Date.now()) {
      throw validation("until", "Snooze date must be in the future");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "snoozed",
      snoozedUntil: args.until,
      triagedBy: ctx.userId,
      triagedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/** Unsnooze an inbox issue (return to pending) */
export const unsnooze = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to triage this inbox issue");
    }
    if (inboxIssue.status !== "snoozed") {
      throw validation("status", "Can only unsnooze snoozed issues");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "pending",
      snoozedUntil: undefined,
      updatedAt: now,
    });

    return { success: true };
  },
});

/** Mark an inbox issue as a duplicate */
export const markDuplicate = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
    duplicateOfId: v.id("issues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to triage this inbox issue");
    }
    if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") {
      throw validation("status", "Can only mark pending or snoozed issues as duplicate");
    }

    // Verify the duplicate target exists
    const duplicateOf = await ctx.db.get(args.duplicateOfId);
    if (!duplicateOf || duplicateOf.isDeleted) {
      throw notFound("duplicate target issue", args.duplicateOfId);
    }

    // Can't mark as duplicate of itself
    if (inboxIssue.issueId === args.duplicateOfId) {
      throw validation("duplicateOfId", "Cannot mark issue as duplicate of itself");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "duplicate",
      duplicateOfId: args.duplicateOfId,
      triagedBy: ctx.userId,
      triagedAt: now,
      updatedAt: now,
    });

    // Create notification for the issue creator
    const issue = await ctx.db.get(inboxIssue.issueId);
    if (issue && issue.reporterId !== ctx.userId) {
      await ctx.db.insert("notifications", {
        userId: issue.reporterId,
        type: "inbox_duplicate",
        title: "Issue marked as duplicate",
        message: `Your issue "${issue.title}" was marked as a duplicate of ${duplicateOf.key}.`,
        issueId: issue._id,
        projectId: ctx.projectId,
        actorId: ctx.userId,
        isRead: false,
        isDeleted: false,
      });
    }

    return { success: true };
  },
});

/** Delete an inbox issue (only creator or admin) */
export const remove = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to delete this inbox issue");
    }

    // Only creator or project admin can delete
    // Note: projectEditorMutation already ensures editor+ role
    if (inboxIssue.createdBy !== ctx.userId && ctx.role !== "admin") {
      throw forbidden(undefined, "Only the creator or admin can delete inbox issues");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/** Reopen a closed inbox issue (return to pending) */
export const reopen = projectEditorMutation({
  args: {
    id: v.id("inboxIssues"),
  },
  handler: async (ctx, args) => {
    const inboxIssue = await ctx.db.get(args.id);
    if (!inboxIssue) {
      throw notFound("inbox issue", args.id);
    }
    if (inboxIssue.projectId !== ctx.projectId) {
      throw forbidden(undefined, "Not authorized to reopen this inbox issue");
    }
    if (inboxIssue.status === "pending" || inboxIssue.status === "snoozed") {
      throw validation("status", "Issue is already open");
    }

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "pending",
      snoozedUntil: undefined,
      duplicateOfId: undefined,
      declineReason: undefined,
      triagedBy: undefined,
      triagedAt: undefined,
      updatedAt: now,
    });

    return { success: true };
  },
});

// =============================================================================
// BULK TRIAGE OPERATIONS
// =============================================================================

/** Bulk accept multiple inbox issues */
export const bulkAccept = projectEditorMutation({
  args: {
    inboxIssueIds: v.array(v.id("inboxIssues")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let accepted = 0;

    for (const id of args.inboxIssueIds) {
      const inboxIssue = await ctx.db.get(id);
      if (!inboxIssue) continue;
      if (inboxIssue.projectId !== ctx.projectId) continue;
      if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") continue;

      await ctx.db.patch(id, {
        status: "accepted",
        triagedBy: ctx.userId,
        triagedAt: now,
        updatedAt: now,
      });

      // Create notification for the issue creator
      const issue = await ctx.db.get(inboxIssue.issueId);
      if (issue && issue.reporterId !== ctx.userId) {
        await ctx.db.insert("notifications", {
          userId: issue.reporterId,
          type: "inbox_accepted",
          title: "Issue accepted",
          message: `Your issue "${issue.title}" has been accepted into the backlog.`,
          issueId: issue._id,
          projectId: ctx.projectId,
          actorId: ctx.userId,
          isRead: false,
          isDeleted: false,
        });
      }

      accepted++;
    }

    return { accepted };
  },
});

/** Bulk decline multiple inbox issues */
export const bulkDecline = projectEditorMutation({
  args: {
    inboxIssueIds: v.array(v.id("inboxIssues")),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let declined = 0;

    for (const id of args.inboxIssueIds) {
      const inboxIssue = await ctx.db.get(id);
      if (!inboxIssue) continue;
      if (inboxIssue.projectId !== ctx.projectId) continue;
      if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") continue;

      await ctx.db.patch(id, {
        status: "declined",
        declineReason: args.reason,
        triagedBy: ctx.userId,
        triagedAt: now,
        updatedAt: now,
      });

      // Create notification for the issue creator
      const issue = await ctx.db.get(inboxIssue.issueId);
      if (issue && issue.reporterId !== ctx.userId) {
        await ctx.db.insert("notifications", {
          userId: issue.reporterId,
          type: "inbox_declined",
          title: "Issue declined",
          message: `Your issue "${issue.title}" was declined.${args.reason ? ` Reason: ${args.reason}` : ""}`,
          issueId: issue._id,
          projectId: ctx.projectId,
          actorId: ctx.userId,
          isRead: false,
          isDeleted: false,
        });
      }

      declined++;
    }

    return { declined };
  },
});

/** Bulk snooze multiple inbox issues */
export const bulkSnooze = projectEditorMutation({
  args: {
    inboxIssueIds: v.array(v.id("inboxIssues")),
    until: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate snooze date is in the future
    if (args.until <= Date.now()) {
      throw validation("until", "Snooze date must be in the future");
    }

    const now = Date.now();
    let snoozed = 0;

    for (const id of args.inboxIssueIds) {
      const inboxIssue = await ctx.db.get(id);
      if (!inboxIssue) continue;
      if (inboxIssue.projectId !== ctx.projectId) continue;
      if (inboxIssue.status !== "pending" && inboxIssue.status !== "snoozed") continue;

      await ctx.db.patch(id, {
        status: "snoozed",
        snoozedUntil: args.until,
        triagedBy: ctx.userId,
        triagedAt: now,
        updatedAt: now,
      });

      snoozed++;
    }

    return { snoozed };
  },
});

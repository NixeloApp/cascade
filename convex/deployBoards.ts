/**
 * Deploy Boards
 *
 * Public shareable read-only views of project issue boards.
 * No authentication required to view — admin creates a board
 * with configurable field visibility, gets a shareable slug.
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { projectAdminMutation, projectQuery } from "./customFunctions";
import { batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { MAX_PAGE_SIZE } from "./lib/queryLimits";

function generateSlug(): string {
  return `board-${crypto.randomUUID().slice(0, 12)}`;
}

const visibleFieldsValidator = v.object({
  status: v.boolean(),
  priority: v.boolean(),
  assignee: v.boolean(),
  labels: v.boolean(),
  dueDate: v.boolean(),
});

/** Create a deploy board for a project (admin only). */
export const create = projectAdminMutation({
  args: {
    visibleFields: v.optional(visibleFieldsValidator),
  },
  returns: v.object({ slug: v.string() }),
  handler: async (ctx, args) => {
    // Check if board already exists
    const existing = await ctx.db
      .query("deployBoards")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (existing) {
      return { slug: existing.slug };
    }

    const slug = generateSlug();
    await ctx.db.insert("deployBoards", {
      projectId: ctx.projectId,
      slug,
      isActive: true,
      visibleFields: args.visibleFields ?? {
        status: true,
        priority: true,
        assignee: false,
        labels: true,
        dueDate: true,
      },
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });

    return { slug };
  },
});

/** Get the active deploy board for a project (admin only). */
export const getForProject = projectQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("deployBoards")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});

/** Update deploy board visibility settings (admin only). */
export const updateVisibility = projectAdminMutation({
  args: {
    visibleFields: visibleFieldsValidator,
  },
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("deployBoards")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!board) {
      throw new Error("No active deploy board for this project");
    }

    await ctx.db.patch(board._id, {
      visibleFields: args.visibleFields,
      updatedAt: Date.now(),
    });

    return { success: true } as const;
  },
});

/** Deactivate a deploy board (admin only). */
export const deactivate = projectAdminMutation({
  args: {},
  returns: v.object({ success: v.literal(true) }),
  handler: async (ctx) => {
    const board = await ctx.db
      .query("deployBoards")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (board) {
      await ctx.db.patch(board._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }

    return { success: true } as const;
  },
});

/** Public query — get board data by slug (no auth required). */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query("deployBoards")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!board || !board.isActive) {
      return null;
    }

    const project = await ctx.db.get(board.projectId);
    if (!project || project.isDeleted) {
      return null;
    }

    // Get issues (public view — filtered fields)
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", board.projectId))
      .filter((q) =>
        q.and(q.neq(q.field("isDeleted"), true), q.eq(q.field("archivedAt"), undefined)),
      )
      .take(MAX_PAGE_SIZE);

    // Resolve assignee names if that field is visible
    const assigneeMap = board.visibleFields.assignee
      ? await batchFetchUsers(
          ctx,
          issues.map((i) => i.assigneeId),
        )
      : new Map();

    // Build public issue list with only visible fields
    const publicIssues = issues.map((issue) => ({
      key: issue.key,
      title: issue.title,
      type: issue.type,
      status: issue.status,
      priority: board.visibleFields.priority ? issue.priority : undefined,
      assigneeName:
        board.visibleFields.assignee && issue.assigneeId
          ? getUserName(assigneeMap.get(issue.assigneeId))
          : undefined,
      labels: board.visibleFields.labels ? issue.labels : undefined,
      dueDate: board.visibleFields.dueDate ? issue.dueDate : undefined,
    }));

    // Always return workflowStates — the frontend needs them for column
    // rendering even when the status badge is hidden on individual cards.
    return {
      projectName: project.name,
      projectKey: project.key,
      workflowStates: project.workflowStates,
      issues: publicIssues,
      visibleFields: board.visibleFields,
    };
  },
});

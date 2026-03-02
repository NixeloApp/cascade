/**
 * Slack Slash Commands Core
 *
 * Internal mutation for `/nixelo` command execution.
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { generateIssueKey, getSearchContent, issueKeyExists } from "./issues/helpers";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { syncProjectIssueStats } from "./lib/projectIssueStats";
import { notDeleted } from "./lib/softDeleteHelpers";

export const executeCommand = internalMutation({
  args: {
    teamId: v.string(),
    text: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const commandText = args.text.trim();
    if (!commandText) {
      return {
        ok: false,
        message:
          "Usage: `/nixelo create <title>`, `/nixelo search <query>`, `/nixelo assign <ISSUE-123> <name>`",
      };
    }

    const context = await resolveTeamContext(ctx, args.teamId);
    if (!context) {
      return {
        ok: false,
        message:
          "Slack workspace is not connected. Connect Slack in Settings > Integrations first.",
      };
    }

    const [subcommand, ...rest] = commandText.split(/\s+/);
    const command = subcommand.toLowerCase();

    if (command === "create") {
      const title = rest.join(" ").trim();
      if (!title) {
        return { ok: false, message: "Usage: `/nixelo create <title>`" };
      }
      const result = await createIssueFromCommand(ctx, context.userId, title);
      return { ok: true, message: `Created issue ${result.key}: ${result.title}` };
    }

    if (command === "search") {
      const query = rest.join(" ").trim();
      if (!query) {
        return { ok: false, message: "Usage: `/nixelo search <query>`" };
      }

      const result = await searchIssuesForCommand(ctx, context.userId, query);
      if (result.length === 0) {
        return { ok: true, message: `No issues found for "${query}".` };
      }

      return {
        ok: true,
        message: result.map((issue) => `${issue.key} - ${issue.title}`).join("\n"),
      };
    }

    if (command === "assign") {
      const [issueKey, ...assigneeParts] = rest;
      const assigneeName = assigneeParts.join(" ").trim().replace(/^@/, "");
      if (!issueKey || !assigneeName) {
        return { ok: false, message: "Usage: `/nixelo assign <ISSUE-123> <name>`" };
      }

      return await assignIssueFromCommand(
        ctx,
        context.userId,
        issueKey.toUpperCase(),
        assigneeName,
      );
    }

    return {
      ok: false,
      message:
        "Unknown subcommand. Supported: `create`, `search`, `assign`.\nExample: `/nixelo search onboarding`",
    };
  },
});

async function resolveTeamContext(
  ctx: MutationCtx,
  teamId: string,
): Promise<{ userId: Id<"users"> } | null> {
  const connections = await ctx.db
    .query("slackConnections")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .take(20);

  const active = connections
    .filter((connection) => connection.isActive)
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];

  if (!active) {
    return null;
  }

  return { userId: active.userId };
}

async function createIssueFromCommand(
  ctx: MutationCtx,
  userId: Id<"users">,
  title: string,
): Promise<{ issueId: Id<"issues">; key: string; title: string }> {
  const projectId = await pickProjectForUser(ctx, userId);
  if (!projectId) {
    throw new Error("No project available for Slack commands.");
  }

  const project = await ctx.db.get(projectId);
  if (!project || project.isDeleted) {
    throw new Error("Project unavailable.");
  }

  const canCreate = await canEditProject(ctx, projectId, userId, project.createdBy);
  if (!canCreate) {
    throw new Error("You do not have permission to create issues.");
  }

  let key = await generateIssueKey(ctx, projectId, project.key);
  if (await issueKeyExists(ctx, key)) {
    key = `${project.key}-${Date.now() % 100000}`;
  }

  const now = Date.now();
  const issueId = await ctx.db.insert("issues", {
    projectId,
    organizationId: project.organizationId,
    workspaceId: project.workspaceId,
    teamId: project.teamId,
    key,
    title,
    description: undefined,
    type: "task",
    status: project.workflowStates[0]?.id || "todo",
    priority: "medium",
    assigneeId: undefined,
    reporterId: userId,
    updatedAt: now,
    labels: [],
    sprintId: undefined,
    epicId: undefined,
    parentId: undefined,
    linkedDocuments: [],
    attachments: [],
    estimatedHours: undefined,
    dueDate: undefined,
    storyPoints: undefined,
    searchContent: getSearchContent(title),
    loggedHours: 0,
    order: 0,
    version: 1,
  });

  await ctx.db.insert("issueActivity", {
    issueId,
    userId,
    action: "created",
  });
  await syncProjectIssueStats(ctx, projectId);

  return { issueId, key, title };
}

async function searchIssuesForCommand(
  ctx: MutationCtx,
  userId: Id<"users">,
  query: string,
): Promise<Array<{ issueId: Id<"issues">; key: string; title: string }>> {
  const projectIds = await listUserProjectIds(ctx, userId);
  const normalizedQuery = query.toLowerCase();
  const results: Array<{ issueId: Id<"issues">; key: string; title: string; updatedAt: number }> =
    [];

  for (const projectId of projectIds) {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_project_deleted", (q) => q.eq("projectId", projectId).lt("isDeleted", true))
      .order("desc")
      .take(20);

    for (const issue of issues) {
      const matches =
        issue.key.toLowerCase().includes(normalizedQuery) ||
        issue.title.toLowerCase().includes(normalizedQuery);
      if (matches) {
        results.push({
          issueId: issue._id,
          key: issue.key,
          title: issue.title,
          updatedAt: issue.updatedAt,
        });
      }
    }
  }

  return results
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5)
    .map(({ issueId, key, title }) => ({ issueId, key, title }));
}

async function assignIssueFromCommand(
  ctx: MutationCtx,
  actorUserId: Id<"users">,
  issueKey: string,
  assigneeName: string,
): Promise<{ ok: boolean; message: string }> {
  const issue = await ctx.db
    .query("issues")
    .withIndex("by_key", (q) => q.eq("key", issueKey))
    .first();

  if (!issue || issue.isDeleted) {
    return { ok: false, message: `Issue ${issueKey} not found.` };
  }

  const project = await ctx.db.get(issue.projectId);
  if (!project || project.isDeleted) {
    return { ok: false, message: "Issue project is unavailable." };
  }

  const canAssign = await canEditProject(ctx, issue.projectId, actorUserId, project.createdBy);
  if (!canAssign) {
    return { ok: false, message: "You do not have permission to assign this issue." };
  }

  const users = await ctx.db.query("users").take(BOUNDED_LIST_LIMIT);
  const targetName = assigneeName.toLowerCase();
  const assignee = users.find((user) => user.name?.toLowerCase() === targetName);
  if (!assignee) {
    return { ok: false, message: `User "${assigneeName}" not found.` };
  }

  await ctx.db.patch(issue._id, {
    assigneeId: assignee._id,
    updatedAt: Date.now(),
    version: (issue.version ?? 1) + 1,
  });

  await ctx.db.insert("issueActivity", {
    issueId: issue._id,
    userId: actorUserId,
    action: "updated",
    field: "assigneeId",
    oldValue: issue.assigneeId || "",
    newValue: assignee._id,
  });

  return { ok: true, message: `Assigned ${issue.key} to ${assignee.name || "user"}.` };
}

async function pickProjectForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Id<"projects"> | null> {
  const projects = await listUserProjectIds(ctx, userId);
  return projects[0] ?? null;
}

async function listUserProjectIds(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Id<"projects">[]> {
  const memberships = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  const projectIds = new Set<Id<"projects">>();
  for (const membership of memberships) {
    projectIds.add(membership.projectId);
  }

  return Array.from(projectIds);
}

async function canEditProject(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  userId: Id<"users">,
  projectOwnerId: Id<"users">,
): Promise<boolean> {
  if (projectOwnerId === userId) {
    return true;
  }

  const membership = await ctx.db
    .query("projectMembers")
    .withIndex("by_project_user", (q) => q.eq("projectId", projectId).eq("userId", userId))
    .filter(notDeleted)
    .first();

  return membership ? membership.role !== "viewer" : false;
}

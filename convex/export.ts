import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { projectEditorMutation, projectQuery } from "./customFunctions";
import { batchFetchSprints, batchFetchUsers } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT, safeCollect } from "./lib/boundedQueries";
import { validation } from "./lib/errors";
import { notDeleted } from "./lib/softDeleteHelpers";

/**
 * Compute the next sequential issue key and the insertion order for a project.
 *
 * @param projectId - The project identifier used to find existing issues
 * @param projectKey - The project's short key used as the prefix for generated issue keys (for example, `PROJ`)
 * @returns An object with `key` set to the next issue key (e.g., `PROJ-12`) and `order` equal to the current count of existing issues
 */
async function generateNextIssueKey(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  projectKey: string,
): Promise<{ key: string; order: number }> {
  // Get the most recent issue by creation time to find the highest key number
  // Order desc and take first - efficient O(1) lookup instead of scanning all issues
  const latestIssue = await ctx.db
    .query("issues")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .order("desc")
    .first();

  let maxNumber = 0;
  if (latestIssue) {
    const match = latestIssue.key.match(/-(\d+)$/);
    if (match) {
      maxNumber = Number.parseInt(match[1], 10);
    }
  }

  const key = `${projectKey}-${maxNumber + 1}`;

  // Get approximate order (bounded count)
  const issueCount = await ctx.db
    .query("issues")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  return { key, order: issueCount.length };
}

// Helper: Validate and parse JSON import data
function validateJSONImportData(jsonData: string): { issues: unknown[] } {
  let data: unknown;
  try {
    data = JSON.parse(jsonData);
  } catch {
    throw validation("jsonData", "Invalid JSON format");
  }

  // Type guard and validation
  if (!data || typeof data !== "object" || !("issues" in data) || !Array.isArray(data.issues)) {
    throw validation("jsonData", "JSON must contain an 'issues' array");
  }

  return { issues: data.issues };
}

// Helper: Get issue title safely for error reporting
function getIssueTitleSafe(issue: unknown): string {
  if (issue && typeof issue === "object" && "title" in issue) {
    const title = (issue as { title: unknown }).title;
    if (typeof title === "string") {
      return title;
    }
  }
  return "Unknown";
}

// Helper: Process single issue from JSON import
async function processJSONIssue(
  ctx: MutationCtx,
  issue: unknown,
  projectId: Id<"projects">,
  projectKey: string,
  organizationId: Id<"organizations">,
  workspaceId: Id<"workspaces">,
  teamId: Id<"teams"> | undefined,
  userId: Id<"users">,
  defaultStatus: string,
): Promise<string> {
  // Cast to any for runtime validation
  const issueData = issue as {
    title?: string;
    description?: string;
    type?: string;
    status?: string;
    priority?: string;
    assigneeId?: Id<"users">;
    epicId?: Id<"issues">;
    parentId?: Id<"issues">;
    sprintId?: Id<"sprints">;
    labels?: string[];
    estimatedHours?: number;
    dueDate?: number;
  };

  // Validate required fields
  if (!issueData.title) {
    throw validation("title", "Missing required field: title");
  }

  // Generate next issue key
  const { key: issueKey, order } = await generateNextIssueKey(ctx, projectId, projectKey);

  // Create the issue
  await createIssueWithActivity(
    ctx,
    {
      projectId,
      organizationId,
      workspaceId,
      teamId,
      key: issueKey,
      title: issueData.title,
      description: issueData.description || undefined,
      type: (issueData.type || "task") as "task" | "bug" | "story" | "epic" | "subtask",
      status: issueData.status || defaultStatus,
      priority: (issueData.priority || "medium") as
        | "lowest"
        | "low"
        | "medium"
        | "high"
        | "highest",
      reporterId: userId,
      assigneeId: issueData.assigneeId || undefined,
      epicId: issueData.epicId || undefined,
      parentId: issueData.parentId || undefined,
      sprintId: issueData.sprintId || undefined,
      labels: issueData.labels || [],
      estimatedHours: issueData.estimatedHours || undefined,
      dueDate: issueData.dueDate || undefined,
      order,
    },
    userId,
  );

  return issueKey;
}

// Helper: Parse CSV headers to get column indices
function parseCSVHeaders(headerLine: string): {
  titleIndex: number;
  typeIndex: number;
  priorityIndex: number;
  descriptionIndex: number;
  labelsIndex: number;
  estimatedIndex: number;
  dueDateIndex: number;
} {
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  const titleIndex = headers.indexOf("title");

  if (titleIndex === -1) {
    throw validation("csvData", "CSV must contain a 'title' column");
  }

  return {
    titleIndex,
    typeIndex: headers.indexOf("type"),
    priorityIndex: headers.indexOf("priority"),
    descriptionIndex: headers.indexOf("description"),
    labelsIndex: headers.indexOf("labels"),
    estimatedIndex: headers.indexOf("estimated hours"),
    dueDateIndex: headers.indexOf("due date"),
  };
}

// Helper: Parse CSV row into issue data
function parseCSVRow(
  values: string[],
  indices: ReturnType<typeof parseCSVHeaders>,
  projectId: Id<"projects">,
  organizationId: Id<"organizations">,
  workspaceId: Id<"workspaces">,
  teamId: Id<"teams"> | undefined,
  issueKey: string,
  userId: Id<"users">,
  defaultStatus: string,
  order: number,
): {
  projectId: Id<"projects">;
  organizationId: Id<"organizations">;
  workspaceId: Id<"workspaces">;
  teamId: Id<"teams"> | undefined;
  key: string;
  title: string;
  description?: string;
  type: "task" | "bug" | "story" | "epic" | "subtask";
  status: string;
  priority: "lowest" | "low" | "medium" | "high" | "highest";
  reporterId: Id<"users">;
  labels: string[];
  estimatedHours?: number;
  dueDate?: number;
  order: number;
} {
  if (!values[indices.titleIndex]) {
    throw validation("title", "Title is required");
  }

  return {
    projectId,
    organizationId,
    workspaceId,
    teamId,
    key: issueKey,
    title: values[indices.titleIndex],
    description: indices.descriptionIndex !== -1 ? values[indices.descriptionIndex] : undefined,
    type: ((indices.typeIndex !== -1 && values[indices.typeIndex]) || "task") as
      | "task"
      | "bug"
      | "story"
      | "epic"
      | "subtask",
    status: defaultStatus,
    priority: ((indices.priorityIndex !== -1 && values[indices.priorityIndex]) || "medium") as
      | "lowest"
      | "low"
      | "medium"
      | "high"
      | "highest",
    reporterId: userId,
    labels:
      indices.labelsIndex !== -1 && values[indices.labelsIndex]
        ? values[indices.labelsIndex].split(";").map((l) => l.trim())
        : [],
    estimatedHours:
      indices.estimatedIndex !== -1 && values[indices.estimatedIndex]
        ? Number.parseFloat(values[indices.estimatedIndex])
        : undefined,
    dueDate:
      indices.dueDateIndex !== -1 && values[indices.dueDateIndex]
        ? new Date(values[indices.dueDateIndex]).getTime()
        : undefined,
    order,
  };
}

/**
 * Create a new issue record and record a creation activity for the given user.
 *
 * Inserts a new issue with provided fields (including initial timestamps, loggedHours = 0,
 * empty linkedDocuments and attachments) and creates an `issueActivity` entry with action `"created"`.
 *
 * @param issueData - Initial issue fields used to populate the created issue
 * @param userId - ID of the user who created the issue (recorded on the activity)
 * @returns The ID of the newly created issue
 */
async function createIssueWithActivity(
  ctx: MutationCtx,
  issueData: {
    projectId: Id<"projects">;
    organizationId: Id<"organizations">;
    workspaceId: Id<"workspaces">;
    teamId: Id<"teams"> | undefined;
    key: string;
    title: string;
    description?: string;
    type: "task" | "bug" | "story" | "epic" | "subtask";
    status: string;
    priority: "lowest" | "low" | "medium" | "high" | "highest";
    reporterId: Id<"users">;
    assigneeId?: Id<"users">;
    epicId?: Id<"issues">;
    parentId?: Id<"issues">;
    sprintId?: Id<"sprints">;
    labels: string[];
    estimatedHours?: number;
    dueDate?: number;
    order: number;
  },
  userId: Id<"users">,
): Promise<Id<"issues">> {
  const issueId = await ctx.db.insert("issues", {
    ...issueData,
    loggedHours: 0,
    updatedAt: Date.now(),
    linkedDocuments: [],
    attachments: [],
  });

  await ctx.db.insert("issueActivity", {
    issueId,
    userId,
    action: "created",
  });

  return issueId;
}

// Export issues as CSV
export const exportIssuesCSV = projectQuery({
  args: {
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // projectQuery handles auth + access check + provides ctx.projectId, ctx.project

    // Get issues (bounded to prevent memory issues on large exports)
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId));

    let issues = await safeCollect(issuesQuery, BOUNDED_LIST_LIMIT, "exportIssuesCSV");

    // Filter by sprint if specified
    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    // Filter by status if specified
    if (args.status) {
      issues = issues.filter((i) => i.status === args.status);
    }

    // Batch fetch all users and sprints to avoid N+1 queries
    const userIds = [
      ...issues.map((i) => i.assigneeId).filter(Boolean),
      ...issues.map((i) => i.reporterId),
    ] as Id<"users">[];
    const sprintIds = issues.map((i) => i.sprintId).filter(Boolean) as Id<"sprints">[];

    const [userMap, sprintMap] = await Promise.all([
      batchFetchUsers(ctx, userIds),
      batchFetchSprints(ctx, sprintIds),
    ]);

    // Enrich with pre-fetched data (no N+1)
    const enrichedIssues = issues.map((issue) => {
      const assignee = issue.assigneeId ? userMap.get(issue.assigneeId) : null;
      const reporter = userMap.get(issue.reporterId);
      const sprint = issue.sprintId ? sprintMap.get(issue.sprintId) : null;

      // Get status name from workflow
      const statusState = ctx.project.workflowStates.find((s) => s.id === issue.status);

      return {
        key: issue.key,
        title: issue.title,
        type: issue.type,
        status: statusState?.name ?? issue.status,
        priority: issue.priority,
        assignee: assignee?.name ?? "Unassigned",
        reporter: reporter?.name ?? "Unknown",
        sprint: sprint?.name ?? "No Sprint",
        estimatedHours: issue.estimatedHours ?? 0,
        loggedHours: issue.loggedHours ?? 0,
        labels: issue.labels.join(", "),
        dueDate: issue.dueDate ? new Date(issue.dueDate).toISOString().split("T")[0] : "",
        createdAt: new Date(issue._creationTime).toISOString().split("T")[0],
      };
    });

    // Convert to CSV
    const headers = [
      "Key",
      "Title",
      "Type",
      "Status",
      "Priority",
      "Assignee",
      "Reporter",
      "Sprint",
      "Estimated Hours",
      "Logged Hours",
      "Labels",
      "Due Date",
      "Created",
    ];

    const rows = enrichedIssues.map((issue) => [
      issue.key,
      `"${issue.title.replace(/"/g, '""')}"`, // Escape quotes
      issue.type,
      issue.status,
      issue.priority,
      issue.assignee,
      issue.reporter,
      issue.sprint,
      issue.estimatedHours,
      issue.loggedHours,
      `"${issue.labels}"`,
      issue.dueDate,
      issue.createdAt,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return csv;
  },
});

// Export analytics data
export const exportAnalytics = projectQuery({
  args: {},
  handler: async (ctx) => {
    // projectQuery handles auth + access check + provides ctx.projectId, ctx.project

    // Get issues (bounded)
    const issues = await safeCollect(
      ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
        .filter(notDeleted),
      BOUNDED_LIST_LIMIT,
      "exportAnalytics:issues",
    );

    // Get sprints (bounded)
    const sprints = await safeCollect(
      ctx.db
        .query("sprints")
        .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId))
        .filter(notDeleted),
      BOUNDED_LIST_LIMIT,
      "exportAnalytics:sprints",
    );

    // Calculate metrics
    const totalIssues = issues.length;
    const completedIssues = issues.filter((i) => {
      const state = ctx.project.workflowStates.find((s) => s.id === i.status);
      return state?.category === "done";
    }).length;

    const issuesByType = issues.reduce(
      (acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const issuesByPriority = issues.reduce(
      (acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalEstimated = issues.reduce((sum, i) => sum + (i.estimatedHours ?? 0), 0);
    const totalLogged = issues.reduce((sum, i) => sum + (i.loggedHours ?? 0), 0);

    return {
      projectName: ctx.project.name,
      projectKey: ctx.project.key,
      totalIssues,
      completedIssues,
      completionRate: totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0,
      issuesByType,
      issuesByPriority,
      totalEstimatedHours: totalEstimated,
      totalLoggedHours: totalLogged,
      totalSprints: sprints.length,
      completedSprints: sprints.filter((s) => s.status === "completed").length,
      exportedAt: new Date().toISOString(),
    };
  },
});

// Export issues as JSON
export const exportIssuesJSON = projectQuery({
  args: {
    sprintId: v.optional(v.id("sprints")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // projectQuery handles auth + access check + provides ctx.projectId, ctx.project

    // Get issues with same filtering as CSV export (bounded)
    const issuesQuery = ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", ctx.projectId));

    let issues = await safeCollect(issuesQuery, BOUNDED_LIST_LIMIT, "exportIssuesJSON");

    if (args.sprintId) {
      issues = issues.filter((i) => i.sprintId === args.sprintId);
    }

    if (args.status) {
      issues = issues.filter((i) => i.status === args.status);
    }

    // Batch fetch all users, sprints, and comment counts to avoid N+1 queries
    const userIds = [
      ...issues.map((i) => i.assigneeId).filter(Boolean),
      ...issues.map((i) => i.reporterId),
    ] as Id<"users">[];
    const sprintIds = issues.map((i) => i.sprintId).filter(Boolean) as Id<"sprints">[];
    const issueIds = issues.map((i) => i._id);

    const [userMap, sprintMap, commentCountsArrays] = await Promise.all([
      batchFetchUsers(ctx, userIds),
      batchFetchSprints(ctx, sprintIds),
      Promise.all(
        issueIds.map((issueId) =>
          ctx.db
            .query("issueComments")
            .withIndex("by_issue", (q) => q.eq("issueId", issueId))
            .filter(notDeleted)
            .take(BOUNDED_LIST_LIMIT),
        ),
      ),
    ]);

    // Build comment count map
    const commentCountMap = new Map(
      issueIds.map((id, i) => [id.toString(), commentCountsArrays[i].length]),
    );

    // Enrich with pre-fetched data (no N+1)
    const enrichedIssues = issues.map((issue) => {
      const assignee = issue.assigneeId ? userMap.get(issue.assigneeId) : null;
      const reporter = userMap.get(issue.reporterId);
      const sprint = issue.sprintId ? sprintMap.get(issue.sprintId) : null;
      const statusState = ctx.project.workflowStates.find((s) => s.id === issue.status);

      return {
        ...issue,
        statusName: statusState?.name ?? issue.status,
        assigneeName: assignee?.name,
        reporterName: reporter?.name,
        sprintName: sprint?.name,
        comments: commentCountMap.get(issue._id.toString()) ?? 0,
      };
    });

    return JSON.stringify(
      {
        project: {
          name: ctx.project.name,
          key: ctx.project.key,
          description: ctx.project.description,
        },
        exportedAt: new Date().toISOString(),
        totalIssues: enrichedIssues.length,
        issues: enrichedIssues,
      },
      null,
      2,
    );
  },
});

// Import issues from JSON
export const importIssuesJSON = projectEditorMutation({
  args: {
    jsonData: v.string(),
  },
  handler: async (ctx, args) => {
    // editorMutation handles auth + editor check + provides ctx.projectId, ctx.project

    // Validate and parse JSON data
    const { issues } = validateJSONImportData(args.jsonData);

    const imported = [];
    const errors = [];

    for (const issue of issues) {
      try {
        // Basic validation before processing
        if (!issue || typeof issue !== "object") {
          throw validation("issue", "Invalid issue format: must be an object");
        }

        const issueKey = await processJSONIssue(
          ctx,
          issue,
          ctx.projectId,
          ctx.project.key,
          ctx.project.organizationId,
          ctx.project.workspaceId,
          ctx.project.teamId,
          ctx.userId,
          ctx.project.workflowStates[0].id,
        );
        imported.push(issueKey);
      } catch (error) {
        errors.push({
          title: getIssueTitleSafe(issue),
          error: error instanceof Error ? error.message : "Import failed",
        });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10), // Return first 10 errors
    };
  },
});

// Import issues from CSV
export const importIssuesCSV = projectEditorMutation({
  args: {
    csvData: v.string(),
  },
  handler: async (ctx, args) => {
    // editorMutation handles auth + editor check + provides ctx.projectId, ctx.project

    // Parse CSV
    const lines = args.csvData.trim().split("\n");
    if (lines.length < 2) {
      throw validation("csvData", "CSV must have at least a header row and one data row");
    }

    // Parse headers to get column indices
    const indices = parseCSVHeaders(lines[0]);

    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

        // Generate next issue key
        const { key: issueKey, order } = await generateNextIssueKey(
          ctx,
          ctx.projectId,
          ctx.project.key,
        );

        // Parse CSV row into issue data
        const issueData = parseCSVRow(
          values,
          indices,
          ctx.projectId,
          ctx.project.organizationId,
          ctx.project.workspaceId,
          ctx.project.teamId,
          issueKey,
          ctx.userId,
          ctx.project.workflowStates[0].id,
          order,
        );

        await createIssueWithActivity(ctx, issueData, ctx.userId);
        imported.push(issueKey);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Export failed",
        });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      errors: errors.slice(0, 10),
    };
  },
});

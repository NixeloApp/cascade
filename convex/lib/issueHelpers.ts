/**
 * Issue enrichment helpers for DRY operations
 *
 * Provides utilities for enriching issues with related data (users, epics, etc.)
 * and migration-safe issue retrieval
 */

import type { PaginationOptions, PaginationResult } from "convex/server";
import { asyncMap } from "convex-helpers";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { BOUNDED_LIST_LIMIT } from "./boundedQueries";
import { notFound, validation } from "./errors";
import { fetchPaginatedQuery } from "./queryHelpers";
import { MAX_LABELS_PER_PROJECT } from "./queryLimits";

/**
 * Get an issue and validate it has a projectId (for migration safety)
 */
export async function getIssueWithProject(
  ctx: QueryCtx | MutationCtx,
  issueId: Id<"issues">,
): Promise<Doc<"issues"> & { projectId: Id<"projects"> }> {
  const issue = await ctx.db.get(issueId);
  if (!issue) {
    throw notFound("issue", issueId);
  }
  if (!issue.projectId) {
    throw validation(
      "projectId",
      "Issue missing projectId - please run migration: pnpm convex run migrations/migrateProjectToWorkspace:migrate",
    );
  }
  return issue as Doc<"issues"> & { projectId: Id<"projects"> };
}

/**
 * Minimal user info for display
 */
export interface UserInfo {
  _id: Id<"users">;
  name: string;
  email?: string;
  image?: string;
}

/**
 * Minimal epic info for display
 */
export interface EpicInfo {
  _id: Id<"issues">;
  key: string;
  title: string;
}

/**
 * Label info with color for display
 */
export interface LabelInfo {
  name: string;
  color: string;
}

/**
 * Reaction info for display
 */
export interface ReactionInfo {
  emoji: string;
  userIds: Id<"users">[];
}

/**
 * Enriched issue with related data
 */
export interface EnrichedIssue extends Omit<Doc<"issues">, "labels"> {
  assignee: UserInfo | null;
  reporter: UserInfo | null;
  epic: EpicInfo | null;
  labels: LabelInfo[];
}

/**
 * Enriched comment with author and reactions
 */
export interface EnrichedComment extends Doc<"issueComments"> {
  author: UserInfo | null;
  reactions: ReactionInfo[];
}

/**
 * Convert a user document to UserInfo
 */
function toUserInfo(user: Doc<"users"> | null): UserInfo | null {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || user.email || "Unknown",
    email: user.email,
    image: user.image,
  };
}

/**
 * Convert an epic issue to EpicInfo
 */
function toEpicInfo(epic: Doc<"issues"> | null): EpicInfo | null {
  if (!epic) return null;
  return {
    _id: epic._id,
    key: epic.key,
    title: epic.title,
  };
}

/**
 * Enrich a single issue with assignee, reporter, epic, and label info
 */
export async function enrichIssue(ctx: QueryCtx, issue: Doc<"issues">): Promise<EnrichedIssue> {
  const [assignee, reporter, epic] = await Promise.all([
    issue.assigneeId ? ctx.db.get(issue.assigneeId) : null,
    ctx.db.get(issue.reporterId),
    issue.epicId ? ctx.db.get(issue.epicId) : null,
  ]);

  // Fetch label metadata if issue has labels and projectId
  let labelInfos: LabelInfo[] = [];
  if (issue.labels && issue.labels.length > 0 && issue.projectId) {
    // Optimization: Fetch only the specific labels used by this issue.
    // This avoids fetching potentially hundreds of unused labels for the project
    // and fixes a bug where labels beyond the page size limit were not found.
    const labels = await Promise.all(
      issue.labels.map((name) =>
        ctx.db
          .query("labels")
          .withIndex("by_project_name", (q) => {
            const projectId = issue.projectId;
            if (!projectId) {
              // This should be unreachable due to outer check, but satisfy type checker
              throw new Error("Unexpected missing projectId");
            }
            return q.eq("projectId", projectId).eq("name", name);
          })
          .first(),
      ),
    );

    const labelMap = new Map<string, string>();
    for (const label of labels) {
      if (label) {
        labelMap.set(label.name, label.color);
      }
    }

    labelInfos = issue.labels.map((name) => ({
      name,
      color: labelMap.get(name) ?? "#6b7280", // Default gray if not found
    }));
  }

  return {
    ...issue,
    assignee: toUserInfo(assignee),
    reporter: toUserInfo(reporter),
    epic: toEpicInfo(epic),
    labels: labelInfos,
  };
}

/**
 * Build a lookup map from an array of documents
 */
function buildLookupMap<T extends { _id: { toString(): string } }>(
  items: (T | null)[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    if (item) map.set(item._id.toString(), item);
  }
  return map;
}

/**
 * Build a map of projectId -> (labelName -> color)
 */
function buildLabelsByProject(
  projectIds: Id<"projects">[],
  projectLabelsArrays: Doc<"labels">[][],
): Map<string, Map<string, string>> {
  const labelsByProject = new Map<string, Map<string, string>>();
  for (let i = 0; i < projectIds.length; i++) {
    const labelMap = new Map<string, string>();
    for (const label of projectLabelsArrays[i]) {
      labelMap.set(label.name, label.color);
    }
    labelsByProject.set(projectIds[i].toString(), labelMap);
  }
  return labelsByProject;
}

/**
 * Get label infos for an issue from the project label map
 */
function getLabelInfos(
  issue: Doc<"issues">,
  labelsByProject: Map<string, Map<string, string>>,
): LabelInfo[] {
  const projectLabelMap = issue.projectId
    ? labelsByProject.get(issue.projectId.toString())
    : undefined;
  return (issue.labels || []).map((name) => ({
    name,
    color: projectLabelMap?.get(name) ?? "#6b7280",
  }));
}

function getProjectLabelsNeeded(issues: Doc<"issues">[]) {
  const projectLabelsNeeded = new Map<Id<"projects">, Set<string>>();
  for (const issue of issues) {
    if (issue.projectId && issue.labels && issue.labels.length > 0) {
      if (!projectLabelsNeeded.has(issue.projectId)) {
        projectLabelsNeeded.set(issue.projectId, new Set());
      }
      const set = projectLabelsNeeded.get(issue.projectId);
      if (set) {
        for (const l of issue.labels) {
          set.add(l);
        }
      }
    }
  }
  return projectLabelsNeeded;
}

async function fetchLabelsForProject(
  ctx: QueryCtx,
  projectId: Id<"projects">,
  neededLabels: Set<string>,
): Promise<Doc<"labels">[]> {
  // If we need few labels, fetch them individually (faster/cheaper than scanning 200 items)
  if (neededLabels.size <= 20) {
    const labels = await Promise.all(
      [...neededLabels].map((name) =>
        ctx.db
          .query("labels")
          .withIndex("by_project_name", (q) => q.eq("projectId", projectId).eq("name", name))
          .first(),
      ),
    );
    return labels.filter((l): l is Doc<"labels"> => l !== null);
  }

  // If we need many labels, fetch the first batch (up to 200) efficiently
  const batchLabels = await ctx.db
    .query("labels")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(MAX_LABELS_PER_PROJECT);

  // Check if we are missing any needed labels
  const foundNames = new Set(batchLabels.map((l) => l.name));
  const missingLabels = [...neededLabels].filter((name) => !foundNames.has(name));

  if (missingLabels.length > 0) {
    // Fetch missing labels individually
    const extraLabels = await Promise.all(
      missingLabels.map((name) =>
        ctx.db
          .query("labels")
          .withIndex("by_project_name", (q) => q.eq("projectId", projectId).eq("name", name))
          .first(),
      ),
    );
    batchLabels.push(...extraLabels.filter((l): l is Doc<"labels"> => l !== null));
  }
  return batchLabels;
}

/**
 * Enrich multiple issues with assignee, reporter, epic, and label info
 * Uses batching to avoid N+1 queries
 */
export async function enrichIssues(
  ctx: QueryCtx,
  issues: Doc<"issues">[],
): Promise<EnrichedIssue[]> {
  if (issues.length === 0) return [];

  // Collect unique IDs
  const assigneeIds = new Set<Id<"users">>();
  const reporterIds = new Set<Id<"users">>();
  const epicIds = new Set<Id<"issues">>();
  // We only track projects that actually need label fetching to optimize queries
  const projectLabelsNeeded = getProjectLabelsNeeded(issues);

  for (const issue of issues) {
    if (issue.assigneeId) assigneeIds.add(issue.assigneeId);
    reporterIds.add(issue.reporterId);
    if (issue.epicId) epicIds.add(issue.epicId);
  }

  // Batch fetch all data
  const projectIdList = [...projectLabelsNeeded.keys()];
  const [assignees, reporters, epics, projectLabelsArrays] = await Promise.all([
    asyncMap([...assigneeIds], (id) => ctx.db.get(id)),
    asyncMap([...reporterIds], (id) => ctx.db.get(id)),
    asyncMap([...epicIds], (id) => ctx.db.get(id)),
    asyncMap(projectIdList, async (projectId) => {
      const neededLabels = projectLabelsNeeded.get(projectId);
      if (!neededLabels) return [];
      return await fetchLabelsForProject(ctx, projectId, neededLabels);
    }),
  ]);

  // Build lookup maps
  const assigneeMap = buildLookupMap(assignees);
  const reporterMap = buildLookupMap(reporters);
  const epicMap = buildLookupMap(epics);
  const labelsByProject = buildLabelsByProject(
    projectIdList,
    projectLabelsArrays as Doc<"labels">[][],
  );

  // Enrich issues
  return issues.map((issue) => ({
    ...issue,
    assignee: issue.assigneeId
      ? toUserInfo(assigneeMap.get(issue.assigneeId.toString()) ?? null)
      : null,
    reporter: toUserInfo(reporterMap.get(issue.reporterId.toString()) ?? null),
    epic: issue.epicId ? toEpicInfo(epicMap.get(issue.epicId.toString()) ?? null) : null,
    labels: getLabelInfos(issue, labelsByProject),
  }));
}

/**
 * Enrich multiple comments with author info and reactions
 * Uses batching to avoid N+1 queries
 */
export async function enrichComments(
  ctx: QueryCtx,
  comments: Doc<"issueComments">[],
): Promise<EnrichedComment[]> {
  if (comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((c) => c.authorId))];
  const commentIds = comments.map((c) => c._id);

  // Batch fetch authors and reactions
  const [users, allReactions] = await Promise.all([
    asyncMap(authorIds, (id) => ctx.db.get(id)),
    asyncMap(commentIds, (commentId) =>
      ctx.db
        .query("issueCommentReactions")
        .withIndex("by_comment", (q) => q.eq("commentId", commentId))
        .take(BOUNDED_LIST_LIMIT),
    ),
  ]);

  const userMap = buildLookupMap(users);

  return comments.map((comment, index) => {
    const author = userMap.get(comment.authorId.toString()) ?? null;
    const reactions = allReactions[index];

    // Group reactions by emoji
    const emojiGroups = new Map<string, Id<"users">[]>();
    for (const reaction of reactions) {
      if (!emojiGroups.has(reaction.emoji)) {
        emojiGroups.set(reaction.emoji, []);
      }
      emojiGroups.get(reaction.emoji)?.push(reaction.userId);
    }

    const formattedReactions: ReactionInfo[] = Array.from(emojiGroups.entries()).map(
      ([emoji, userIds]) => ({
        emoji,
        userIds,
      }),
    );

    return {
      ...comment,
      author: toUserInfo(author),
      reactions: formattedReactions,
    };
  });
}

/**
 * Group issues by status
 */
export function groupIssuesByStatus<T extends { status: string }>(
  issues: T[],
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const issue of issues) {
    if (!grouped[issue.status]) {
      grouped[issue.status] = [];
    }
    grouped[issue.status].push(issue);
  }
  return grouped;
}

/**
 * Count issues by status
 */
export function countIssuesByStatus<T extends { status: string }>(
  issues: T[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const issue of issues) {
    counts[issue.status] = (counts[issue.status] || 0) + 1;
  }
  return counts;
}

/**
 * Standardized issue pagination helper
 * Handles:
 * 1. Auth & Admin checks (optional)
 * 2. Query construction with index
 * 3. Soft delete filtering
 * 4. Pagination
 * 5. Enrichment
 */
export async function fetchPaginatedIssues(
  ctx: QueryCtx,
  opts: {
    paginationOpts: PaginationOptions;

    query: (db: QueryCtx["db"]) => unknown; // Query builder keeps specific type implicitly
    enrich?: boolean;
  },
): Promise<PaginationResult<EnrichedIssue | Doc<"issues">>> {
  const issuesResult = await fetchPaginatedQuery<Doc<"issues">>(ctx, {
    paginationOpts: opts.paginationOpts,
    query: opts.query,
  });

  if (opts.enrich === false) {
    return issuesResult;
  }

  return {
    ...issuesResult,
    page: await enrichIssues(ctx, issuesResult.page),
  };
}

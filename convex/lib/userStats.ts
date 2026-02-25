import type { FilterBuilder, GenericTableInfo } from "convex/server";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { batchFetchIssues } from "./batchHelpers";
import { type CountableQuery, efficientCount } from "./boundedQueries";
import { notDeleted } from "./softDeleteHelpers";

// Limits for user stats queries
const MAX_ISSUES_FOR_STATS = 1000;
const MAX_COMMENTS_FOR_STATS = 1000;
const MAX_PROJECTS_FOR_STATS = 500;
// Threshold below which per-project index queries outperform a single filtered scan.
// 10 chosen for project/comment lookups where per-row cost is low and fan-out is high.
const MAX_PROJECTS_FOR_FAST_PATH = 10;
// Higher threshold for issues/assignees: O(1) index lookup per project beats O(N) scan + in-memory
// filter even at 50 projects — unlike memberships, each issue index is tightly scoped.
const MAX_PROJECTS_FOR_ISSUE_SCAN = 50;

// Helper to construct allowed project filter
function isAllowedProject(q: FilterBuilder<GenericTableInfo>, projectIds: Id<"projects">[]) {
  // Defensive guard: q.or() with zero args would throw at runtime
  if (projectIds.length === 0) return q.eq(1, 0); // always false
  return q.or(...projectIds.map((id) => q.eq(q.field("projectId"), id)));
}

/**
 * Helper to execute a counting strategy based on the set of allowed projects.
 */
async function executeCountStrategy<T>(
  allowedProjectIds: Set<string> | null,
  emptyResult: T,
  strategies: {
    unrestricted: () => Promise<T>;
    fast: (ids: Set<string>) => Promise<T>;
    filtered: (ids: Set<string>) => Promise<T>;
  },
  threshold: number = MAX_PROJECTS_FOR_FAST_PATH,
): Promise<T> {
  if (!allowedProjectIds) {
    return strategies.unrestricted();
  }

  if (allowedProjectIds.size === 0) return emptyResult;

  if (allowedProjectIds.size <= threshold) {
    return strategies.fast(allowedProjectIds);
  }

  return strategies.filtered(allowedProjectIds);
}

/**
 * Helper to count issues reported by a user without project restrictions.
 */
async function countIssuesByReporterUnrestricted(ctx: QueryCtx, reporterId: Id<"users">) {
  return await efficientCount(
    ctx.db
      .query("issues")
      .withIndex("by_reporter_deleted", (q) =>
        q.eq("reporterId", reporterId).lt("isDeleted", true),
      ),
    MAX_ISSUES_FOR_STATS,
  );
}

/**
 * Helper to count issues in specific projects using a parallelized index query.
 * This is efficient for users who are members of a small number of projects.
 */
async function countByProjectParallel<T>(
  projectIds: Id<"projects">[],
  limit: number,
  queryFactory: (projectId: Id<"projects">) => CountableQuery<T>,
): Promise<number> {
  const counts = await Promise.all(
    projectIds.map((projectId) => efficientCount(queryFactory(projectId), limit)),
  );
  return counts.reduce((a, b) => a + b, 0);
}

/**
 * Helper to count issues reported by a user in specific projects (optimized for few projects).
 */
async function countIssuesByReporterFast(
  ctx: QueryCtx,
  reporterId: Id<"users">,
  allowedProjectIds: Set<string>,
): Promise<number> {
  const count = await countByProjectParallel(
    Array.from(allowedProjectIds) as Id<"projects">[],
    MAX_ISSUES_FOR_STATS,
    (projectId) =>
      ctx.db
        .query("issues")
        .withIndex("by_project_reporter", (q) =>
          q.eq("projectId", projectId).eq("reporterId", reporterId),
        )
        .filter(notDeleted),
  );
  return Math.min(count, MAX_ISSUES_FOR_STATS);
}

/**
 * Helper to count issues reported by a user in specific projects (filtered scan).
 */
async function countIssuesByReporterFiltered(
  ctx: QueryCtx,
  reporterId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  const projectIds = Array.from(allowedProjectIds) as Id<"projects">[];
  return await efficientCount(
    ctx.db
      .query("issues")
      .withIndex("by_reporter_deleted", (q) => q.eq("reporterId", reporterId).lt("isDeleted", true))
      .filter((q) => isAllowedProject(q, projectIds)),
    MAX_ISSUES_FOR_STATS,
  );
}

/**
 * Count issues reported by a specific user.
 *
 * @param ctx - Query context
 * @param reporterId - The user who reported the issues
 * @param allowedProjectIds - If not null, only count issues in these projects (for privacy)
 */
async function countIssuesByReporter(
  ctx: QueryCtx,
  reporterId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  return await executeCountStrategy(
    allowedProjectIds,
    0,
    {
      unrestricted: () => countIssuesByReporterUnrestricted(ctx, reporterId),
      fast: (ids) => countIssuesByReporterFast(ctx, reporterId, ids),
      filtered: (ids) => countIssuesByReporterFiltered(ctx, reporterId, ids),
    },
    MAX_PROJECTS_FOR_ISSUE_SCAN,
  );
}

/**
 * Helper to count issues assigned to a user without project restrictions.
 */
async function countIssuesByAssigneeUnrestricted(ctx: QueryCtx, assigneeId: Id<"users">) {
  return await Promise.all([
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee_deleted", (q) =>
          q.eq("assigneeId", assigneeId).lt("isDeleted", true),
        ),
      MAX_ISSUES_FOR_STATS,
    ),
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee_status", (q) => q.eq("assigneeId", assigneeId).eq("status", "done"))
        .filter(notDeleted),
      MAX_ISSUES_FOR_STATS,
    ),
  ]);
}

/**
 * Helper to count issues assigned to a user in specific projects (optimized for few projects).
 */
async function countIssuesByAssigneeFast(
  ctx: QueryCtx,
  assigneeId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  const projectIds = Array.from(allowedProjectIds) as Id<"projects">[];

  // Parallelize both counting operations
  const [totalAssigned, completed] = await Promise.all([
    // 1. Total Assigned: Parallel efficient counts on by_project_assignee index
    // This avoids loading documents into memory
    countByProjectParallel(projectIds, MAX_ISSUES_FOR_STATS, (projectId) =>
      ctx.db
        .query("issues")
        .withIndex("by_project_assignee", (q) =>
          q.eq("projectId", projectId).eq("assigneeId", assigneeId),
        )
        .filter(notDeleted),
    ),
    // 2. Completed: Parallel efficient counts on by_project_assignee_status index
    // This uses a direct index lookup for done issues in the project, avoiding scanning
    // all assigned issues (including todo/in-progress) and filtering.
    countByProjectParallel(projectIds, MAX_ISSUES_FOR_STATS, (projectId) =>
      ctx.db
        .query("issues")
        .withIndex("by_project_assignee_status", (q) =>
          q.eq("projectId", projectId).eq("assigneeId", assigneeId).eq("status", "done"),
        )
        .filter(notDeleted),
    ),
  ]);

  return [Math.min(totalAssigned, MAX_ISSUES_FOR_STATS), Math.min(completed, MAX_ISSUES_FOR_STATS)];
}

/**
 * Helper to count issues assigned to a user in specific projects (filtered scan).
 */
async function countIssuesByAssigneeFiltered(
  ctx: QueryCtx,
  assigneeId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  const projectIds = Array.from(allowedProjectIds) as Id<"projects">[];
  return await Promise.all([
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee_deleted", (q) =>
          q.eq("assigneeId", assigneeId).lt("isDeleted", true),
        )
        .filter((q) => isAllowedProject(q, projectIds)),
      MAX_ISSUES_FOR_STATS,
    ),
    efficientCount(
      ctx.db
        .query("issues")
        .withIndex("by_assignee_status", (q) => q.eq("assigneeId", assigneeId).eq("status", "done"))
        .filter(notDeleted)
        .filter((q) => isAllowedProject(q, projectIds)),
      MAX_ISSUES_FOR_STATS,
    ),
  ]);
}

/**
 * Count issues assigned to a specific user.
 *
 * Returns a tuple: `[totalAssigned, completedAssigned]`.
 *
 * @param ctx - Query context
 * @param assigneeId - The user assigned to the issues
 * @param allowedProjectIds - If not null, only count issues in these projects (for privacy)
 */
async function countIssuesByAssignee(
  ctx: QueryCtx,
  assigneeId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  return await executeCountStrategy(
    allowedProjectIds,
    [0, 0],
    {
      unrestricted: () => countIssuesByAssigneeUnrestricted(ctx, assigneeId),
      fast: (ids) => countIssuesByAssigneeFast(ctx, assigneeId, ids),
      filtered: (ids) => countIssuesByAssigneeFiltered(ctx, assigneeId, ids),
    },
    MAX_PROJECTS_FOR_ISSUE_SCAN,
  );
}

/**
 * Helper to count comments by a user without project restrictions.
 */
async function countCommentsUnrestricted(ctx: QueryCtx, userId: Id<"users">) {
  return await efficientCount(
    ctx.db
      .query("issueComments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .filter(notDeleted),
    MAX_COMMENTS_FOR_STATS,
  );
}

/**
 * Helper to count comments by a user in specific projects (filtered).
 * Since we don't have a direct index for comments by project, "fast" and "filtered" strategies are the same.
 */
async function countCommentsFiltered(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  const commentsAll = await ctx.db
    .query("issueComments")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .filter(notDeleted)
    .order("desc") // Optimization: Count recent comments first
    .take(MAX_COMMENTS_FOR_STATS);

  // Batch fetch unique issue IDs to check project membership using batchFetchIssues
  // This avoids unbounded Promise.all calls
  const issueIds = [...new Set(commentsAll.map((c) => c.issueId))];
  const issueMap = await batchFetchIssues(ctx, issueIds);

  const allowedIssueIds = new Set<string>();
  for (const [issueId, issue] of issueMap.entries()) {
    if (issue.projectId && allowedProjectIds.has(issue.projectId)) {
      allowedIssueIds.add(issueId);
    }
  }

  return commentsAll.filter((c) => allowedIssueIds.has(c.issueId)).length;
}

/**
 * Count comments made by a specific user.
 *
 * Checks that the comment's issue belongs to an allowed project.
 *
 * @param ctx - Query context
 * @param userId - The user who made the comments
 * @param allowedProjectIds - If not null, only count comments in these projects (for privacy)
 */
async function countComments(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  return await executeCountStrategy(allowedProjectIds, 0, {
    unrestricted: () => countCommentsUnrestricted(ctx, userId),
    // Comments don't have a "fast" path (no project index), so we use the filtered strategy for both.
    // The "filtered" strategy already limits fetching to MAX_COMMENTS_FOR_STATS, so it is safe.
    fast: (ids) => countCommentsFiltered(ctx, userId, ids),
    filtered: (ids) => countCommentsFiltered(ctx, userId, ids),
  });
}

/**
 * Helper to count projects the user is a member of without restrictions.
 */
async function countProjectsUnrestricted(ctx: QueryCtx, userId: Id<"users">) {
  return await efficientCount(
    ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(notDeleted),
    MAX_PROJECTS_FOR_STATS, // Optimization: Allow counting up to 500 projects (was 100)
  );
}

/**
 * Helper to count projects using a parallelized index query (optimized for few projects).
 */
async function countProjectsFast(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  // Optimization: If the number of allowed projects is small, check membership directly.
  // This avoids fetching all of the target user's memberships (potentially 1000s)
  // when we only care about a few specific projects (e.g. shared context).
  const membershipChecks = await Promise.all(
    Array.from(allowedProjectIds).map((projectId) =>
      ctx.db
        .query("projectMembers")
        .withIndex("by_project_user", (q) =>
          q.eq("projectId", projectId as Id<"projects">).eq("userId", userId),
        )
        .filter(notDeleted)
        .first(),
    ),
  );
  return membershipChecks.filter((m) => m !== null).length;
}

/**
 * Helper to count projects using a filtered scan (for large number of allowed projects).
 */
async function countProjectsFiltered(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string>,
) {
  const projectMembershipsAll = await ctx.db
    .query("projectMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .filter(notDeleted)
    .take(MAX_PROJECTS_FOR_STATS); // Optimization: Allow counting up to 500 projects (was 100)

  return projectMembershipsAll.filter((m) => allowedProjectIds.has(m.projectId)).length;
}

/**
 * Count projects the user is a member of.
 *
 * @param ctx - Query context
 * @param userId - The user whose memberships to count
 * @param allowedProjectIds - If not null, only count projects in this set (for privacy)
 */
async function countProjects(
  ctx: QueryCtx,
  userId: Id<"users">,
  allowedProjectIds: Set<string> | null,
) {
  return await executeCountStrategy(allowedProjectIds, 0, {
    unrestricted: () => countProjectsUnrestricted(ctx, userId),
    fast: (ids) => countProjectsFast(ctx, userId, ids),
    filtered: (ids) => countProjectsFiltered(ctx, userId, ids),
  });
}

/**
 * Collect aggregated statistics for a user profile.
 *
 * Returns counts for:
 * - Issues created by the user
 * - Issues assigned to the user
 * - Issues completed by the user
 * - Comments made by the user
 * - Projects the user is a member of
 *
 * Privacy:
 * - If viewing your own profile, counts include all projects.
 * - If viewing another user's profile, counts are filtered to only include
 *   projects that are SHARED between the viewer and the target user.
 */
export async function collectUserStats(
  ctx: QueryCtx,
  viewerId: Id<"users">,
  targetUserId: Id<"users">,
) {
  // If viewing another user, only count data from shared projects
  let allowedProjectIds: Set<string> | null = null;
  if (viewerId !== targetUserId) {
    const myMemberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", viewerId))
      .filter(notDeleted)
      .take(MAX_PROJECTS_FOR_STATS); // Optimization: Use higher limit for finding shared projects
    allowedProjectIds = new Set(myMemberships.map((m) => m.projectId));
  }

  // Optimize: Parallelize all counting operations
  const [
    issuesCreatedCount,
    [issuesAssignedCount, issuesCompletedCount],
    commentsCount,
    projectsCount,
  ] = await Promise.all([
    countIssuesByReporter(ctx, targetUserId, allowedProjectIds),
    countIssuesByAssignee(ctx, targetUserId, allowedProjectIds),
    countComments(ctx, targetUserId, allowedProjectIds),
    countProjects(ctx, targetUserId, allowedProjectIds),
  ]);

  return {
    issuesCreated: issuesCreatedCount,
    issuesAssigned: issuesAssignedCount,
    issuesCompleted: issuesCompletedCount,
    comments: commentsCount,
    projects: projectsCount,
  };
}

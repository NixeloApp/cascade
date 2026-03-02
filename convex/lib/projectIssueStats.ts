import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { efficientCount } from "./boundedQueries";
import { MAX_SPRINT_ISSUES } from "./queryLimits";

async function computeProjectIssueCount(ctx: QueryCtx | MutationCtx, projectId: Id<"projects">) {
  return await efficientCount(
    ctx.db
      .query("issues")
      .withIndex("by_project_deleted", (q) => q.eq("projectId", projectId).lt("isDeleted", true)),
    MAX_SPRINT_ISSUES,
  );
}

async function getProjectIssueStatsDoc(ctx: QueryCtx | MutationCtx, projectId: Id<"projects">) {
  const docs = await ctx.db
    .query("projectIssueStats")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .take(1);
  return docs[0] ?? null;
}

export async function syncProjectIssueStats(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<number> {
  const totalIssues = await computeProjectIssueCount(ctx, projectId);
  const now = Date.now();
  const existing = await getProjectIssueStatsDoc(ctx, projectId);

  if (existing) {
    await ctx.db.patch(existing._id, {
      totalIssues,
      updatedAt: now,
    });
    return totalIssues;
  }

  await ctx.db.insert("projectIssueStats", {
    projectId,
    totalIssues,
    updatedAt: now,
  });
  return totalIssues;
}

export async function getProjectIssueCounts(
  ctx: QueryCtx,
  projectIds: Id<"projects">[],
): Promise<Map<string, number>> {
  const uniqueProjectIds = [...new Set(projectIds)];
  const entries = await Promise.all(
    uniqueProjectIds.map(async (projectId) => {
      const existing = await getProjectIssueStatsDoc(ctx, projectId);
      if (existing) {
        return [projectId.toString(), existing.totalIssues] as const;
      }
      const totalIssues = await computeProjectIssueCount(ctx, projectId);
      return [projectId.toString(), totalIssues] as const;
    }),
  );

  return new Map(entries);
}

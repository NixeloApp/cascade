/**
 * Auto-Archive
 *
 * Scheduled job that archives issues in the "done" workflow category
 * that have been done for longer than the project's autoArchiveDays setting.
 * Runs daily via cron. Only processes projects that opt in.
 */

import { internalMutation } from "./_generated/server";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { DAY } from "./lib/timeUtils";

const MAX_ISSUES_PER_RUN = 500;

/** Auto-archive done issues for all projects with autoArchiveDays enabled. */
export const archiveStaleDoneIssues = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all projects with auto-archive enabled
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_deleted")
      .filter((q) =>
        q.and(
          q.neq(q.field("isDeleted"), true),
          q.gt(q.field("autoArchiveDays"), 0),
        ),
      )
      .take(BOUNDED_LIST_LIMIT);

    let totalArchived = 0;

    for (const project of projects) {
      const archiveDays = project.autoArchiveDays;
      if (!archiveDays || archiveDays <= 0) continue;

      const cutoff = now - archiveDays * DAY;

      // Find done workflow state IDs for this project
      const doneStateIds = new Set(
        project.workflowStates
          .filter((s) => s.category === "done")
          .map((s) => s.id),
      );

      if (doneStateIds.size === 0) continue;

      // Find issues in done states that haven't been archived yet
      // and were last updated before the cutoff
      const issues = await ctx.db
        .query("issues")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .filter((q) =>
          q.and(
            q.neq(q.field("isDeleted"), true),
            q.eq(q.field("archivedAt"), undefined),
            q.lt(q.field("updatedAt"), cutoff),
          ),
        )
        .take(MAX_ISSUES_PER_RUN);

      const toArchive = issues
        .filter((issue) => doneStateIds.has(issue.status))
        .slice(0, MAX_ISSUES_PER_RUN - totalArchived);

      await Promise.all(
        toArchive.map(async (issue) => {
          await ctx.db.patch(issue._id, {
            archivedAt: now,
            updatedAt: now,
          });
          await ctx.db.insert("issueActivity", {
            issueId: issue._id,
            userId: project.ownerId,
            action: "archived",
          });
        }),
      );

      totalArchived += toArchive.length;
    }

    if (totalArchived > 0) {
      console.info("[autoArchive] Archived stale done issues", {
        totalArchived,
        projectCount: projects.length,
      });
    }

    return { totalArchived };
  },
});

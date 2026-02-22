/**
 * Relationship Registry & Cascading Delete System
 *
 * Central registry of all parent-child relationships in the database.
 * Automatically handles cascading deletes/soft-deletes so you never forget.
 *
 * Usage:
 *   await cascadeDelete(ctx, "issues", issueId);
 *   await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 */

import type { GenericDatabaseWriter, GenericDataModel } from "convex/server";
import type { Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { BOUNDED_DELETE_BATCH } from "./boundedQueries";
import { conflict } from "./errors";

// Loose type for dynamic table access
type AnyDataModel = GenericDataModel;

/**
 * Relationship definition between parent and child tables
 */
export type Relationship = {
  parent: TableNames; // Parent table name (e.g., "issues")
  child: TableNames; // Child table name (e.g., "issueComments")
  foreignKey: string; // Field in child pointing to parent (e.g., "issueId")
  index: string; // Index name for fast lookup (e.g., "by_issue")
  onDelete: "cascade" | "set_null" | "restrict";
};

/**
 * Master registry of all database relationships
 * Add new relationships here when creating related tables
 */
export const RELATIONSHIPS: Relationship[] = [
  // ============================================================================
  // ISSUE RELATIONSHIPS
  // ============================================================================

  {
    parent: "issues",
    child: "issueComments",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete comments when issue deleted
  },
  {
    parent: "issues",
    child: "issueActivity",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete activity log when issue deleted
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "fromIssueId",
    index: "by_from_issue",
    onDelete: "cascade", // Delete outgoing links when issue deleted
  },
  {
    parent: "issues",
    child: "issueLinks",
    foreignKey: "toIssueId",
    index: "by_to_issue",
    onDelete: "cascade", // Delete incoming links when issue deleted
  },
  {
    parent: "issues",
    child: "issueWatchers",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete watchers when issue deleted
  },
  {
    parent: "issues",
    child: "timeEntries",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete time entries when issue deleted
  },
  {
    parent: "issues",
    child: "customFieldValues",
    foreignKey: "issueId",
    index: "by_issue",
    onDelete: "cascade", // Delete custom field values when issue deleted
  },

  // ============================================================================
  // PROJECT RELATIONSHIPS
  // ============================================================================

  {
    parent: "projects",
    child: "issues",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete all issues when project deleted
  },
  {
    parent: "projects",
    child: "sprints",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete all sprints when project deleted
  },
  {
    parent: "projects",
    child: "projectMembers",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete memberships when project deleted
  },
  {
    parent: "projects",
    child: "labels",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete labels when project deleted
  },
  {
    parent: "projects",
    child: "webhooks",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete webhooks when project deleted
  },
  {
    parent: "projects",
    child: "savedFilters",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete saved filters when project deleted
  },
  {
    parent: "projects",
    child: "automationRules",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete automation rules when project deleted
  },
  {
    parent: "projects",
    child: "customFields",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete custom fields when project deleted
  },
  {
    parent: "projects",
    child: "issueTemplates",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "cascade", // Delete issue templates when project deleted
  },
  {
    parent: "projects",
    child: "documents",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "set_null", // Keep documents, just unlink from project
  },
  {
    parent: "projects",
    child: "calendarEvents",
    foreignKey: "projectId",
    index: "by_project",
    onDelete: "set_null", // Keep events, just unlink from project
  },

  // ============================================================================
  // WORKSPACE RELATIONSHIPS (Department level)
  // ============================================================================

  {
    parent: "workspaces",
    child: "teams",
    foreignKey: "workspaceId",
    index: "by_workspace",
    onDelete: "cascade", // Delete teams when workspace deleted
  },
  {
    parent: "workspaces",
    child: "projects",
    foreignKey: "workspaceId",
    index: "by_workspace",
    onDelete: "cascade", // Delete projects when workspace deleted
  },

  // ============================================================================
  // SPRINT RELATIONSHIPS
  // ============================================================================

  {
    parent: "sprints",
    child: "issues",
    foreignKey: "sprintId",
    index: "by_sprint",
    onDelete: "set_null", // Move issues to backlog when sprint deleted
  },

  // ============================================================================
  // USER RELATIONSHIPS
  // ============================================================================

  {
    parent: "users",
    child: "notifications",
    foreignKey: "userId",
    index: "by_user",
    onDelete: "cascade", // Delete notifications when user deleted
  },

  // ============================================================================
  // TEAM RELATIONSHIPS
  // ============================================================================
  {
    parent: "teams",
    child: "teamMembers",
    foreignKey: "teamId",
    index: "by_team",
    onDelete: "cascade", // Delete members when team deleted
  },
  {
    parent: "teams",
    child: "projects",
    foreignKey: "teamId",
    index: "by_team",
    onDelete: "set_null", // Keep projects, just unlink from team
  },

  // ============================================================================
  // WEBHOOK RELATIONSHIPS
  // ============================================================================
  {
    parent: "webhooks",
    child: "webhookExecutions",
    foreignKey: "webhookId",
    index: "by_webhook",
    onDelete: "cascade", // Delete executions when webhook deleted
  },

  // ============================================================================
  // COMMENT RELATIONSHIPS
  // ============================================================================
  {
    parent: "issueComments",
    child: "issueCommentReactions",
    foreignKey: "commentId",
    index: "by_comment",
    onDelete: "cascade", // Delete reactions when comment deleted
  },

  // ============================================================================
  // CUSTOM FIELD RELATIONSHIPS
  // ============================================================================
  {
    parent: "customFields",
    child: "customFieldValues",
    foreignKey: "fieldId",
    index: "by_field",
    onDelete: "cascade", // Delete values when field deleted
  },
];

async function handleDeleteRelation(ctx: MutationCtx, rel: Relationship, recordId: Id<TableNames>) {
  // Bounded query for cascade operations - process in batches to prevent memory issues
  const children = await (ctx.db as unknown as GenericDatabaseWriter<AnyDataModel>)
    .query(rel.child)
    .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
    .take(BOUNDED_DELETE_BATCH);

  if (rel.onDelete === "cascade") {
    // Recursively delete children
    for (const child of children) {
      // Recursion needs a cast because TS can't prove child[rel.child] matches the recursion
      await cascadeDelete(ctx, rel.child, child._id as Id<TableNames>);
      await ctx.db.delete(child._id as Id<TableNames>);
    }
  } else if (rel.onDelete === "set_null") {
    // Set foreign key to null instead of deleting
    for (const child of children) {
      await ctx.db.patch(
        child._id as Id<TableNames>,
        {
          [rel.foreignKey]: undefined,
        } as Record<string, unknown>,
      );
    }
  } else if (rel.onDelete === "restrict") {
    // Don't allow delete if children exist
    if (children.length > 0) {
      throw conflict(
        `Cannot delete ${rel.parent} ${recordId}: ${children.length} ` +
          `${rel.child} record(s) still reference it`,
      );
    }
  }
}

/**
 * Automatically cascade delete all related records
 * Handles multi-level cascading (parent → child → grandchild)
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to delete
 *
 * @warning This function processes only the first `BOUNDED_DELETE_BATCH` (100) items per relationship.
 * If a parent has more than 100 children in a relationship (e.g. >100 comments), the remaining
 * children will be orphaned. For large deletions, use `collectInBatches` or handle manually.
 *
 * @example
 * await cascadeDelete(ctx, "issues", issueId);
 * // Deletes issue AND all comments, activities, links, watchers, time entries
 */
export async function cascadeDelete<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
): Promise<void> {
  // Find all relationships where this table is the parent
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleDeleteRelation(ctx, rel, recordId);
  }
}

/**
 * Soft delete version - cascades isDeleted flag to children
 * Used when implementing soft deletes
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to soft delete
 * @param deletedBy - User ID who performed the deletion
 * @param deletedAt - Timestamp of deletion
 *
 * @warning This function processes only the first `BOUNDED_DELETE_BATCH` (100) items per relationship.
 * If a parent has more than 100 children in a relationship, the remaining children will not be
 * soft-deleted. For large datasets, handle deletion manually or in batches.
 *
 * @example
 * const now = Date.now();
 * await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 * // Marks issue AND all children as deleted
 */
async function handleSoftDeleteRelation(
  ctx: MutationCtx,
  rel: Relationship,
  recordId: Id<TableNames>,
  deletedBy: Id<"users">,
  deletedAt: number,
) {
  if (rel.onDelete === "cascade") {
    // Bounded query for cascade operations
    const children = await (ctx.db as unknown as GenericDatabaseWriter<AnyDataModel>)
      .query(rel.child)
      .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
      .take(BOUNDED_DELETE_BATCH);

    for (const child of children) {
      // Recursively soft delete children
      await cascadeSoftDelete(ctx, rel.child, child._id as Id<TableNames>, deletedBy, deletedAt);

      // Mark this child as deleted
      await ctx.db.patch(
        child._id as Id<TableNames>,
        {
          isDeleted: true,
          deletedAt,
          deletedBy,
        } as Record<string, unknown>,
      ); // Partial update of dynamic fields is easier with alias
    }
  }
}

/**
 * Soft delete version - cascades isDeleted flag to children
 * Used when implementing soft deletes
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to soft delete
 * @param deletedBy - User ID who performed the deletion
 * @param deletedAt - Timestamp of deletion
 *
 * @example
 * const now = Date.now();
 * await cascadeSoftDelete(ctx, "issues", issueId, userId, now);
 * // Marks issue AND all children as deleted
 */
export async function cascadeSoftDelete<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
  deletedBy: Id<"users">,
  deletedAt: number,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleSoftDeleteRelation(ctx, rel, recordId, deletedBy, deletedAt);
  }
}

async function handleRestoreRelation(
  ctx: MutationCtx,
  rel: Relationship,
  recordId: Id<TableNames>,
) {
  if (rel.onDelete === "cascade") {
    // Find children (including soft-deleted ones) - bounded query
    const children = await (ctx.db as unknown as GenericDatabaseWriter<AnyDataModel>)
      .query(rel.child)
      .withIndex(rel.index, (q) => q.eq(rel.foreignKey, recordId))
      .take(BOUNDED_DELETE_BATCH);

    for (const child of children) {
      // Recursively restore children
      await cascadeRestore(ctx, rel.child, child._id as Id<TableNames>);

      // Remove deleted flags
      await ctx.db.patch(
        child._id as Id<TableNames>,
        {
          isDeleted: undefined,
          deletedAt: undefined,
          deletedBy: undefined,
        } as Record<string, unknown>,
      );
    }
  }
}

/**
 * Restore cascade - removes isDeleted flag from children
 * Used when restoring a soft-deleted record
 *
 * @param ctx - Mutation context
 * @param table - Parent table name
 * @param recordId - ID of parent record to restore
 *
 * @warning This function processes only the first `BOUNDED_DELETE_BATCH` (100) items per relationship.
 * If a parent has more than 100 children in a relationship, the remaining children will not be
 * restored. For large datasets, handle restoration manually or in batches.
 *
 * @example
 * await cascadeRestore(ctx, "issues", issueId);
 * // Restores issue AND all children from soft delete
 */
export async function cascadeRestore<T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  recordId: Id<T>,
): Promise<void> {
  const childRelationships = RELATIONSHIPS.filter((r) => r.parent === table);

  for (const rel of childRelationships) {
    await handleRestoreRelation(ctx, rel, recordId);
  }
}

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { pruneNull } from "convex-helpers";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery, projectAdminMutation } from "./customFunctions";
import { batchFetchProjects, batchFetchUsers, getUserName } from "./lib/batchHelpers";
import { BOUNDED_LIST_LIMIT, efficientCount } from "./lib/boundedQueries";

/** Maximum issue count to compute for a project list view */
const MAX_ISSUE_COUNT = 1000;

import { logAudit } from "./lib/audit";
import { ARRAY_LIMITS, validate } from "./lib/constrainedValidators";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { getOrganizationRole, isOrganizationMember } from "./lib/organizationAccess";
import { fetchPaginatedQuery } from "./lib/queryHelpers";
import { cascadeRestore, cascadeSoftDelete } from "./lib/relationships";
import { notDeleted, softDeleteFields } from "./lib/softDeleteHelpers";
import { getWorkspaceRole } from "./lib/workspaceAccess";
import { canAccessProject, getProjectRole } from "./projectAccess";
import { boardTypes, projectRoles, workflowCategories } from "./validators";

/**
 * Create a new project.
 *
 * Validates inputs, checks for duplicate keys, verifies organization/workspace membership,
 * and sets up default workflow states if not provided.
 *
 * @param name - Project name.
 * @param key - Project key (e.g., "PROJ"). Must be unique.
 * @param description - Optional description.
 * @param boardType - Type of board (e.g., "kanban", "scrum").
 * @param workflowStates - Optional custom workflow states. Defaults to standard Todo/In Progress/Review/Done.
 * @param organizationId - Organization ID.
 * @param workspaceId - Workspace ID.
 * @param teamId - Optional Team ID. If provided, project belongs to the team.
 * @param ownerId - Optional owner ID. Defaults to the creator.
 * @param isPublic - Whether the project is visible to the entire organization.
 * @param sharedWithTeamIds - Optional list of teams to share the project with.
 *
 * @returns The ID of the newly created project.
 * @throws {ConvexError} "Conflict" if project key already exists.
 * @throws {ConvexError} "Validation" if inputs are invalid or IDs don't match hierarchy.
 * @throws {ConvexError} "Forbidden" if user is not an Organization Admin or Workspace Member.
 */
export const createProject = authenticatedMutation({
  args: {
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    boardType: boardTypes,
    workflowStates: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          category: workflowCategories,
          order: v.number(),
          wipLimit: v.optional(v.number()),
        }),
      ),
    ),
    // Ownership (required)
    organizationId: v.id("organizations"), // organization this project belongs to
    workspaceId: v.id("workspaces"), // Workspace this project belongs to
    // Optional ownership overrides
    teamId: v.optional(v.id("teams")), // Team owner (optional - null for workspace projects)
    ownerId: v.optional(v.id("users")), // User owner (defaults to creator)
    // Sharing settings
    isPublic: v.optional(v.boolean()), // Visible to all organization members
    sharedWithTeamIds: v.optional(v.array(v.id("teams"))), // Share with specific teams
  },
  returns: v.object({
    projectId: v.id("projects"),
  }),
  handler: async (ctx, args) => {
    // Validate input constraints
    validate.name(args.name, "name");
    validate.projectKey(args.key);
    validate.description(args.description);
    if (args.sharedWithTeamIds) {
      validate.tags(args.sharedWithTeamIds, "sharedWithTeamIds");
    }
    if (args.workflowStates && args.workflowStates.length > ARRAY_LIMITS.WORKFLOW_STATES.max) {
      throw validation(
        "workflowStates",
        `Maximum ${ARRAY_LIMITS.WORKFLOW_STATES.max} workflow states allowed`,
      );
    }

    // Check if project key already exists
    const existingProject = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key.toUpperCase()))
      .filter(notDeleted)
      .first();

    if (existingProject) throw conflict("Project key already exists");

    // Validate ownership hierarchy and permissions
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw notFound("workspace", args.workspaceId);

    // 1. Integrity check: Workspace must belong to Organization
    if (workspace.organizationId !== args.organizationId) {
      throw validation("workspaceId", "Workspace does not belong to the specified organization");
    }

    // 2. Permission check: User must be Org Admin OR Workspace Member
    const orgRole = await getOrganizationRole(ctx, args.organizationId, ctx.userId);
    const isOrgAdmin = orgRole === "owner" || orgRole === "admin";
    const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);

    // Allow if user is Org Admin OR has any role in the workspace
    if (!(isOrgAdmin || workspaceRole)) {
      throw forbidden(
        "member",
        "You must be an organization admin or workspace member to create a project here",
      );
    }

    // Validate: if teamId provided, ensure it belongs to the workspace
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team) throw notFound("team", args.teamId);
      if (team.workspaceId !== args.workspaceId) {
        throw validation("teamId", "Team must belong to the specified workspace");
      }
    }

    const now = Date.now();
    const defaultWorkflowStates = [
      { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
      { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
      { id: "review", name: "Review", category: "inprogress" as const, order: 2 },
      { id: "done", name: "Done", category: "done" as const, order: 3 },
    ];

    // Owner is the specified user, or defaults to creator
    const ownerId = args.ownerId ?? ctx.userId;

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      key: args.key.toUpperCase(),
      description: args.description,
      createdBy: ctx.userId,
      updatedAt: now,
      boardType: args.boardType,
      workflowStates: args.workflowStates ?? defaultWorkflowStates,
      // Ownership (required)
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      ownerId,
      // Optional
      teamId: args.teamId,
      isPublic: args.isPublic ?? false,
      sharedWithTeamIds: args.sharedWithTeamIds ?? [],
    });

    // Add creator as admin in projectMembers table (for individual access control)
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: ctx.userId,
      role: "admin",
      addedBy: ctx.userId,
    });

    await logAudit(ctx, {
      action: "project_created",
      actorId: ctx.userId,
      targetId: projectId,
      targetType: "projects",
      metadata: {
        name: args.name,
        key: args.key,
        organizationId: args.organizationId,
      },
    });

    return { projectId };
  },
});

/**
 * Get paginated projects the current user is a member of.
 *
 * Includes issue counts for each project, optimized by using `efficientCount` and range queries.
 *
 * @param organizationId - Optional organization ID to filter by.
 * @param paginationOpts - Pagination options (cursor, limit).
 *
 * @returns A paginated list of projects with extra metadata (creator name, issue count, ownership, role).
 */
export const getCurrentUserProjects = authenticatedQuery({
  args: {
    organizationId: v.optional(v.id("organizations")),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    const paginationOpts = args.paginationOpts || { numItems: 20, cursor: null };

    // Paginate memberships directly via index
    const results = await fetchPaginatedQuery<Doc<"projectMembers">>(ctx, {
      paginationOpts,
      query: (db) =>
        db
          .query("projectMembers")
          .withIndex("by_user", (q) => q.eq("userId", ctx.userId).lt("isDeleted", true)),
    });

    if (results.page.length === 0) {
      return { ...results, page: [] };
    }

    // Batch fetch all projects
    const projectIds = results.page.map((m) => m.projectId);
    const projectMap = await batchFetchProjects(ctx, projectIds);

    // Build role map
    const roleMap = new Map(results.page.map((m) => [m.projectId.toString(), m.role]));

    // Batch fetch creators
    const creatorIds = [...projectMap.values()].map((w) => w.createdBy);
    const creatorMap = await batchFetchUsers(ctx, creatorIds);

    // Fetch issue counts
    const issueCountsPromises = projectIds.map(async (projectId) => {
      // batch fetch
      // Optimization: by_project_deleted index includes undefined/false values for isDeleted (active items).
      // We can query active issues directly using a range query .lt("isDeleted", true).
      // This matches both undefined and false (active), excluding true (deleted).
      const count = await efficientCount(
        ctx.db
          .query("issues")
          .withIndex("by_project_deleted", (q) =>
            q.eq("projectId", projectId).lt("isDeleted", true),
          ),
        MAX_ISSUE_COUNT,
      );

      return {
        projectId,
        count,
      };
    });
    const issueCounts = await Promise.all(issueCountsPromises);
    const issueCountByProject = new Map(
      issueCounts.map(({ projectId, count }) => [projectId.toString(), count]),
    );

    // Build result
    const page = pruneNull(
      results.page.map((membership) => {
        const project = projectMap.get(membership.projectId);
        if (!project) return null;

        // Filter by organizationId if provided
        if (args.organizationId && project.organizationId !== args.organizationId) {
          return null;
        }

        const creator = creatorMap.get(project.createdBy);
        const projId = membership.projectId.toString();

        return {
          ...project,
          creatorName: getUserName(creator),
          issueCount: issueCountByProject.get(projId) ?? 0,
          isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
          userRole: roleMap.get(projId) ?? null,
        };
      }),
    );

    return {
      ...results,
      page,
    };
  },
});

/**
 * Get paginated projects belonging to a specific team.
 *
 * @param teamId - The team ID.
 * @param paginationOpts - Pagination options.
 *
 * @returns A paginated list of projects in the team.
 * @throws {ConvexError} "Forbidden" if user is not a member of the team or an Organization Admin.
 */
export const getTeamProjects = authenticatedQuery({
  args: {
    teamId: v.id("teams"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // Check access control
    const team = await ctx.db.get(args.teamId);
    if (!team) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const { getTeamRole } = await import("./lib/teamAccess");
    const { isOrganizationAdmin } = await import("./lib/organizationAccess");

    const role = await getTeamRole(ctx, args.teamId, ctx.userId);
    const isAdmin = await isOrganizationAdmin(ctx, team.organizationId, ctx.userId);

    if (!(role || isAdmin)) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    return await fetchPaginatedQuery(ctx, {
      paginationOpts: args.paginationOpts || { numItems: 20, cursor: null },
      query: (db) => db.query("projects").withIndex("by_team", (q) => q.eq("teamId", args.teamId)),
    });
  },
});

/**
 * Get paginated projects in a workspace that are NOT associated with a team.
 *
 * @param workspaceId - The workspace ID.
 * @param paginationOpts - Pagination options.
 *
 * @returns A paginated list of projects directly in the workspace.
 * @throws {ConvexError} "Forbidden" if user is not a member of the organization.
 */
export const getWorkspaceProjects = authenticatedQuery({
  args: {
    workspaceId: v.id("workspaces"),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, args) => {
    // Check workspace access
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    // Check if user is in organization
    const isMember = await isOrganizationMember(ctx, workspace.organizationId, ctx.userId);
    if (!isMember) {
      throw forbidden("member", "You must be an organization member to access this workspace");
    }

    // Fetch projects directly attached to workspace but NO teamId
    // We use by_workspace index. Since we can't complex filter efficiently in pagination
    // without a specific index (by_workspace_no_team?), we rely on filtering stream
    // or we scan.
    // But `filter` in `paginate` is supported.
    return await fetchPaginatedQuery(ctx, {
      paginationOpts: args.paginationOpts || { numItems: 20, cursor: null },
      query: (db) =>
        db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          // Note: We use a filter here because we lack a specific `by_workspace_no_team` index.
          // This works for now as the number of projects per workspace is manageable,
          // but for high scale, we should add an index or a "orphaned" status field.
          .filter((q) => q.eq(q.field("teamId"), undefined)),
    });
  },
});

/**
 * Get project details by ID.
 *
 * Includes bounded list of members and the current user's role.
 *
 * @param id - Project ID.
 *
 * @returns Project object with additional metadata (creator, members, role), or null if not found.
 * @throws {ConvexError} "Forbidden" if the user does not have access to the project.
 */
export const getProject = authenticatedQuery({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.id);

    if (!project) {
      return null;
    }

    // Check access permissions
    const hasAccess = await canAccessProject(ctx, project._id, ctx.userId);
    if (!hasAccess) throw forbidden();

    const creator = await ctx.db.get(project.createdBy);

    const members = await getProjectMembers(ctx, project._id);

    const userRole = await getProjectRole(ctx, project._id, ctx.userId);

    return {
      ...project,

      creatorName: getUserName(creator),
      members,
      isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
      userRole,
    };
  },
});

/**
 * Get project details by project key (e.g., "PROJ").
 *
 * @param key - The unique project key string.
 *
 * @returns Project object with metadata, or null if not found or no access.
 */
export const getByKey = authenticatedQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    // Find project by key
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .filter(notDeleted)
      .first();

    if (!project) {
      return null;
    }

    const hasAccess = await canAccessProject(ctx, project._id, ctx.userId);
    if (!hasAccess) {
      return null; // Return null instead of throwing for cleaner UI handling
    }

    const creator = await ctx.db.get(project.createdBy);

    const members = await getProjectMembers(ctx, project._id);

    const userRole = await getProjectRole(ctx, project._id, ctx.userId);

    return {
      ...project,

      creatorName: getUserName(creator),
      members,
      isOwner: project.ownerId === ctx.userId || project.createdBy === ctx.userId,
      userRole,
    };
  },
});

/**
 * Update project details.
 *
 * Requires project admin permissions.
 *
 * @param name - Optional new name.
 * @param description - Optional new description.
 * @param isPublic - Optional visibility toggle.
 *
 * @returns Object containing the projectId.
 * @throws {ConvexError} "Forbidden" if user is not a project admin.
 */
export const updateProject = projectAdminMutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()), // organization-visible
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId, ctx.project

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.isPublic !== undefined) {
      updates.isPublic = args.isPublic;
    }

    await ctx.db.patch(ctx.projectId, updates);

    await logAudit(ctx, {
      action: "project_updated",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: updates as Record<string, string | number | boolean>,
    });

    return { success: true, projectId: ctx.projectId };
  },
});

/**
 * Soft delete a project.
 *
 * Marks the project as deleted and cascades the deletion to related resources.
 * Only the project owner or creator can delete it.
 *
 * @param projectId - The project ID.
 *
 * @returns { deleted: true }.
 * @throws {ConvexError} "Forbidden" if user is not the owner or creator.
 * @throws {ConvexError} "NotFound" if project doesn't exist.
 */
export const softDeleteProject = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    // Only project owner can delete the project
    if (project.createdBy !== ctx.userId && project.ownerId !== ctx.userId) {
      throw forbidden("owner");
    }

    // Soft delete with automatic cascading
    const deletedAt = Date.now();
    await ctx.db.patch(args.projectId, softDeleteFields(ctx.userId));
    await cascadeSoftDelete(ctx, "projects", args.projectId, ctx.userId, deletedAt);

    await logAudit(ctx, {
      action: "project_deleted",
      actorId: ctx.userId,
      targetId: args.projectId,
      targetType: "projects",
      metadata: { deletedAt },
    });

    return { success: true, deleted: true };
  },
});

/**
 * Restore a soft-deleted project.
 *
 * Only the project owner or creator can restore it.
 *
 * @param projectId - The project ID.
 *
 * @returns { restored: true }.
 * @throws {ConvexError} "Validation" if project is not deleted.
 * @throws {ConvexError} "Forbidden" if user is not the owner or creator.
 */
export const restoreProject = authenticatedMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw notFound("project", args.projectId);

    if (!project.isDeleted) {
      throw validation("projectId", "Project is not deleted");
    }

    // Only project owner can restore
    if (project.createdBy !== ctx.userId && project.ownerId !== ctx.userId) {
      throw forbidden("owner");
    }

    // Restore with automatic cascading
    await ctx.db.patch(args.projectId, {
      isDeleted: undefined,
      deletedAt: undefined,
      deletedBy: undefined,
    });

    // Cascade restore to all related resources
    await cascadeRestore(ctx, "projects", args.projectId);

    await logAudit(ctx, {
      action: "project_restored",
      actorId: ctx.userId,
      targetId: args.projectId,
      targetType: "projects",
    });

    return { success: true, restored: true };
  },
});

/**
 * Update the project's workflow states.
 *
 * Defines the columns and statuses available on the project board.
 * Requires project admin permissions.
 *
 * @param workflowStates - Array of workflow state objects (id, name, category, order, wipLimit).
 */
export const updateWorkflow = projectAdminMutation({
  args: {
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: workflowCategories,
        order: v.number(),
        // WIP limit: max issues allowed in this column (0 or undefined = no limit)
        wipLimit: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId

    await ctx.db.patch(ctx.projectId, {
      workflowStates: args.workflowStates,
      updatedAt: Date.now(),
    });

    await logAudit(ctx, {
      action: "workflow_updated",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: { workflowStates: JSON.stringify(args.workflowStates) },
    });

    return { success: true };
  },
});

/**
 * Add a new member to the project.
 *
 * Finds the user by email and creates a membership record.
 * Requires project admin permissions.
 *
 * @param userEmail - Email address of the user to add.
 * @param role - Role to assign (e.g., "member", "admin").
 *
 * @throws {ConvexError} "NotFound" if user doesn't exist.
 * @throws {ConvexError} "Conflict" if user is already a member.
 */
export const addProjectMember = projectAdminMutation({
  args: {
    userEmail: v.string(),
    role: projectRoles,
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) throw notFound("user");

    // Check if user is in the organization
    const isMember = await isOrganizationMember(ctx, ctx.project.organizationId, user._id);
    if (!isMember) {
      throw validation(
        "userEmail",
        "User must be a member of the organization to be added to this project",
      );
    }

    // Check if already a member
    const existingMembership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) => q.eq("projectId", ctx.projectId).eq("userId", user._id))
      .first();

    if (existingMembership) throw conflict("User is already a member");

    const _now = Date.now();

    // Add to projectMembers table
    await ctx.db.insert("projectMembers", {
      projectId: ctx.projectId,
      userId: user._id,
      role: args.role,
      addedBy: ctx.userId,
    });

    await logAudit(ctx, {
      action: "member_added",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: {
        memberId: user._id,
        role: args.role,
      },
    });

    return { success: true };
  },
});

/**
 * Update a project member's role.
 *
 * Cannot change the role of the project owner.
 * Requires project admin permissions.
 *
 * @param memberId - User ID of the member.
 * @param newRole - New role to assign.
 *
 * @throws {ConvexError} "Forbidden" if trying to change the project owner's role.
 * @throws {ConvexError} "NotFound" if membership doesn't exist.
 */
export const updateProjectMemberRole = projectAdminMutation({
  args: {
    memberId: v.id("users"),
    newRole: projectRoles,
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId, ctx.project

    // Can't change project owner's role
    if (ctx.project.ownerId === args.memberId || ctx.project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot change project owner's role");
    }

    // Find membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", ctx.projectId).eq("userId", args.memberId),
      )
      .first();

    if (!membership) throw notFound("membership");

    await ctx.db.patch(membership._id, {
      role: args.newRole,
    });

    await logAudit(ctx, {
      action: "member_role_updated",
      actorId: ctx.userId,
      targetId: ctx.projectId,
      targetType: "projects",
      metadata: {
        memberId: args.memberId,
        newRole: args.newRole,
      },
    });

    return { success: true };
  },
});

/**
 * Remove a member from the project.
 *
 * Cannot remove the project owner.
 * Requires project admin permissions.
 *
 * @param memberId - User ID of the member to remove.
 *
 * @throws {ConvexError} "Forbidden" if trying to remove the project owner.
 */
export const removeProjectMember = projectAdminMutation({
  args: {
    memberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // adminMutation handles auth + admin check + provides ctx.projectId, ctx.project

    // Can't remove the project owner
    if (ctx.project.ownerId === args.memberId || ctx.project.createdBy === args.memberId) {
      throw forbidden(undefined, "Cannot remove project owner");
    }

    // Find and delete membership
    const membership = await ctx.db
      .query("projectMembers")
      .withIndex("by_project_user", (q) =>
        q.eq("projectId", ctx.projectId).eq("userId", args.memberId),
      )
      .first();

    if (membership) {
      await ctx.db.delete(membership._id);

      await logAudit(ctx, {
        action: "member_removed",
        actorId: ctx.userId,
        targetId: ctx.projectId,
        targetType: "projects",
        metadata: {
          memberId: args.memberId,
        },
      });
    }

    return { success: true };
  },
});

/**
 * Get the current user's role in a project.
 *
 * @param projectId - The project ID.
 *
 * @returns The role string ("admin", "member", etc.) or null if not a member.
 */
export const getProjectUserRole = authenticatedQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await getProjectRole(ctx, args.projectId, ctx.userId);
  },
});

interface ProjectMember {
  _id: Id<"users">;
  name: string;
  email: string | undefined;
  image: string | undefined;
  role: Doc<"projectMembers">["role"];
  addedAt: number;
}

async function getProjectMembers(
  ctx: QueryCtx,
  projectId: Id<"projects">,
): Promise<ProjectMember[]> {
  // Get members with their roles from projectMembers table (bounded)
  const memberships = await ctx.db
    .query("projectMembers")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .filter(notDeleted)
    .take(BOUNDED_LIST_LIMIT);

  // Batch fetch all members to avoid N+1
  const memberUserIds = memberships.map((m) => m.userId);
  const memberMap = await batchFetchUsers(ctx, memberUserIds);

  return memberships.map((membership) => {
    const member = memberMap.get(membership.userId);
    // Only use name if it's a non-empty string; fall back to "Unknown" (avoid exposing email as display name)
    const displayName = member?.name?.trim() ? member.name : "Unknown";
    return {
      _id: membership.userId,
      name: displayName,
      email: member?.email,
      image: member?.image,
      role: membership.role,
      addedAt: membership._creationTime,
    };
  });
}

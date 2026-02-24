import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticatedMutation } from "./customFunctions";
import { BOUNDED_LIST_LIMIT } from "./lib/boundedQueries";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { getOrganizationRole } from "./lib/organizationAccess";
import { notDeleted } from "./lib/softDeleteHelpers";
import { getTeamRole } from "./lib/teamAccess";
import { getWorkspaceRole } from "./lib/workspaceAccess";

/** List all built-in project templates available for new project creation. */
export const list = query({
  args: {},
  // Note: Returns full projectTemplates documents. Return type validation omitted
  // due to complex nested arrays (workflowStates, defaultLabels).
  handler: async (ctx) => {
    // Get all built-in templates
    const templates = await ctx.db
      .query("projectTemplates")
      .withIndex("by_built_in", (q) => q.eq("isBuiltIn", true))
      .take(BOUNDED_LIST_LIMIT);

    return templates;
  },
});

/** Get a single project template by ID. */
export const get = query({
  args: { id: v.id("projectTemplates") },
  // Note: Returns full projectTemplates document or null
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Create a new project from a template, including workflow states, labels, and admin membership. */
export const createFromTemplate = authenticatedMutation({
  args: {
    templateId: v.id("projectTemplates"),
    projectName: v.string(),
    projectKey: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"), // Required: organization this project belongs to
    workspaceId: v.id("workspaces"), // Required: workspace this project belongs to
    teamId: v.optional(v.id("teams")), // Required: team this project belongs to
  },
  returns: v.object({ projectId: v.id("projects") }),
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw notFound("template", args.templateId);
    }

    // Check if project key already exists
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .filter(notDeleted)
      .first();

    if (existing) {
      throw conflict("Project key already exists");
    }

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

    // Allow if user is Org Admin OR has any role in the workspace
    if (!isOrgAdmin) {
      const workspaceRole = await getWorkspaceRole(ctx, args.workspaceId, ctx.userId);
      if (!workspaceRole) {
        throw forbidden(
          "member",
          "You must be an organization admin or workspace member to create a project here",
        );
      }
    }

    // Validate: if teamId provided, ensure it belongs to the workspace
    if (args.teamId) {
      const team = await ctx.db.get(args.teamId);
      if (!team) throw notFound("team", args.teamId);
      if (team.workspaceId !== args.workspaceId) {
        throw validation("teamId", "Team must belong to the specified workspace");
      }

      // Security: User must be team member OR Org Admin to assign project to team
      const teamRole = await getTeamRole(ctx, args.teamId, ctx.userId);
      if (!(teamRole || isOrgAdmin)) {
        throw forbidden(
          "member",
          "You must be a team member or organization admin to assign this project to the team",
        );
      }
    }

    const now = Date.now();

    // Create project with template settings
    const projectId = await ctx.db.insert("projects", {
      name: args.projectName,
      key: args.projectKey,
      description: args.description,
      organizationId: args.organizationId,
      workspaceId: args.workspaceId,
      teamId: args.teamId,
      ownerId: ctx.userId,
      createdBy: ctx.userId,
      updatedAt: now,
      isPublic: false,
      boardType: template.boardType,
      workflowStates: template.workflowStates,
    });

    // Add creator as admin member
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: ctx.userId,
      role: "admin",
      addedBy: ctx.userId,
    });

    // Create default labels from template (in parallel)
    await Promise.all(
      template.defaultLabels.map((labelTemplate) =>
        ctx.db.insert("labels", {
          projectId,
          name: labelTemplate.name,
          color: labelTemplate.color,
          createdBy: ctx.userId,
        }),
      ),
    );

    return { projectId };
  },
});

/** Seed the database with built-in project templates (Software, Kanban, Marketing, Design). Idempotent. */
export const initializeBuiltInTemplates = mutation({
  args: {},
  returns: v.object({ success: v.boolean(), initialized: v.boolean() }),
  handler: async (ctx) => {
    const _now = Date.now();

    // Check if templates already exist
    const existing = await ctx.db
      .query("projectTemplates")
      .withIndex("by_built_in", (q) => q.eq("isBuiltIn", true))
      .first();

    if (existing) {
      return { success: true, initialized: false }; // Already initialized
    }

    // Software Development Template
    await ctx.db.insert("projectTemplates", {
      name: "Software Development",
      description: "For agile software development teams with sprints and scrum practices",
      category: "software",
      icon: "💻",
      boardType: "scrum",
      workflowStates: [
        { id: "backlog", name: "Backlog", category: "todo", order: 0 },
        { id: "todo", name: "To Do", category: "todo", order: 1 },
        { id: "in-progress", name: "In Progress", category: "inprogress", order: 2 },
        { id: "review", name: "Code Review", category: "inprogress", order: 3 },
        { id: "testing", name: "Testing", category: "inprogress", order: 4 },
        { id: "done", name: "Done", category: "done", order: 5 },
      ],
      defaultLabels: [
        { name: "bug", color: "#EF4444" },
        { name: "feature", color: "#3B82F6" },
        { name: "enhancement", color: "#10B981" },
        { name: "documentation", color: "#8B5CF6" },
        { name: "urgent", color: "#F59E0B" },
      ],
      isBuiltIn: true,
    });

    // Kanban Template
    await ctx.db.insert("projectTemplates", {
      name: "Simple Kanban",
      description: "Basic kanban board for continuous workflow",
      category: "general",
      icon: "📋",
      boardType: "kanban",
      workflowStates: [
        { id: "todo", name: "To Do", category: "todo", order: 0 },
        { id: "doing", name: "Doing", category: "inprogress", order: 1 },
        { id: "done", name: "Done", category: "done", order: 2 },
      ],
      defaultLabels: [
        { name: "priority", color: "#EF4444" },
        { name: "research", color: "#3B82F6" },
        { name: "design", color: "#8B5CF6" },
      ],
      isBuiltIn: true,
    });

    // Marketing Campaign Template
    await ctx.db.insert("projectTemplates", {
      name: "Marketing Campaign",
      description: "For planning and executing marketing campaigns",
      category: "marketing",
      icon: "📢",
      boardType: "kanban",
      workflowStates: [
        { id: "ideas", name: "Ideas", category: "todo", order: 0 },
        { id: "planning", name: "Planning", category: "inprogress", order: 1 },
        { id: "creating", name: "Creating Content", category: "inprogress", order: 2 },
        { id: "review", name: "Review", category: "inprogress", order: 3 },
        { id: "published", name: "Published", category: "done", order: 4 },
      ],
      defaultLabels: [
        { name: "social-media", color: "#3B82F6" },
        { name: "email", color: "#10B981" },
        { name: "content", color: "#8B5CF6" },
        { name: "urgent", color: "#EF4444" },
      ],
      isBuiltIn: true,
    });

    // Design Project Template
    await ctx.db.insert("projectTemplates", {
      name: "Design Project",
      description: "For design teams working on creative projects",
      category: "design",
      icon: "🎨",
      boardType: "kanban",
      workflowStates: [
        { id: "brief", name: "Brief", category: "todo", order: 0 },
        { id: "research", name: "Research", category: "inprogress", order: 1 },
        { id: "concept", name: "Concept", category: "inprogress", order: 2 },
        { id: "design", name: "Design", category: "inprogress", order: 3 },
        { id: "feedback", name: "Feedback", category: "inprogress", order: 4 },
        { id: "delivered", name: "Delivered", category: "done", order: 5 },
      ],
      defaultLabels: [
        { name: "ui", color: "#3B82F6" },
        { name: "ux", color: "#10B981" },
        { name: "branding", color: "#F59E0B" },
        { name: "illustration", color: "#8B5CF6" },
      ],
      isBuiltIn: true,
    });

    return { success: true, initialized: true };
  },
});

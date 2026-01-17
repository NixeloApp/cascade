import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notDeleted } from "./lib/softDeleteHelpers";

export const list = query({
  args: {},
  returns: v.array(v.any()), // Struct is complex, using v.any() for full doc return
  // Or better: v.array(v.object({ _id: v.id("projectTemplates"), name: v.string(), ... }))
  // I'll use v.array(v.any()) as a safe fallback for full doc return in this context
  // given the complexity of nested arrays in workflowStates/defaultLabels.
  handler: async (ctx) => {
    // Get all built-in templates
    const templates = await ctx.db
      .query("projectTemplates")
      .withIndex("by_built_in", (q) => q.eq("isBuiltIn", true))
      .collect();

    return templates;
  },
});

export const get = query({
  args: { id: v.id("projectTemplates") },
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createFromTemplate = mutation({
  args: {
    templateId: v.id("projectTemplates"),
    projectName: v.string(),
    projectKey: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"), // Required: organization this project belongs to
    workspaceId: v.id("workspaces"), // Required: workspace this project belongs to
    teamId: v.optional(v.id("teams")), // Required: team this project belongs to
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Verify user is a member of the organization
    const organizationMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization_user", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", userId),
      )
      .first();

    if (!organizationMembership) {
      throw new Error("You must be a member of this organization to create projects");
    }

    // Check if project key already exists
    const existing = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", args.projectKey))
      .filter(notDeleted)
      .first();

    if (existing) {
      throw new Error("Project key already exists");
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
      ownerId: userId,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      boardType: template.boardType,
      workflowStates: template.workflowStates,
    });

    // Add creator as admin member
    await ctx.db.insert("projectMembers", {
      projectId,
      userId,
      role: "admin",
      addedBy: userId,
      addedAt: now,
    });

    // Create default labels from template
    for (const labelTemplate of template.defaultLabels) {
      await ctx.db.insert("labels", {
        projectId,
        name: labelTemplate.name,
        color: labelTemplate.color,
        createdBy: userId,
        createdAt: now,
      });
    }

    return projectId;
  },
});

// Initialize built-in templates (would be called once during setup)
export const initializeBuiltInTemplates = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    // Check if templates already exist
    const existing = await ctx.db
      .query("projectTemplates")
      .withIndex("by_built_in", (q) => q.eq("isBuiltIn", true))
      .first();

    if (existing) {
      return; // Already initialized
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
      createdAt: now,
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
      createdAt: now,
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
      createdAt: now,
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
      createdAt: now,
    });
  },
});

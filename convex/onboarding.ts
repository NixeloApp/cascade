import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./customFunctions";
import { getSearchContent } from "./issues/helpers";
import { BOUNDED_DELETE_BATCH, BOUNDED_RELATION_LIMIT, safeCollect } from "./lib/boundedQueries";
import { conflict, forbidden, notFound, validation } from "./lib/errors";
import { getOrganizationRole } from "./lib/organizationAccess";
import { notDeleted } from "./lib/softDeleteHelpers";
import { WEEK } from "./lib/timeUtils";
import { inviteRoles, personas } from "./validators";

/** Check if email is a test email (@inbox.mailtrap.io) */
const isTestEmail = (email?: string) => email?.endsWith("@inbox.mailtrap.io") ?? false;

/**
 * Get onboarding status for current user
 */
export const getOnboardingStatus = authenticatedQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("userOnboarding"),
      _creationTime: v.number(),
      userId: v.id("users"),
      onboardingCompleted: v.boolean(),
      onboardingStep: v.optional(v.number()),
      sampleWorkspaceCreated: v.optional(v.boolean()),
      sampleProjectCreated: v.optional(v.boolean()),
      tourShown: v.boolean(),
      wizardCompleted: v.boolean(),
      checklistDismissed: v.boolean(),
      onboardingPersona: v.optional(personas),
      wasInvited: v.optional(v.boolean()),
      invitedByName: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    return onboarding
      ? {
          ...onboarding,
          createdAt: onboarding._creationTime,
        }
      : null;
  },
});

/**
 * Check if user has completed any issue (for onboarding checklist)
 * Optimized: uses batch fetching to avoid N+1 queries
 */
export const hasCompletedIssue = authenticatedQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    // Get user's projects to check their workflow states
    const memberships = await ctx.db
      .query("projectMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .take(10); // Only check first 10 projects

    if (memberships.length === 0) return false;

    // Batch fetch all projects at once to avoid N+1
    const projectIds = memberships.map((m) => m.projectId);
    const projects = await Promise.all(projectIds.map((id) => ctx.db.get(id)));

    // Build list of all (projectId, doneStateId) pairs to check
    const checkPairs: { projectId: Id<"projects">; stateId: string }[] = [];
    for (let i = 0; i < memberships.length; i++) {
      const project = projects[i];
      if (!project) continue;

      const doneStateIds = project.workflowStates
        .filter((s) => s.category === "done")
        .map((s) => s.id);

      for (const stateId of doneStateIds) {
        checkPairs.push({ projectId: memberships[i].projectId, stateId });
      }
    }

    if (checkPairs.length === 0) return false;

    // Check all done states in parallel
    const results = await Promise.all(
      checkPairs.map(({ projectId, stateId }) =>
        ctx.db
          .query("issues")
          .withIndex("by_project_status", (q) =>
            q.eq("projectId", projectId).eq("status", stateId).lt("isDeleted", true),
          )
          .first(),
      ),
    );

    // Check if any done issue is assigned to the current user
    return results.some((issue) => issue && issue.assigneeId === ctx.userId);
  },
});

/**
 * Update onboarding progress
 */
export const updateOnboardingStatus = authenticatedMutation({
  args: {
    onboardingCompleted: v.optional(v.boolean()),
    onboardingStep: v.optional(v.number()),
    sampleWorkspaceCreated: v.optional(v.boolean()),
    tourShown: v.optional(v.boolean()),
    wizardCompleted: v.optional(v.boolean()),
    checklistDismissed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
    } else {
      // Double-check for race condition - another request might have inserted while we were processing
      const doubleCheck = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .first();

      if (doubleCheck) {
        // Record was created by concurrent request, just patch it
        await ctx.db.patch(doubleCheck._id, {
          ...args,
          updatedAt: Date.now(),
        });
      } else {
        // Create initial onboarding record
        await ctx.db.insert("userOnboarding", {
          userId: ctx.userId,
          onboardingCompleted: args.onboardingCompleted ?? false,
          onboardingStep: args.onboardingStep ?? 0,
          sampleWorkspaceCreated: args.sampleWorkspaceCreated ?? false,
          tourShown: args.tourShown ?? false,
          wizardCompleted: args.wizardCompleted ?? false,
          checklistDismissed: args.checklistDismissed ?? false,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

/**
 * Create a sample project with demo data for new users
 */
export const createSampleProject = authenticatedMutation({
  args: {
    organizationId: v.optional(v.id("organizations")), // Optional: use existing organization
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    // Check if sample project already exists
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (onboarding?.sampleWorkspaceCreated) {
      throw conflict("Sample project already created");
    }

    // Get or find the user's organization
    let organizationId = args.organizationId;
    if (!organizationId) {
      // Try to find user's default organization or any organization they belong to
      const user = await ctx.db.get(ctx.userId);
      if (user?.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId;
      } else {
        // Find any organization the user belongs to
        const membership = await ctx.db
          .query("organizationMembers")
          .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
          .first();
        if (membership) {
          organizationId = membership.organizationId;
        }
      }
    }

    if (!organizationId) {
      throw validation(
        "organizationId",
        "No organization found. Please complete onboarding first.",
      );
    }

    // RBAC Check: Ensure user is a member of the organization
    const role = await getOrganizationRole(ctx, organizationId, ctx.userId);
    if (!role) {
      throw forbidden(
        undefined,
        "You must be a member of the organization to create a sample project",
      );
    }

    const now = Date.now();

    // Create sample workspace first
    const workspaceId = await ctx.db.insert("workspaces", {
      organizationId,
      name: "Sample Workspace",
      slug: `sample-workspace-${ctx.userId}`, // Make unique per user to avoid conflicts
      createdBy: ctx.userId,
      updatedAt: now,
    });

    const teamId = await ctx.db.insert("teams", {
      organizationId,
      workspaceId,
      name: "Engineering",
      slug: "engineering",
      createdBy: ctx.userId,
      updatedAt: now,
      isPrivate: false,
    });

    // Create sample project
    const projectId = await ctx.db.insert("projects", {
      name: "Sample Project",
      key: "SAMPLE",
      description:
        "Welcome to Nixelo! This is a sample project to help you get started. Feel free to explore, edit, or delete it.",
      organizationId,
      workspaceId,
      teamId,
      ownerId: ctx.userId,
      createdBy: ctx.userId,
      updatedAt: now,
      isPublic: false,
      boardType: "kanban",
      workflowStates: [
        { id: "todo", name: "To Do", category: "todo" as const, order: 0 },
        { id: "inprogress", name: "In Progress", category: "inprogress" as const, order: 1 },
        { id: "done", name: "Done", category: "done" as const, order: 2 },
      ],
    });

    // Add user as project admin
    await ctx.db.insert("projectMembers", {
      projectId,
      userId: ctx.userId,
      role: "admin",
      addedBy: ctx.userId,
    });

    // Create labels
    await ctx.db.insert("labels", {
      projectId,
      name: "urgent",
      color: "#EF4444", // Red
      createdBy: ctx.userId,
    });

    await ctx.db.insert("labels", {
      projectId,
      name: "needs-review",
      color: "#F59E0B", // Orange
      createdBy: ctx.userId,
    });

    // Create active sprint
    const sprintId = await ctx.db.insert("sprints", {
      projectId,
      name: "Sprint 1",
      goal: "Learn Nixelo basics and explore features",
      startDate: Date.now(),
      endDate: Date.now() + 2 * WEEK,
      status: "active",
      createdBy: ctx.userId,
      updatedAt: Date.now(),
    });

    // Create sample issues
    const issues: {
      title: string;
      description: string;
      type: "task" | "bug" | "story" | "epic";
      status: string;
      priority: "lowest" | "low" | "medium" | "high" | "highest";
      labels: string[];
      order: number;
    }[] = [
      // Bugs
      {
        title: "Fix login page styling on mobile",
        description:
          "The login button is cut off on mobile devices. Need to make it responsive.\n\n**Steps to reproduce:**\n1. Open login page on mobile\n2. Notice button is cut off\n\n**Expected:** Button should be fully visible",
        type: "bug",
        status: "todo",
        priority: "high",
        labels: ["urgent"],
        order: 0,
      },
      {
        title: "Dashboard loading spinner stuck",
        description: "Sometimes the loading spinner doesn't go away after data loads.",
        type: "bug",
        status: "inprogress",
        priority: "medium",
        labels: [],
        order: 0,
      },
      {
        title: "Export button not working in Firefox",
        description:
          "The CSV export button throws an error in Firefox browser. Works fine in Chrome.\n\n**Error:** `ReferenceError: AbortController is not defined`",
        type: "bug",
        status: "todo",
        priority: "low",
        labels: [],
        order: 1,
      },

      // Tasks
      {
        title: "Update documentation for new features",
        description:
          "We've added several new features that aren't documented yet:\n- Email notifications\n- Kanban undo/redo\n- File attachments\n\nNeed to update the user guide.",
        type: "task",
        status: "todo",
        priority: "medium",
        labels: ["needs-review"],
        order: 2,
      },
      {
        title: "Set up CI/CD pipeline",
        description:
          "Configure GitHub Actions to:\n- Run tests on every PR\n- Deploy to staging on merge to main\n- Deploy to production on release tags",
        type: "task",
        status: "inprogress",
        priority: "high",
        labels: [],
        order: 1,
      },
      {
        title: "Create demo video for landing page",
        description:
          "Record a 2-minute walkthrough showing key features:\n- Creating a project\n- Adding issues\n- Collaborating with team\n- Real-time updates",
        type: "task",
        status: "done",
        priority: "medium",
        labels: [],
        order: 0,
      },
      {
        title: "Design new logo and branding",
        description:
          "Current logo is placeholder. Need professional branding that reflects modern, collaborative nature of the product.",
        type: "task",
        status: "todo",
        priority: "low",
        labels: [],
        order: 3,
      },

      // Stories
      {
        title: "As a user, I want to filter issues by multiple labels",
        description:
          "**User Story:**\nAs a project manager, I want to filter issues by multiple labels at once, so that I can find specific combinations like 'urgent' AND 'frontend'.\n\n**Acceptance Criteria:**\n- [ ] User can select multiple labels in filter\n- [ ] Issues are filtered with AND logic (must have all selected labels)\n- [ ] Filter persists when navigating away and back\n- [ ] Clear all filters button works",
        type: "story",
        status: "todo",
        priority: "medium",
        labels: [],
        order: 4,
      },
      {
        title: "As a developer, I want to link commits to issues",
        description:
          "**User Story:**\nAs a developer, I want to link my git commits to issues, so that the team can see what code changes relate to each issue.\n\n**Acceptance Criteria:**\n- [ ] Support `Fixes #SAMPLE-123` syntax in commits\n- [ ] Show linked commits in issue detail\n- [ ] Auto-close issue when PR is merged\n- [ ] Integration with GitHub/GitLab",
        type: "story",
        status: "todo",
        priority: "high",
        labels: [],
        order: 5,
      },

      // Epic
      {
        title: "Mobile App Development",
        description:
          "Build native mobile apps for iOS and Android to make Nixelo accessible on the go.\n\n**Scope:**\n- React Native setup\n- Core features: view projects, issues, documents\n- Push notifications for mentions and assignments\n- Offline mode with sync\n- App store submission\n\n**Timeline:** 12 weeks",
        type: "epic",
        status: "todo",
        priority: "medium",
        labels: [],
        order: 6,
      },
    ];

    // Create all issues in parallel
    const issueNow = Date.now();
    const createdIssues = await Promise.all(
      issues.map((issue, index) =>
        ctx.db.insert("issues", {
          projectId,
          organizationId,
          workspaceId,
          teamId,
          key: `SAMPLE-${index + 1}`,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          priority: issue.priority,
          assigneeId: ctx.userId, // Assign first few to user
          reporterId: ctx.userId,
          updatedAt: issueNow,
          labels: issue.labels,
          sprintId: issue.type !== "epic" ? sprintId : undefined, // Don't add epic to sprint
          linkedDocuments: [],
          attachments: [],
          loggedHours: 0,
          order: issue.order,
          searchContent: getSearchContent(issue.title, issue.description),
        }),
      ),
    );

    // Add activity logs for all issues in parallel
    await Promise.all(
      createdIssues.map((issueId) =>
        ctx.db.insert("issueActivity", {
          issueId,
          userId: ctx.userId,
          action: "created",
        }),
      ),
    );

    // Add sample comments on a few issues
    const commentsData = [
      {
        issueIndex: 0, // First bug
        content:
          "I can reproduce this on iOS Safari. Looks like the flex container isn't wrapping properly. Will investigate the CSS.",
      },
      {
        issueIndex: 1, // Second bug
        content:
          "Found the issue - we're not handling the loading state correctly when the query returns null. Fix coming soon.",
      },
      {
        issueIndex: 4, // CI/CD task
        content:
          "GitHub Actions workflow is set up! Just need to add the deployment secrets and we're good to go. 🚀",
      },
      {
        issueIndex: 5, // Demo video task
        content:
          "Video is live! Check it out: https://youtube.com/... Got great feedback from the team. @you might want to review the script.",
        mentions: [ctx.userId],
      },
      {
        issueIndex: 7, // Filter story
        content:
          "This would be super helpful! Right now I have to filter twice which is annoying. +1 for this feature.",
      },
    ];

    // Add comments in parallel
    const commentNow = Date.now();
    await Promise.all(
      commentsData.map(({ issueIndex, content, mentions = [] }) =>
        ctx.db.insert("issueComments", {
          issueId: createdIssues[issueIndex],
          authorId: ctx.userId,
          content,
          mentions,
          updatedAt: commentNow,
        }),
      ),
    );

    // Update onboarding status
    await ctx.db.insert("userOnboarding", {
      userId: ctx.userId,
      onboardingCompleted: false,
      onboardingStep: 1,
      sampleWorkspaceCreated: true,
      tourShown: false,
      wizardCompleted: false,
      checklistDismissed: false,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

/**
 * Helper: Delete all issues and their related data for a project
 * Bounded to prevent OOM on large projects
 */
async function deleteProjectIssues(ctx: MutationCtx, projectId: Id<"projects">) {
  // Bounded: delete in batches to prevent OOM
  const issues = await safeCollect(
    ctx.db
      .query("issues")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter(notDeleted),
    BOUNDED_DELETE_BATCH,
    "delete project issues",
  );

  for (const issue of issues) {
    // Bounded: comments per issue
    const comments = await safeCollect(
      ctx.db.query("issueComments").withIndex("by_issue", (q) => q.eq("issueId", issue._id)),
      BOUNDED_RELATION_LIMIT,
      "delete issue comments",
    );
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Bounded: activities per issue
    const activities = await safeCollect(
      ctx.db.query("issueActivity").withIndex("by_issue", (q) => q.eq("issueId", issue._id)),
      BOUNDED_RELATION_LIMIT,
      "delete issue activities",
    );
    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    await ctx.db.delete(issue._id);
  }
}

/**
 * Helper: Delete sprints, labels, and members for a project
 * Bounded to prevent OOM
 */
async function deleteProjectMetadata(ctx: MutationCtx, projectId: Id<"projects">) {
  // Bounded: sprints per project (typically small)
  const sprints = await safeCollect(
    ctx.db
      .query("sprints")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter(notDeleted),
    BOUNDED_RELATION_LIMIT,
    "delete project sprints",
  );
  for (const sprint of sprints) {
    await ctx.db.delete(sprint._id);
  }

  // Bounded: labels per project (typically small)
  const labels = await safeCollect(
    ctx.db.query("labels").withIndex("by_project", (q) => q.eq("projectId", projectId)),
    BOUNDED_RELATION_LIMIT,
    "delete project labels",
  );
  for (const label of labels) {
    await ctx.db.delete(label._id);
  }

  // Bounded: members per project (typically small)
  const members = await safeCollect(
    ctx.db
      .query("projectMembers")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter(notDeleted),
    BOUNDED_RELATION_LIMIT,
    "delete project members",
  );
  for (const member of members) {
    await ctx.db.delete(member._id);
  }
}

/**
 * Reset onboarding for testing purposes
 * Deletes the userOnboarding record so user can start fresh
 * Only available for test accounts (@inbox.mailtrap.io)
 */
export const resetOnboarding = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    // Get user and verify test email
    const user = await ctx.db.get(ctx.userId);
    if (!(user && isTestEmail(user.email))) {
      throw forbidden(undefined, "Reset onboarding is only available for test accounts");
    }

    // Delete onboarding record
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (onboarding) {
      await ctx.db.delete(onboarding._id);
    }

    // Also delete sample project if it exists
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", "SAMPLE"))
      .filter((q) => q.eq(q.field("createdBy"), ctx.userId))
      .filter(notDeleted)
      .first();

    if (project) {
      await deleteProjectIssues(ctx, project._id);
      await deleteProjectMetadata(ctx, project._id);
      await ctx.db.delete(project._id);
    }

    return { success: true };
  },
});

/**
 * Delete sample project (for users who want to start fresh)
 */
export const deleteSampleProject = authenticatedMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // Find sample project
    const project = await ctx.db
      .query("projects")
      .withIndex("by_key", (q) => q.eq("key", "SAMPLE"))
      .filter((q) => q.eq(q.field("createdBy"), ctx.userId))
      .filter(notDeleted)
      .first();

    if (!project) {
      throw notFound("project");
    }

    // Delete all related data using helper functions (bounded)
    await deleteProjectIssues(ctx, project._id);
    await deleteProjectMetadata(ctx, project._id);

    // Delete project
    await ctx.db.delete(project._id);

    // Update onboarding status
    const onboarding = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (onboarding) {
      await ctx.db.patch(onboarding._id, {
        sampleWorkspaceCreated: false,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Check if current user was invited (for persona-based onboarding)
 * Returns invite info if user was invited, null otherwise
 */
export const checkInviteStatus = authenticatedQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      wasInvited: v.boolean(),
      inviterName: v.union(v.string(), v.null()),
      inviteRole: v.optional(inviteRoles),
      organizationId: v.optional(v.id("organizations")),
    }),
  ),
  handler: async (ctx) => {
    // Check if user has an inviteId (was invited)
    const user = await ctx.db.get(ctx.userId);
    if (!user?.inviteId) {
      return { wasInvited: false, inviterName: null };
    }

    // Get invite details
    const invite = await ctx.db.get(user.inviteId);
    if (!invite) {
      return { wasInvited: false, inviterName: null };
    }

    // Get inviter name
    const inviter = await ctx.db.get(invite.invitedBy);
    const inviterName = inviter?.name || inviter?.email || "Someone";

    return {
      wasInvited: true,
      inviterName,
      inviteRole: invite.role,
      organizationId: invite.organizationId,
    };
  },
});

/**
 * Set onboarding persona (team_lead or team_member)
 */
export const setOnboardingPersona = authenticatedMutation({
  args: {
    persona: personas,
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    // Check invite status to populate wasInvited field
    const user = await ctx.db.get(ctx.userId);
    let wasInvited = false;
    let invitedByName: string | undefined;

    if (user?.inviteId) {
      const invite = await ctx.db.get(user.inviteId);
      if (invite) {
        wasInvited = true;
        const inviter = await ctx.db.get(invite.invitedBy);
        invitedByName = inviter?.name || inviter?.email || "Someone";
      }
    }

    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .filter(notDeleted)
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingPersona: args.persona,
        wasInvited,
        invitedByName,
        updatedAt: Date.now(),
      });
    } else {
      // Double-check for race condition - another request might have inserted while we were processing
      const doubleCheck = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .filter(notDeleted)
        .first();

      if (doubleCheck) {
        // Record was created by concurrent request, just patch it
        await ctx.db.patch(doubleCheck._id, {
          onboardingPersona: args.persona,
          wasInvited,
          invitedByName,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("userOnboarding", {
          userId: ctx.userId,
          onboardingCompleted: false,
          onboardingStep: 1,
          sampleWorkspaceCreated: false,
          tourShown: false,
          wizardCompleted: false,
          checklistDismissed: false,
          onboardingPersona: args.persona,
          wasInvited,
          invitedByName,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

/**
 * Complete onboarding flow
 */
export const completeOnboardingFlow = authenticatedMutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("userOnboarding")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingCompleted: true,
        tourShown: true,
        updatedAt: Date.now(),
      });
    } else {
      // Double-check for race condition - another request might have inserted while we were processing
      const doubleCheck = await ctx.db
        .query("userOnboarding")
        .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
        .first();

      if (doubleCheck) {
        // Record was created by concurrent request, just patch it
        await ctx.db.patch(doubleCheck._id, {
          onboardingCompleted: true,
          tourShown: true,
          updatedAt: Date.now(),
        });
      } else {
        // Create record if it doesn't exist
        await ctx.db.insert("userOnboarding", {
          userId: ctx.userId,
          onboardingCompleted: true,
          onboardingStep: 99,
          sampleWorkspaceCreated: false,
          tourShown: true,
          wizardCompleted: false,
          checklistDismissed: false,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

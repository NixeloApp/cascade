import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { issueActivityFields, issuesFields, projectsFields } from "./schemaFields";
import {
  auditMetadata,
  automationActionTypes,
  automationActionValue,
  automationTriggers,
  blockNoteContent,
  boardTypes,
  bookerAnswers,
  bookingFieldTypes,
  botJobStatuses,
  calendarEventColors,
  calendarProviders,
  calendarStatuses,
  cancelledByOptions,
  chatRoles,
  ciStatuses,
  dashboardLayout,
  emailDigests,
  employmentTypes,
  inboxIssueSources,
  inboxIssueStatuses,
  inviteRoles,
  issuePriorities,
  issueTypes,
  linkTypes,
  meetingPlatforms,
  meetingStatuses,
  periodTypes,
  personas,
  projectRoles,
  proseMirrorSnapshot,
  prStates,
  simplePriorities,
  sprintStatuses,
  webhookStatuses,
  workflowCategories,
} from "./validators";

// =============================================================================
// APPLICATION TABLES
// Organized by domain/feature area for easier navigation
// =============================================================================

const applicationTables = {
  // ===========================================================================
  // ORGANIZATIONS & ACCESS CONTROL
  // Multi-tenant support, membership, invites, SSO
  // ===========================================================================

  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly: "acme-corp"
    timezone: v.string(), // IANA timezone: "America/New_York"
    settings: v.object({
      defaultMaxHoursPerWeek: v.number(),
      defaultMaxHoursPerDay: v.number(),
      requiresTimeApproval: v.boolean(),
      billingEnabled: v.boolean(),
    }),
    // IP Restrictions (Nixelo advantage - Cal.com/Plane don't have org-level IP restrictions!)
    ipRestrictionsEnabled: v.optional(v.boolean()),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["createdBy"])
    .searchIndex("search_name", {
      searchField: "name",
    }),

  // Organization IP allowlist (Nixelo advantage - enterprise security feature)
  organizationIpAllowlist: defineTable({
    organizationId: v.id("organizations"),
    ipRange: v.string(), // CIDR notation: "192.168.1.0/24" or single IP: "203.0.113.50"
    description: v.optional(v.string()), // "Office network", "VPN exit", etc.
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_ip", ["organizationId", "ipRange"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"), // Full control, can't be removed
      v.literal("admin"), // Manage members, settings, billing
      v.literal("member"), // Use organization resources
    ),
    addedBy: v.id("users"),
    joinedAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_organization_user", ["organizationId", "userId"])
    .index("by_role", ["role"])
    .index("by_user_role", ["userId", "role"])
    .index("by_organization_role", ["organizationId", "role"]),

  ssoConnections: defineTable({
    organizationId: v.id("organizations"),
    type: v.union(v.literal("saml"), v.literal("oidc")),
    name: v.string(), // "Okta", "Azure AD", "Google Workspace"
    isEnabled: v.boolean(),
    samlConfig: v.optional(
      v.object({
        idpMetadataUrl: v.optional(v.string()),
        idpMetadataXml: v.optional(v.string()),
        idpEntityId: v.optional(v.string()),
        idpSsoUrl: v.optional(v.string()),
        idpCertificate: v.optional(v.string()),
        spEntityId: v.optional(v.string()),
        spAcsUrl: v.optional(v.string()),
        nameIdFormat: v.optional(v.string()),
        signRequest: v.optional(v.boolean()),
      }),
    ),
    oidcConfig: v.optional(
      v.object({
        issuer: v.optional(v.string()),
        clientId: v.optional(v.string()),
        clientSecret: v.optional(v.string()),
        scopes: v.optional(v.array(v.string())),
        authorizationUrl: v.optional(v.string()),
        tokenUrl: v.optional(v.string()),
        userInfoUrl: v.optional(v.string()),
      }),
    ),
    verifiedDomains: v.optional(v.array(v.string())), // ["acme.com", "acme.io"]
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_enabled", ["organizationId", "isEnabled"])
    .index("by_type", ["type"]),

  ssoDomains: defineTable({
    domain: v.string(), // "acme.com"
    connectionId: v.id("ssoConnections"),
    organizationId: v.id("organizations"),
  })
    .index("by_domain", ["domain"])
    .index("by_connection", ["connectionId"])
    .index("by_organization", ["organizationId"]),

  invites: defineTable({
    email: v.string(),
    role: inviteRoles, // Platform role
    organizationId: v.id("organizations"),
    projectId: v.optional(v.id("projects")),
    projectRole: v.optional(projectRoles),
    invitedBy: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked"),
      v.literal("expired"),
    ),
    acceptedBy: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
    revokedBy: v.optional(v.id("users")),
    revokedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_token", ["token"])
    .index("by_status", ["status"])
    .index("by_invited_by", ["invitedBy"])
    .index("by_email_status", ["email", "status"])
    .index("by_organization", ["organizationId"])
    .index("by_project", ["projectId"])
    .index("by_organization_status", ["organizationId", "status"]),

  // ===========================================================================
  // WORKSPACES & TEAMS
  // Department-level groupings and cross-functional teams
  // ===========================================================================

  workspaces: defineTable({
    name: v.string(), // "Engineering", "Marketing", "Product"
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()), // Emoji like 🏗️
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    settings: v.optional(
      v.object({
        defaultProjectVisibility: v.optional(v.boolean()),
        allowExternalSharing: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_slug", ["organizationId", "slug"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["organizationId"],
    }),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"), // Manage workspace settings and members
      v.literal("editor"), // Create/edit workspace-level content
      v.literal("member"), // View workspace resources
    ),
    addedBy: v.id("users"),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"])
    .index("by_role", ["role"])
    .index("by_workspace_role", ["workspaceId", "role"])
    .index("by_deleted", ["isDeleted"]),

  teams: defineTable({
    organizationId: v.id("organizations"),
    workspaceId: v.id("workspaces"),
    name: v.string(), // "Product Team", "Dev Team"
    slug: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    isPrivate: v.boolean(),
    settings: v.optional(
      v.object({
        defaultIssueType: v.optional(v.string()),
        cycleLength: v.optional(v.number()),
        cycleDayOfWeek: v.optional(v.number()),
        defaultEstimate: v.optional(v.number()),
      }),
    ),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_slug", ["workspaceId", "slug"])
    .index("by_organization_slug", ["organizationId", "slug"])
    .index("by_creator", ["createdBy"])
    .index("by_lead", ["leadId"])
    .index("by_deleted", ["isDeleted"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["organizationId", "workspaceId"],
    }),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"), // Manage team members and settings
      v.literal("member"),
    ),
    addedBy: v.id("users"),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"])
    .index("by_role", ["role"])
    .index("by_deleted", ["isDeleted"]),

  // ===========================================================================
  // DOCUMENTS
  // Real-time collaborative documents, templates, Y.js state
  // ===========================================================================

  documents: defineTable({
    title: v.string(),
    isPublic: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    // Hierarchy - every doc belongs to an org, optionally scoped to workspace/project
    organizationId: v.id("organizations"),
    workspaceId: v.optional(v.id("workspaces")),
    projectId: v.optional(v.id("projects")),
    // Nested pages - parent document and sibling order
    parentId: v.optional(v.id("documents")),
    order: v.optional(v.number()),
    // Soft Delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_creator", ["createdBy"])
    .index("by_public", ["isPublic"])
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_creator_public_updated", ["createdBy", "isPublic", "updatedAt"])
    .index("by_deleted", ["isDeleted"])
    .index("by_organization_deleted", ["organizationId", "isDeleted"])
    .index("by_organization_public", ["organizationId", "isPublic", "updatedAt"])
    .index("by_parent", ["parentId"])
    .index("by_organization_parent", ["organizationId", "parentId", "isDeleted"])
    .index("by_org_creator_public_updated", [
      "organizationId",
      "createdBy",
      "isPublic",
      "updatedAt",
    ])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["isPublic", "createdBy", "organizationId", "workspaceId", "projectId"],
    }),

  documentVersions: defineTable({
    documentId: v.id("documents"),
    version: v.number(),
    snapshot: proseMirrorSnapshot,
    title: v.string(),
    createdBy: v.id("users"),
    changeDescription: v.optional(v.string()),
  })
    .index("by_document", ["documentId"])
    .index("by_document_version", ["documentId", "version"]),

  yjsDocuments: defineTable({
    documentId: v.id("documents"),
    stateVector: v.string(), // Base64 encoded Y.js state vector
    updates: v.array(v.string()), // Batched base64 Y.js updates
    version: v.number(),
    lastModifiedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_version", ["documentId", "version"]),

  yjsAwareness: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    clientId: v.number(),
    awarenessData: v.string(), // JSON string of awareness state
    lastSeenAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_document_user", ["documentId", "userId"])
    .index("by_last_seen", ["lastSeenAt"]),

  documentTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(), // "meeting", "planning", "design", "engineering"
    icon: v.string(),
    content: blockNoteContent,
    isBuiltIn: v.boolean(),
    isPublic: v.boolean(),
    createdBy: v.optional(v.id("users")),
    projectId: v.optional(v.id("projects")),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_built_in", ["isBuiltIn"])
    .index("by_public", ["isPublic"])
    .index("by_creator", ["createdBy"])
    .index("by_project", ["projectId"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category", "isPublic", "isBuiltIn"],
    }),

  // ===========================================================================
  // PROJECTS
  // Project management, membership, templates
  // ===========================================================================

  projects: defineTable(projectsFields)
    .index("by_creator", ["createdBy"])
    .index("by_key", ["key"])
    .index("by_public", ["isPublic"])
    .index("by_organization", ["organizationId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_owner", ["ownerId"])
    .index("by_organization_public", ["organizationId", "isPublic"])
    .index("by_deleted", ["isDeleted"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["isPublic", "createdBy", "organizationId", "workspaceId"],
    }),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: projectRoles,
    addedBy: v.id("users"),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_role", ["role"])
    .index("by_deleted", ["isDeleted"]),

  projectTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(), // "software", "marketing", "design"
    icon: v.string(),
    boardType: boardTypes,
    workflowStates: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        category: workflowCategories,
        order: v.number(),
        // WIP limit: max issues allowed in this column (0 = no limit)
        wipLimit: v.optional(v.number()),
      }),
    ),
    defaultLabels: v.array(
      v.object({
        name: v.string(),
        color: v.string(),
      }),
    ),
    isBuiltIn: v.boolean(),
    createdBy: v.optional(v.id("users")),
  })
    .index("by_category", ["category"])
    .index("by_built_in", ["isBuiltIn"]),

  // ===========================================================================
  // ISSUES & SPRINTS
  // Issue tracking, comments, links, activity, sprints, labels
  // ===========================================================================

  issues: defineTable(issuesFields)
    .index("by_project", ["projectId"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_deleted", ["organizationId", "isDeleted"])
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_team_deleted", ["teamId", "isDeleted"])
    .index("by_key", ["key"])
    .index("by_assignee", ["assigneeId"])
    .index("by_assignee_status", ["assigneeId", "status"])
    .index("by_assignee_deleted", ["assigneeId", "isDeleted"])
    .index("by_reporter", ["reporterId"])
    .index("by_reporter_deleted", ["reporterId", "isDeleted"])
    .index("by_status", ["status"])
    .index("by_sprint", ["sprintId"])
    .index("by_epic", ["epicId"])
    .index("by_parent", ["parentId"])
    .index("by_project_status", ["projectId", "status", "order"])
    .index("by_project_status_updated", ["projectId", "status", "updatedAt"])
    .index("by_project_sprint_status", ["projectId", "sprintId", "status", "order"])
    .index("by_project_sprint_status_updated", ["projectId", "sprintId", "status", "updatedAt"])
    .index("by_project_updated", ["projectId", "updatedAt"])
    .index("by_project_due_date", ["projectId", "dueDate"])
    .index("by_project_type_due_date", ["projectId", "type", "dueDate"])
    .index("by_organization_status", ["organizationId", "status"])
    .index("by_workspace_status", ["workspaceId", "status"])
    .index("by_team_status", ["teamId", "status", "order"])
    .index("by_team_status_updated", ["teamId", "status", "updatedAt"])
    .index("by_deleted", ["isDeleted"])
    .index("by_project_deleted", ["projectId", "isDeleted"])
    .index("by_project_assignee", ["projectId", "assigneeId"])
    .index("by_project_assignee_status", ["projectId", "assigneeId", "status"])
    .index("by_project_reporter", ["projectId", "reporterId"])
    .searchIndex("search_title", {
      searchField: "searchContent",
      filterFields: [
        "projectId",
        "organizationId",
        "workspaceId",
        "teamId",
        "type",
        "status",
        "priority",
        "assigneeId",
        "reporterId",
        "sprintId",
        "epicId",
        "labels",
      ],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 512,
      filterFields: ["projectId", "workspaceId", "teamId"],
    })
    .index("by_project_type", ["projectId", "type"]),

  issueComments: defineTable({
    issueId: v.id("issues"),
    authorId: v.id("users"),
    content: v.string(),
    mentions: v.array(v.id("users")),
    updatedAt: v.number(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_issue", ["issueId"])
    .index("by_author", ["authorId"])
    .index("by_deleted", ["isDeleted"]),

  issueCommentReactions: defineTable({
    commentId: v.id("issueComments"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_user_emoji", ["commentId", "userId", "emoji"]),

  // Document comments (Nixelo advantage - Plane has no page comments!)
  documentComments: defineTable({
    documentId: v.id("documents"),
    authorId: v.id("users"),
    content: v.string(),
    mentions: v.array(v.id("users")),
    updatedAt: v.number(),
    // Thread support - comments can be replies
    parentId: v.optional(v.id("documentComments")),
    // Soft delete
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_document", ["documentId"])
    .index("by_author", ["authorId"])
    .index("by_parent", ["parentId"])
    .index("by_deleted", ["isDeleted"]),

  documentCommentReactions: defineTable({
    commentId: v.id("documentComments"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_comment", ["commentId"])
    .index("by_comment_user_emoji", ["commentId", "userId", "emoji"]),

  issueLinks: defineTable({
    fromIssueId: v.id("issues"),
    toIssueId: v.id("issues"),
    linkType: linkTypes,
    createdBy: v.id("users"),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_from_issue", ["fromIssueId"])
    .index("by_to_issue", ["toIssueId"])
    .index("by_deleted", ["isDeleted"]),

  issueActivity: defineTable(issueActivityFields)
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_deleted", ["isDeleted"]),

  issueWatchers: defineTable({
    issueId: v.id("issues"),
    userId: v.id("users"),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_issue", ["issueId"])
    .index("by_user", ["userId"])
    .index("by_issue_user", ["issueId", "userId"])
    .index("by_deleted", ["isDeleted"]),

  sprints: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: sprintStatuses,
    createdBy: v.id("users"),
    updatedAt: v.number(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_deleted", ["isDeleted"]),

  labelGroups: defineTable({
    projectId: v.id("projects"),
    name: v.string(), // "Priority", "Component", "Area"
    description: v.optional(v.string()),
    displayOrder: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_name", ["projectId", "name"])
    .index("by_project_order", ["projectId", "displayOrder"]),

  labels: defineTable({
    projectId: v.id("projects"),
    groupId: v.optional(v.id("labelGroups")),
    name: v.string(),
    color: v.string(), // Hex: "#3B82F6"
    displayOrder: v.optional(v.number()),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_name", ["projectId", "name"])
    .index("by_group", ["groupId"]),

  issueTemplates: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    type: issueTypes,
    titleTemplate: v.string(),
    descriptionTemplate: v.string(),
    defaultPriority: issuePriorities,
    defaultLabels: v.array(v.string()),
    // New fields for Plane parity
    defaultAssigneeId: v.optional(v.id("users")), // Pre-assign to specific user
    defaultStatus: v.optional(v.string()), // Pre-select workflow state
    defaultStoryPoints: v.optional(v.number()), // Pre-fill story points
    isDefault: v.optional(v.boolean()), // Mark as project's default template
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_type", ["projectId", "type"])
    .index("by_project_default", ["projectId", "isDefault"]),

  // ===========================================================================
  // INBOX / TRIAGE
  // Issues that need to be triaged before entering the backlog
  // ===========================================================================

  inboxIssues: defineTable({
    projectId: v.id("projects"),
    issueId: v.id("issues"),
    status: inboxIssueStatuses, // pending, accepted, declined, snoozed, duplicate
    source: inboxIssueSources, // in_app, form, email, api
    sourceEmail: v.optional(v.string()), // For email-sourced issues
    snoozedUntil: v.optional(v.number()), // Timestamp for snoozed issues
    duplicateOfId: v.optional(v.id("issues")), // For duplicate marking
    declineReason: v.optional(v.string()), // Reason for declining
    triageNotes: v.optional(v.string()), // Internal notes during triage
    triagedBy: v.optional(v.id("users")), // Who accepted/declined/etc.
    triagedAt: v.optional(v.number()), // When the action was taken
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_project_status", ["projectId", "status"])
    .index("by_status", ["status"])
    .index("by_snoozed_until", ["snoozedUntil"])
    .index("by_source", ["source"])
    .index("by_created_by", ["createdBy"]),

  savedFilters: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    name: v.string(),
    filters: v.object({
      type: v.optional(v.array(issueTypes)),
      status: v.optional(v.array(v.string())),
      priority: v.optional(
        v.array(
          v.union(
            v.literal("lowest"),
            v.literal("low"),
            v.literal("medium"),
            v.literal("high"),
            v.literal("highest"),
          ),
        ),
      ),
      assigneeId: v.optional(v.array(v.id("users"))),
      labels: v.optional(v.array(v.string())),
      sprintId: v.optional(v.id("sprints")),
      epicId: v.optional(v.id("issues")),
    }),
    isPublic: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_public", ["projectId", "isPublic"]),

  customFields: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    fieldKey: v.string(), // "customer_id"
    fieldType: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("date"),
      v.literal("checkbox"),
      v.literal("url"),
      v.literal("user"),
    ),
    options: v.optional(v.array(v.string())), // For select/multiselect
    isRequired: v.boolean(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  })
    .index("by_project", ["projectId"])
    .index("by_project_key", ["projectId", "fieldKey"]),

  customFieldValues: defineTable({
    issueId: v.id("issues"),
    fieldId: v.id("customFields"),
    value: v.string(),
    updatedAt: v.number(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_issue", ["issueId"])
    .index("by_field", ["fieldId"])
    .index("by_issue_field", ["issueId", "fieldId"])
    .index("by_deleted", ["isDeleted"]),

  // ===========================================================================
  // AUTOMATION & WEBHOOKS
  // Workflow automation rules, webhook delivery
  // ===========================================================================

  automationRules: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    trigger: automationTriggers,
    triggerValue: v.optional(v.string()), // Condition value (e.g., specific status name)
    actionType: automationActionTypes,
    // NOTE: Changed from v.string() (JSON) to typed discriminated union.
    // Existing rules with JSON strings will fail validation - run migration if needed.
    actionValue: automationActionValue,
    createdBy: v.id("users"),
    updatedAt: v.number(),
    executionCount: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_project_active", ["projectId", "isActive"]),

  webhooks: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    url: v.string(),
    events: v.array(v.string()), // ["issue.created", "issue.updated"]
    secret: v.optional(v.string()), // HMAC signature
    isActive: v.boolean(),
    createdBy: v.id("users"),
    lastTriggered: v.optional(v.number()),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_deleted", ["isDeleted"]),

  webhookExecutions: defineTable({
    webhookId: v.id("webhooks"),
    event: v.string(),
    status: webhookStatuses,
    requestPayload: v.string(),
    responseStatus: v.optional(v.number()),
    responseBody: v.optional(v.string()),
    error: v.optional(v.string()),
    attempts: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_webhook", ["webhookId"])
    .index("by_status", ["status"]),

  // ===========================================================================
  // NOTIFICATIONS
  // In-app notifications, email preferences, unsubscribe tokens
  // ===========================================================================

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "mention", "assigned", "comment", "status_change"
    title: v.string(),
    message: v.string(),
    issueId: v.optional(v.id("issues")),
    projectId: v.optional(v.id("projects")),
    documentId: v.optional(v.id("documents")),
    actorId: v.optional(v.id("users")),
    isRead: v.boolean(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "isRead", "isDeleted"])
    .index("by_user_active", ["userId", "isDeleted"])
    .index("by_deleted", ["isDeleted"]),

  notificationPreferences: defineTable({
    userId: v.id("users"),
    emailEnabled: v.boolean(),
    emailMentions: v.boolean(),
    emailAssignments: v.boolean(),
    emailComments: v.boolean(),
    emailStatusChanges: v.boolean(),
    emailDigest: emailDigests,
    digestDay: v.optional(v.string()), // "monday", etc.
    digestTime: v.optional(v.string()), // "09:00"
    // Push notification preferences (Cal.com parity)
    pushEnabled: v.optional(v.boolean()), // Master toggle for push notifications
    pushMentions: v.optional(v.boolean()),
    pushAssignments: v.optional(v.boolean()),
    pushComments: v.optional(v.boolean()),
    pushStatusChanges: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_digest_frequency", ["emailEnabled", "emailDigest"]),

  unsubscribeTokens: defineTable({
    userId: v.id("users"),
    token: v.string(),
    usedAt: v.optional(v.number()),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // Push notification subscriptions (Web Push API - Cal.com parity)
  pushSubscriptions: defineTable({
    userId: v.id("users"),
    // PushSubscription JSON contains: endpoint, expirationTime, keys.p256dh, keys.auth
    endpoint: v.string(), // Push service endpoint URL
    p256dh: v.string(), // ECDH public key for encryption
    auth: v.string(), // Auth secret for HMAC
    expirationTime: v.optional(v.number()), // Optional expiration
    userAgent: v.optional(v.string()), // Browser/device info
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),

  // ===========================================================================
  // CALENDAR & SCHEDULING
  // Events, attendance, availability, booking pages
  // ===========================================================================

  calendarEvents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    allDay: v.boolean(),
    location: v.optional(v.string()),
    eventType: v.union(
      v.literal("meeting"),
      v.literal("deadline"),
      v.literal("timeblock"),
      v.literal("personal"),
    ),
    organizerId: v.id("users"),
    attendeeIds: v.array(v.id("users")),
    externalAttendees: v.optional(v.array(v.string())),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    status: calendarStatuses,
    isRecurring: v.boolean(),
    recurrenceRule: v.optional(v.string()), // RRULE format
    meetingUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    color: v.optional(calendarEventColors),
    updatedAt: v.number(),
  })
    .index("by_organizer", ["organizerId", "startTime"])
    .index("by_attendee_start", ["attendeeIds", "startTime"])
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_required", ["isRequired"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["organizerId", "projectId", "status"],
    }),

  meetingAttendance: defineTable({
    eventId: v.id("calendarEvents"),
    userId: v.id("users"),
    status: v.union(v.literal("present"), v.literal("tardy"), v.literal("absent")),
    markedBy: v.id("users"),
    markedAt: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_event_user", ["eventId", "userId"]),

  // Event reminders - scheduled notifications before calendar events
  eventReminders: defineTable({
    eventId: v.id("calendarEvents"),
    userId: v.id("users"), // User to remind
    reminderType: v.union(v.literal("email"), v.literal("push"), v.literal("in_app")),
    minutesBefore: v.number(), // e.g., 15, 30, 60, 1440 (1 day)
    scheduledFor: v.number(), // Computed: event.startTime - minutesBefore * 60 * 1000
    sent: v.boolean(), // Has reminder been sent?
    sentAt: v.optional(v.number()), // When reminder was sent
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_scheduled_unsent", ["sent", "scheduledFor"]) // For cron job
    .index("by_event_user_type", ["eventId", "userId", "reminderType"]),

  availabilitySlots: defineTable({
    userId: v.id("users"),
    dayOfWeek: v.union(
      v.literal("monday"),
      v.literal("tuesday"),
      v.literal("wednesday"),
      v.literal("thursday"),
      v.literal("friday"),
      v.literal("saturday"),
      v.literal("sunday"),
    ),
    startTime: v.string(), // "09:00"
    endTime: v.string(), // "17:00"
    isActive: v.boolean(),
    timezone: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "dayOfWeek"])
    .index("by_active", ["isActive"]),

  bookingPages: defineTable({
    userId: v.id("users"),
    slug: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    duration: v.number(), // Minutes
    bufferTimeBefore: v.number(),
    bufferTimeAfter: v.number(),
    minimumNotice: v.number(), // Hours
    maxBookingsPerDay: v.optional(v.number()),
    location: v.union(
      v.literal("phone"),
      v.literal("zoom"),
      v.literal("meet"),
      v.literal("teams"),
      v.literal("in-person"),
      v.literal("custom"),
    ),
    locationDetails: v.optional(v.string()),
    questions: v.optional(
      v.array(
        v.object({
          label: v.string(),
          type: bookingFieldTypes,
          required: v.boolean(),
        }),
      ),
    ),
    isActive: v.boolean(),
    requiresConfirmation: v.boolean(),
    color: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  bookings: defineTable({
    bookingPageId: v.id("bookingPages"),
    hostId: v.id("users"),
    bookerName: v.string(),
    bookerEmail: v.string(),
    bookerPhone: v.optional(v.string()),
    // NOTE: Changed from v.string() (JSON) to typed validator.
    // Existing records with JSON strings will fail validation - run migration if needed.
    bookerAnswers: v.optional(bookerAnswers),
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
    location: v.string(),
    locationDetails: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
    ),
    cancelledBy: v.optional(cancelledByOptions),
    cancellationReason: v.optional(v.string()),
    calendarEventId: v.optional(v.id("calendarEvents")),
    reminderSent: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_booking_page", ["bookingPageId"])
    .index("by_host", ["hostId"])
    .index("by_email", ["bookerEmail"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"])
    .index("by_host_status", ["hostId", "status"]),

  calendarConnections: defineTable({
    userId: v.id("users"),
    provider: calendarProviders,
    providerAccountId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    syncEnabled: v.boolean(),
    syncDirection: v.union(v.literal("import"), v.literal("export"), v.literal("bidirectional")),
    lastSyncAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_provider", ["provider"])
    .index("by_user_provider", ["userId", "provider"])
    .index("by_expires_at", ["expiresAt"]),

  // ===========================================================================
  // INTEGRATIONS: GITHUB
  // Repository connections, pull requests, commits
  // ===========================================================================

  githubConnections: defineTable({
    userId: v.id("users"),
    githubUserId: v.string(),
    githubUsername: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_user", ["githubUserId"]),

  githubRepositories: defineTable({
    projectId: v.id("projects"),
    repoOwner: v.string(),
    repoName: v.string(),
    repoFullName: v.string(), // "owner/repo"
    repoId: v.string(),
    syncPRs: v.boolean(),
    syncIssues: v.boolean(),
    autoLinkCommits: v.boolean(),
    linkedBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_repo_id", ["repoId"])
    .index("by_repo_full_name", ["repoFullName"]),

  githubPullRequests: defineTable({
    issueId: v.optional(v.id("issues")),
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    prNumber: v.number(),
    prId: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    state: prStates,
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    checksStatus: v.optional(ciStatuses),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_pr_id", ["prId"])
    .index("by_repository_pr_number", ["repositoryId", "prNumber"]),

  githubCommits: defineTable({
    issueId: v.optional(v.id("issues")),
    projectId: v.id("projects"),
    repositoryId: v.id("githubRepositories"),
    sha: v.string(),
    message: v.string(),
    authorUsername: v.string(),
    authorAvatarUrl: v.optional(v.string()),
    htmlUrl: v.string(),
    committedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_project", ["projectId"])
    .index("by_repository", ["repositoryId"])
    .index("by_sha", ["sha"]),

  // ===========================================================================
  // INTEGRATIONS: PUMBLE (Team Chat)
  // ===========================================================================

  pumbleWebhooks: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    name: v.string(),
    webhookUrl: v.string(),
    events: v.array(v.string()),
    isActive: v.boolean(),
    sendMentions: v.boolean(),
    sendAssignments: v.boolean(),
    sendStatusChanges: v.boolean(),
    messagesSent: v.number(),
    lastMessageAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_active", ["isActive"])
    .index("by_user_active", ["userId", "isActive"]),

  // ===========================================================================
  // AI FEATURES
  // Chat, suggestions, usage tracking
  // ===========================================================================

  aiChats: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    title: v.string(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  aiMessages: defineTable({
    chatId: v.id("aiChats"),
    role: chatRoles,
    content: v.string(),
    contextData: v.optional(
      v.object({
        issueIds: v.optional(v.array(v.id("issues"))),
        documentIds: v.optional(v.array(v.id("documents"))),
        sprintIds: v.optional(v.array(v.id("sprints"))),
      }),
    ),
    modelUsed: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    responseTime: v.optional(v.number()),
  }).index("by_chat", ["chatId"]),

  aiSuggestions: defineTable({
    userId: v.id("users"),
    projectId: v.id("projects"),
    suggestionType: v.union(
      v.literal("issue_description"),
      v.literal("issue_priority"),
      v.literal("issue_labels"),
      v.literal("issue_assignee"),
      v.literal("sprint_planning"),
      v.literal("risk_detection"),
      v.literal("insight"),
    ),
    targetId: v.optional(v.string()),
    suggestion: v.string(),
    reasoning: v.optional(v.string()),
    accepted: v.optional(v.boolean()),
    dismissed: v.optional(v.boolean()),
    modelUsed: v.string(),
    confidence: v.optional(v.number()),
    respondedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_type", ["suggestionType"])
    .index("by_project_type", ["projectId", "suggestionType"])
    .index("by_target", ["targetId"]),

  aiUsage: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    provider: v.literal("anthropic"),
    model: v.string(),
    operation: v.union(
      v.literal("chat"),
      v.literal("suggestion"),
      v.literal("automation"),
      v.literal("analysis"),
    ),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    estimatedCost: v.optional(v.number()), // USD cents
    responseTime: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_provider", ["provider"])
    .index("by_operation", ["operation"]),

  // ===========================================================================
  // MEETING BOT / AI NOTETAKER
  // Recordings, transcripts, summaries, participants
  // ===========================================================================

  meetingRecordings: defineTable({
    calendarEventId: v.optional(v.id("calendarEvents")),
    meetingUrl: v.optional(v.string()),
    meetingPlatform: meetingPlatforms,
    title: v.string(),
    recordingFileId: v.optional(v.id("_storage")),
    recordingUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    fileSize: v.optional(v.number()),
    status: meetingStatuses,
    errorMessage: v.optional(v.string()),
    scheduledStartTime: v.optional(v.number()),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    botName: v.string(),
    botJoinedAt: v.optional(v.number()),
    botLeftAt: v.optional(v.number()),
    createdBy: v.id("users"),
    projectId: v.optional(v.id("projects")),
    isPublic: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_calendar_event", ["calendarEventId"])
    .index("by_creator", ["createdBy"])
    .index("by_project", ["projectId"])
    .index("by_project_public", ["projectId", "isPublic"])
    .index("by_project_creator", ["projectId", "createdBy"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledStartTime"])
    .index("by_platform", ["meetingPlatform"]),

  meetingTranscripts: defineTable({
    recordingId: v.id("meetingRecordings"),
    fullText: v.string(),
    segments: v.array(
      v.object({
        startTime: v.number(),
        endTime: v.number(),
        speaker: v.optional(v.string()),
        speakerUserId: v.optional(v.id("users")),
        text: v.string(),
        confidence: v.optional(v.number()),
      }),
    ),
    language: v.string(),
    modelUsed: v.string(),
    processingTime: v.optional(v.number()),
    wordCount: v.number(),
    speakerCount: v.optional(v.number()),
  })
    .index("by_recording", ["recordingId"])
    .searchIndex("search_transcript", {
      searchField: "fullText",
    }),

  meetingSummaries: defineTable({
    recordingId: v.id("meetingRecordings"),
    transcriptId: v.id("meetingTranscripts"),
    executiveSummary: v.string(),
    keyPoints: v.array(v.string()),
    actionItems: v.array(
      v.object({
        description: v.string(),
        assignee: v.optional(v.string()),
        assigneeUserId: v.optional(v.id("users")),
        dueDate: v.optional(v.string()),
        priority: v.optional(simplePriorities),
        issueCreated: v.optional(v.id("issues")),
      }),
    ),
    decisions: v.array(v.string()),
    openQuestions: v.array(v.string()),
    topics: v.array(
      v.object({
        title: v.string(),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
        summary: v.string(),
      }),
    ),
    overallSentiment: v.optional(
      v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative"),
        v.literal("mixed"),
      ),
    ),
    modelUsed: v.string(),
    promptTokens: v.optional(v.number()),
    completionTokens: v.optional(v.number()),
    processingTime: v.optional(v.number()),
    regeneratedAt: v.optional(v.number()),
  })
    .index("by_recording", ["recordingId"])
    .index("by_transcript", ["transcriptId"]),

  meetingParticipants: defineTable({
    recordingId: v.id("meetingRecordings"),
    displayName: v.string(),
    email: v.optional(v.string()),
    userId: v.optional(v.id("users")),
    joinedAt: v.optional(v.number()),
    leftAt: v.optional(v.number()),
    speakingTime: v.optional(v.number()),
    speakingPercentage: v.optional(v.number()),
    isHost: v.boolean(),
    isExternal: v.boolean(),
  })
    .index("by_recording", ["recordingId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"]),

  meetingBotJobs: defineTable({
    recordingId: v.id("meetingRecordings"),
    meetingUrl: v.string(),
    scheduledTime: v.number(),
    status: botJobStatuses,
    attempts: v.number(),
    maxAttempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    botServiceJobId: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_recording", ["recordingId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledTime"])
    .index("by_next_attempt", ["nextAttemptAt"])
    .index("by_status_scheduled", ["status", "scheduledTime"]),

  // ===========================================================================
  // TIME TRACKING
  // Time entries, rates, profiles, compliance
  // ===========================================================================

  timeEntries: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    issueId: v.optional(v.id("issues")),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.number(), // Seconds
    date: v.number(),
    description: v.optional(v.string()),
    activity: v.optional(v.string()), // "Development", "Meeting", etc.
    tags: v.array(v.string()),
    hourlyRate: v.optional(v.number()),
    totalCost: v.optional(v.number()),
    currency: v.string(),
    billable: v.boolean(),
    billed: v.boolean(),
    invoiceId: v.optional(v.string()),
    isEquityHour: v.boolean(),
    equityValue: v.optional(v.number()),
    isLocked: v.boolean(),
    isApproved: v.boolean(),
    approvedBy: v.optional(v.id("users")),
    approvedAt: v.optional(v.number()),
    updatedAt: v.number(),
    isDeleted: v.optional(v.boolean()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_issue", ["issueId"])
    .index("by_date", ["date"])
    .index("by_user_date", ["userId", "date"])
    .index("by_project_date", ["projectId", "date"])
    .index("by_billable", ["billable"])
    .index("by_billed", ["billed"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_equity", ["isEquityHour"])
    .index("by_deleted", ["isDeleted"]),

  userRates: defineTable({
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    hourlyRate: v.number(),
    currency: v.string(),
    effectiveFrom: v.number(),
    effectiveTo: v.optional(v.number()),
    rateType: v.union(v.literal("internal"), v.literal("billable")),
    setBy: v.id("users"),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_effective_from", ["effectiveFrom"])
    .index("by_effective_to", ["effectiveTo"])
    .index("by_rate_type", ["rateType"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    employmentType: v.union(v.literal("employee"), v.literal("contractor"), v.literal("intern")),
    maxHoursPerWeek: v.optional(v.number()),
    maxHoursPerDay: v.optional(v.number()),
    requiresApproval: v.optional(v.boolean()),
    canWorkOvertime: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    department: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    managerId: v.optional(v.id("users")),
    hasEquity: v.boolean(),
    equityPercentage: v.optional(v.number()),
    requiredEquityHoursPerWeek: v.optional(v.number()),
    requiredEquityHoursPerMonth: v.optional(v.number()),
    maxEquityHoursPerWeek: v.optional(v.number()),
    equityHourlyValue: v.optional(v.number()),
    equityNotes: v.optional(v.string()),
    isActive: v.boolean(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_employment_type", ["employmentType"])
    .index("by_manager", ["managerId"])
    .index("by_active", ["isActive"])
    .index("by_employment_active", ["employmentType", "isActive"]),

  employmentTypeConfigs: defineTable({
    type: employmentTypes,
    name: v.string(),
    description: v.optional(v.string()),
    defaultMaxHoursPerWeek: v.number(),
    defaultMaxHoursPerDay: v.number(),
    defaultRequiresApproval: v.boolean(),
    defaultCanWorkOvertime: v.boolean(),
    canAccessBilling: v.boolean(),
    canManageProjects: v.boolean(),
    isActive: v.boolean(),
    updatedAt: v.number(),
  }).index("by_type", ["type"]),

  hourComplianceRecords: defineTable({
    userId: v.id("users"),
    periodType: periodTypes,
    periodStart: v.number(),
    periodEnd: v.number(),
    totalHoursWorked: v.number(),
    totalEquityHours: v.optional(v.number()),
    requiredHoursPerWeek: v.optional(v.number()),
    requiredHoursPerMonth: v.optional(v.number()),
    requiredEquityHoursPerWeek: v.optional(v.number()),
    requiredEquityHoursPerMonth: v.optional(v.number()),
    maxHoursPerWeek: v.optional(v.number()),
    status: v.union(
      v.literal("compliant"),
      v.literal("under_hours"),
      v.literal("over_hours"),
      v.literal("equity_under"),
    ),
    hoursDeficit: v.optional(v.number()),
    hoursExcess: v.optional(v.number()),
    equityHoursDeficit: v.optional(v.number()),
    notificationSent: v.boolean(),
    notificationId: v.optional(v.id("notifications")),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    reviewNotes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_period", ["periodStart"])
    .index("by_status", ["status"])
    .index("by_user_period", ["userId", "periodStart"])
    .index("by_user_status", ["userId", "status"])
    .index("by_period_status", ["periodStart", "status"]),

  // ===========================================================================
  // API & REST
  // API keys, usage logs
  // ===========================================================================

  apiKeys: defineTable({
    userId: v.id("users"),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(), // "sk_casc_AbCdEfGh..."
    scopes: v.array(v.string()),
    projectId: v.optional(v.id("projects")),
    rateLimit: v.number(), // Requests per minute
    isActive: v.boolean(),
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(),
    expiresAt: v.optional(v.number()),
    rotatedFromId: v.optional(v.id("apiKeys")),
    rotatedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_key_hash", ["keyHash"])
    .index("by_active", ["isActive"])
    .index("by_user_active", ["userId", "isActive"])
    .index("by_rotated_from", ["rotatedFromId"])
    .index("by_expires", ["expiresAt"]),

  apiUsageLogs: defineTable({
    apiKeyId: v.id("apiKeys"),
    userId: v.id("users"),
    method: v.string(),
    endpoint: v.string(),
    statusCode: v.number(),
    responseTime: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_api_key", ["apiKeyId"])
    .index("by_user", ["userId"]),

  // ===========================================================================
  // SERVICE PROVIDERS (Free Tier Rotation)
  // Track usage across multiple providers
  // ===========================================================================

  serviceUsage: defineTable({
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai"),
    ),
    provider: v.string(),
    month: v.string(), // "2025-11"
    unitsUsed: v.number(),
    freeUnitsLimit: v.number(),
    paidUnitsUsed: v.number(),
    estimatedCost: v.number(), // Cents
    lastUpdatedAt: v.number(),
  })
    .index("by_service_type", ["serviceType"])
    .index("by_provider", ["provider"])
    .index("by_month", ["month"])
    .index("by_service_month", ["serviceType", "month"])
    .index("by_provider_month", ["provider", "month"]),

  serviceProviders: defineTable({
    serviceType: v.union(
      v.literal("transcription"),
      v.literal("email"),
      v.literal("sms"),
      v.literal("ai"),
    ),
    provider: v.string(),
    freeUnitsPerMonth: v.number(),
    freeUnitsType: v.union(v.literal("monthly"), v.literal("one_time"), v.literal("yearly")),
    oneTimeUnitsRemaining: v.optional(v.number()),
    costPerUnit: v.number(), // Cents
    unitType: v.string(), // "minute", "email", etc.
    isEnabled: v.boolean(),
    isConfigured: v.boolean(),
    priority: v.number(), // Lower = preferred
    displayName: v.string(),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_service_type", ["serviceType"])
    .index("by_provider", ["provider"])
    .index("by_service_enabled", ["serviceType", "isEnabled"])
    .index("by_service_priority", ["serviceType", "priority"]),

  // ===========================================================================
  // USER SETTINGS & ONBOARDING
  // ===========================================================================

  userSettings: defineTable({
    userId: v.id("users"),
    dashboardLayout: v.optional(dashboardLayout),
    theme: v.optional(v.string()), // "light", "dark", "system"
    sidebarCollapsed: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    timezone: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  userOnboarding: defineTable({
    userId: v.id("users"),
    onboardingCompleted: v.boolean(),
    onboardingStep: v.optional(v.number()),
    sampleWorkspaceCreated: v.optional(v.boolean()),
    sampleProjectCreated: v.optional(v.boolean()), // Deprecated
    tourShown: v.boolean(),
    wizardCompleted: v.boolean(),
    checklistDismissed: v.boolean(),
    onboardingPersona: v.optional(personas),
    wasInvited: v.optional(v.boolean()),
    invitedByName: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // ===========================================================================
  // INFRASTRUCTURE & SYSTEM
  // Rate limiting, auditing, testing, health checks
  // ===========================================================================

  auditLogs: defineTable({
    action: v.string(), // "team.create", "project.delete"
    actorId: v.optional(v.id("users")),
    targetId: v.string(),
    targetType: v.string(), // "team", "project", "user"
    metadata: v.optional(auditMetadata),
    timestamp: v.number(),
  })
    .index("by_action", ["action"])
    .index("by_actor", ["actorId"])
    .index("by_target", ["targetId"])
    .index("by_timestamp", ["timestamp"]),

  offlineSyncQueue: defineTable({
    userId: v.id("users"),
    mutationType: v.string(),
    mutationArgs: v.string(), // JSON
    status: v.union(
      v.literal("pending"),
      v.literal("syncing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    attempts: v.number(),
    lastAttempt: v.optional(v.number()),
    error: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // ===========================================================================
  // E2E TESTING & MONITORING
  // ===========================================================================

  twoFactorSessions: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    verifiedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"])
    .index("by_expires", ["expiresAt"]),

  testOtpCodes: defineTable({
    email: v.string(),
    code: v.string(),
    type: v.optional(v.string()), // "verification" | "reset"
    expiresAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_email_type", ["email", "type"])
    .index("by_expiry", ["expiresAt"]),

  oauthHealthChecks: defineTable({
    success: v.boolean(),
    latencyMs: v.number(),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  // Token health monitoring for user OAuth connections
  oauthTokenHealthChecks: defineTable({
    totalConnections: v.number(),
    healthyCount: v.number(),
    expiringSoonCount: v.number(),
    expiredCount: v.number(),
    invalidCount: v.number(),
    missingCount: v.number(),
    refreshedCount: v.number(),
    refreshFailedCount: v.number(),
    durationMs: v.number(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
};

// =============================================================================
// SCHEMA EXPORT
// =============================================================================

export default defineSchema({
  ...authTables,
  ...applicationTables,

  // Override users table to add custom fields (must include all auth fields)
  users: defineTable({
    // Required auth fields from @convex-dev/auth
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    // Pending email verification
    pendingEmail: v.optional(v.string()),
    pendingEmailVerificationToken: v.optional(v.string()),
    pendingEmailVerificationExpires: v.optional(v.number()),
    // Custom fields for Nixelo
    defaultOrganizationId: v.optional(v.id("organizations")),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    emailNotifications: v.optional(v.boolean()),
    desktopNotifications: v.optional(v.boolean()),
    // Invite tracking
    inviteId: v.optional(v.id("invites")),
    // E2E Testing fields
    isTestUser: v.optional(v.boolean()),
    testUserCreatedAt: v.optional(v.number()),
    // Two-Factor Authentication (2FA)
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()),
    twoFactorBackupCodes: v.optional(v.array(v.string())),
    twoFactorVerifiedAt: v.optional(v.number()),
    twoFactorLastUsedTime: v.optional(v.number()),
    // 2FA rate limiting
    twoFactorFailedAttempts: v.optional(v.number()),
    twoFactorLockedUntil: v.optional(v.number()),
  })
    .index("email", ["email"])
    .index("isTestUser", ["isTestUser"])
    .index("emailVerificationTime", ["emailVerificationTime"])
    .index("phone", ["phone"])
    .index("phoneVerificationTime", ["phoneVerificationTime"])
    .index("defaultOrganization", ["defaultOrganizationId"]),
});
